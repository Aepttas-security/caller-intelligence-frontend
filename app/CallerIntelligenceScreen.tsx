import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Modal,
  Platform,
  ToastAndroid,
  Alert,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, G, Rect } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/contexts/ThemeContext';
import { darkColors } from '../src/styles/theme';
import { Icon } from '../components/Icon';
import { useCallerIntelligence } from '../src/hooks/useCallerIntelligence';
import { useApkScanner } from '../src/hooks/useApkScanner';
import { useAppContext } from '../src/contexts/AppContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../src/services/api';

interface MockCall {
  name: string;
  number: string;
  riskScore: number;
  type: 'Normal' | 'Spam' | 'Scam' | 'High-Risk' | 'Suspicious';
  carrier: string;
  location: string;
  frequency: string;
}

interface BlockedNumber {
  number: string;
  name: string;
  reason: string;
  date: string;
}

interface SpamCall {
  name: string;
  number: string;
  riskScore: number;
  date: string;
}

interface CallReport {
  id: string;
  number: string;
  type: string;
  description: string;
  timestamp: string;
}

export default function CallerIntelligenceScreen() {
  const router = useRouter();
  const { mode, toggleTheme } = useTheme();
  const colors = darkColors;
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { dashboardMetrics } = useApkScanner();
  const { alerts, dashboardData, refreshCallHistory } = useAppContext();

  const {
    blockedNumbers,
    spamCalls,
    reportHistory,
    callHistory,
    autoBlockEnabled: hookAutoBlock,
    notificationsEnabled: hookNotifications,
    sensitivity,
    privacyLogging: hookPrivacy,
    addBlockedNumber,
    removeBlockedNumber,
    reportCall,
    toggleAutoBlock,
    toggleNotifications,
    updateSensitivity,
    togglePrivacyLogging,
  } = useCallerIntelligence();

  // ✅ LOCAL STATE for immediate toggle response (No more "stuck" buttons)
  const [localAutoBlock, setLocalAutoBlock] = useState(hookAutoBlock);
  const [localNotifications, setLocalNotifications] = useState(hookNotifications);
  const [localPrivacy, setLocalPrivacy] = useState(hookPrivacy);

  // Sync local state when hook data changes (e.g. on initial load)
  React.useEffect(() => { setLocalAutoBlock(hookAutoBlock); }, [hookAutoBlock]);
  React.useEffect(() => { setLocalNotifications(hookNotifications); }, [hookNotifications]);
  React.useEffect(() => { setLocalPrivacy(hookPrivacy); }, [hookPrivacy]);

  const handleToggleAutoBlock = (val: boolean) => {
    console.log('[Settings] Toggling Auto-Block:', val);
    setLocalAutoBlock(val);
    toggleAutoBlock(val);
  };

  const handleToggleNotifications = (val: boolean) => {
    console.log('[Settings] Toggling Notifications:', val);
    setLocalNotifications(val);
    toggleNotifications(val);
  };

  const handleTogglePrivacy = (val: boolean) => {
    console.log('[Settings] Toggling Privacy:', val);
    setLocalPrivacy(val);
    togglePrivacyLogging(val);
  };

  const [activeTab, setActiveTab] = useState<number>(0);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<MockCall | null>(null);
  const [searchResultSource, setSearchResultSource] = useState<'Saved' | 'Database' | null>(null);

  // Add New Contact Modal
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  const getRiskColor = (score: number) => {
    if (score <= 14) return '#00CC00'; // Green
    if (score <= 39) return '#FFD700'; // Yellow
    if (score <= 74) return '#FF8C00'; // Orange
    return '#FF0000'; // Red
  };

  // Simulator
  const [activeSimulatedCall, setActiveSimulatedCall] = useState<MockCall | null>(null);

  // Popups
  const [showSpamWarning, setShowSpamWarning] = useState(false);
  const [showScamAlert, setShowScamAlert] = useState(false);
  const [showHighRiskAlert, setShowHighRiskAlert] = useState(false);
  const [showBlockConfirmation, setShowBlockConfirmation] = useState(false);
  const [showReportPopup, setShowReportPopup] = useState(false);

  // Temp reporting variables
  const [reportType, setReportType] = useState('Robocall / Telemarketing');
  const [reportDesc, setReportDesc] = useState('');
  const [callerToBlockOrReport, setCallerToBlockOrReport] = useState<MockCall | null>(null);

  const showToast = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('Notice', message);
    }
  };

  const handleSimulateCall = (call: MockCall) => {
    setActiveSimulatedCall(call);

    // ✅ Trigger Native/Global Simulation logic
    const { NativeModules } = require('react-native');
    if (NativeModules.CallDetectionModule && NativeModules.CallDetectionModule.simulateCall) {
      NativeModules.CallDetectionModule.simulateCall(call.number);
    }

    if (call.type === 'Spam') {
      setShowSpamWarning(true);
    } else if (call.type === 'Scam') {
      setShowScamAlert(true);
    } else if (call.type === 'High-Risk') {
      setShowHighRiskAlert(true);
    }
  };

  const handleAddContact = async () => {
    if (!newContactName || !newContactPhone) {
      showToast('Please enter both name and phone number');
      return;
    }
    try {
      // ✅ PROMPT 1: Use /api/callers/upload as requested
      await api.uploadCallers([{ caller_name: newContactName, phone_number: newContactPhone }]);

      showToast(`Contact ${newContactName} saved to Shield Database`);
      setShowAddContactModal(false);
      setNewContactName('');
      setNewContactPhone('');

      // Refresh relevant data
      refreshCallHistory();
    } catch (error) {
      showToast('Failed to save contact to database');
    }
  };

  const handleSearch = async () => {
    if (searchQuery.trim().length > 0) {
      const cleanQuery = searchQuery.trim().replace(/\D/g, '');
      setSearchResult(null); // Clear previous result while loading

      try {
        // ✅ PROMPT 1: Query ONLY apt.apt_callers_b via standard API
        const dbResult = await api.lookupCaller(cleanQuery);
        console.log('[Search] API Result:', dbResult);

        if (dbResult) {
            setSearchResult({
                name: dbResult.caller_name || 'Unknown Caller',
                number: dbResult.phone_number || cleanQuery,
                riskScore: dbResult.risk_score || 0,
                type: dbResult.risk_score >= 75 ? 'Scam' : dbResult.risk_score >= 40 ? 'Spam' : 'Normal',
                carrier: dbResult.carrier || 'Unknown Carrier',
                location: dbResult.location || 'India',
                frequency: dbResult.exists ? `Reports: ${dbResult.total_reports || 0}` : 'New Number'
            });
            setSearchResultSource('Database');
        }
      } catch (e) {
          console.error('[Search] API Error:', e);
          showToast('Search failed: Connection error');
      }
    }
  };

  // Score circular gauge
  const radius = 40;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const currentScore = dashboardMetrics?.device_security_score || 94;
  const angle = (currentScore / 100) * 260;
  const strokeDashoffset = circumference - (angle / 360) * circumference;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#030712" />
      <View style={styles.contentWrapper}>

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (activeTab !== 0) {
              setActiveTab(0);
            } else {
              router.back();
            }
          }}
        >
          <Icon name="arrow-back" color={colors.text} size={20} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Caller Intelligence</Text>
          <Text style={styles.headerSubtitle}>Real-Time Call Shield & Spam Analysis Hub</Text>
        </View>
      </View>

      {/* Tabs Row */}
      <View style={styles.tabsRowContainer}>
        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={styles.tabsRow}>
          {[
            'Dashboard',
            'Live Call Simulator',
            'Number Search',
            'Call History',
            'Spam & Blocked',
            'Analytics & Settings'
          ].map((label, idx) => {
            const isSelected = activeTab === idx;
            return (
              <TouchableOpacity
                key={label}
                style={[styles.tabBtn, isSelected && styles.tabBtnActive]}
                onPress={() => setActiveTab(idx)}
              >
                <Text style={[styles.tabBtnText, isSelected && styles.tabBtnTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* VIEW PANEL CONTROLLER */}
      <ScrollView contentContainerStyle={styles.viewContent}>
        {activeTab === 0 && (
          <View style={{ width: '100%' }}>
            {/* Security Score Widget */}
            <View style={styles.dashboardCard}>
              <View style={styles.gaugeRow}>
                <View style={styles.gaugeContainer}>
                  <Svg width={90} height={90} viewBox="0 0 100 100">
                    <G rotation="-220" origin="50, 50">
                      <Circle
                        cx="50"
                        cy="50"
                        r={radius}
                        stroke="#140c3f"
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeDasharray={`${(260 / 360) * circumference} ${circumference}`}
                        strokeLinecap="round"
                      />
                      <Circle
                        cx="50"
                        cy="50"
                        r={radius}
                        stroke={colors.cyanAccent}
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                      />
                    </G>
                  </Svg>
                  <View style={styles.gaugeTextWrapper}>
                    <Text style={styles.gaugePct}>{currentScore}%</Text>
                    <Text style={styles.gaugeLabel}>Secure</Text>
                  </View>
                </View>

                <View style={styles.gaugeInfo}>
                  <Text style={styles.gaugeInfoTitle}>Caller Security Score</Text>
                  <Text style={styles.gaugeInfoSub}>Shield is actively filtering unknown incoming calls.</Text>
                  <View style={styles.statusBadge}>
                    <View style={styles.greenStatusDot} />
                    <Text style={styles.statusText}>Protected & Safe</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Call Stats Grid */}
            <View style={styles.statsRow}>
              <View style={styles.statWidget}>
                <Text style={styles.statWidgetLabel}>Calls Today</Text>
                <Text style={styles.statWidgetValue}>
                  {dashboardData?.total_calls_today || 0}
                </Text>
              </View>
              <View style={[styles.statWidget, { borderColor: colors.orangeWarning + '55' }]}>
                <Text style={styles.statWidgetLabel}>Spam Calls</Text>
                <Text style={[styles.statWidgetValue, { color: colors.orangeWarning }]}>
                  {dashboardData?.spam_calls_detected || 0}
                </Text>
              </View>
              <View style={[styles.statWidget, { borderColor: colors.redDanger + '55' }]}>
                <Text style={styles.statWidgetLabel}>Blocked Calls</Text>
                <Text style={[styles.statWidgetValue, { color: colors.redDanger }]}>
                  {dashboardData?.blocked_calls_count || 0}
                </Text>
              </View>
            </View>

            {/* Recent Alerts */}
            <Text style={styles.sectionTitle}>RECENT SECURITY ALERTS</Text>
            {alerts && alerts.length > 0 ? (
              alerts.slice(0, 5).map((alert, idx) => (
                <View key={alert.id || idx} style={styles.alertItem}>
                  <Icon name="notifications-active" color={colors.cyanAccent} size={16} />
                  <Text style={styles.alertText}>
                    {alert.alert_type}: {alert.caller_number} - {alert.message}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.alertItem}>
                <Icon name="info" color={colors.textMuted} size={16} />
                <Text style={styles.alertText}>No recent security alerts detected.</Text>
              </View>
            )}

            {/* Quick Actions */}
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>QUICK ACTION CHANNELS</Text>
            <View style={styles.statsRow}>
              <TouchableOpacity style={styles.actionWidget} onPress={() => setActiveTab(1)}>
                <Icon name="phone-callback" color={colors.greenSuccess} size={24} />
                <Text style={styles.actionWidgetTitle}>Simulate Live Call</Text>
                <Text style={styles.actionWidgetSub}>Test shield triggers</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionWidget} onPress={() => setActiveTab(2)}>
                <Icon name="search" color={colors.cyanAccent} size={24} />
                <Text style={styles.actionWidgetTitle}>Directory Lookup</Text>
                <Text style={styles.actionWidgetSub}>Reputation database</Text>
              </TouchableOpacity>
            </View>

            {/* Inline Sponsored Flipkart Ad */}
            <View style={[styles.modalContent, { borderColor: '#ffd900', borderWidth: 1, marginTop: 24 }]}>
              <View style={styles.adHeader}>
                <Icon name="info" color="#ffd900" size={14} />
                <Text style={styles.adHeaderTag}>SPONSORED BY FLIPKART</Text>
              </View>

              <View style={styles.adBanner}>
                <Svg width="100%" height="100%" style={StyleSheet.absoluteFill as any}>
                  <Circle cx="120" cy="60" r="60" fill="#2874f0" opacity={0.1} />
                  <Circle cx="120" cy="60" r="40" fill="#ffd900" opacity={0.1} />
                  <Path
                    d="M107 45 A15 15 0 0 1 133 45"
                    fill="none"
                    stroke="#ffd900"
                    strokeWidth="2"
                  />
                  <Rect x="100" y="45" width="40" height="50" rx="4" ry="4" fill="#2874f0" />
                </Svg>
                <View style={styles.adBannerTexts}>
                  <Text style={styles.adBannerTitle}>BIG BILLION DAYS</Text>
                  <Text style={styles.adBannerSub}>UP TO 80% OFF ON ALL CATEGORIES</Text>
                </View>
              </View>

              <Text style={styles.adMainTitle}>Flipkart Mega Deals Live!</Text>

              <Text style={styles.adDescription}>
                Get massive discounts on Smartphones, Laptops, Fashion & Home Decor. Extra 10% instant discount with HDFC, SBI and Axis Credit Cards. Limited hours remaining!
              </Text>

              <TouchableOpacity
                style={styles.adCtaBtn}
                onPress={() => showToast('Redirecting to Flipkart Special Deal store...')}
              >
                <LinearGradient
                  colors={['#2874f0', '#ffd900']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.adCtaGradient}
                >
                  <Text style={styles.adCtaBtnText}>Claim Flipkart Deals Now</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === 1 && (
          <View style={{ width: '100%' }}>
            <Text style={styles.sectionTitle}>ACTIVE INCOMING CALL SIMULATION ENGINE</Text>
            <View style={styles.simulatorBtnsRow}>
              <TouchableOpacity
                style={[styles.simBtn, { borderColor: colors.greenSuccess }]}
                onPress={() =>
                  handleSimulateCall({
                    name: 'Trusted Family Member',
                    number: '+1 (555) 019-2831',
                    riskScore: 2,
                    type: 'Normal',
                    carrier: 'Verizon Wireless',
                    location: 'San Jose, CA',
                    frequency: '12 calls/week'
                  })
                }
              >
                <Text style={styles.simBtnText}>Safe Call</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.simBtn, { borderColor: colors.orangeWarning }]}
                onPress={() =>
                  handleSimulateCall({
                    name: 'Telemarketing Robocall',
                    number: '+1 (202) 555-0143',
                    riskScore: 85,
                    type: 'Spam',
                    carrier: 'Level 3 Telecom',
                    location: 'Seattle, WA',
                    frequency: '45 calls/week'
                  })
                }
              >
                <Text style={styles.simBtnText}>Spam Call</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.simBtn, { borderColor: colors.redDanger }]}
                onPress={() =>
                  handleSimulateCall({
                    name: 'IRS Impostor Fraud',
                    number: '+1 (866) 492-3001',
                    riskScore: 98,
                    type: 'Scam',
                    carrier: 'VoIP Core',
                    location: 'Washington DC, USA',
                    frequency: '88 calls/week'
                  })
                }
              >
                <Text style={styles.simBtnText}>Scam Call</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.simBtn, { borderColor: '#ff1111' }]}
                onPress={() =>
                  handleSimulateCall({
                    name: 'Bank Fraud Hijacker',
                    number: '+1 (800) 999-5566',
                    riskScore: 99,
                    type: 'High-Risk',
                    carrier: 'Imposter Network',
                    location: 'New York, USA',
                    frequency: '150 calls/week'
                  })
                }
              >
                <Text style={styles.simBtnText}>High-Risk Call</Text>
              </TouchableOpacity>
            </View>

            {/* Simulated Active Call Screen */}
            {activeSimulatedCall ? (
              <View style={[styles.callScreenCard, {
                backgroundColor: activeSimulatedCall.type === 'Spam' || activeSimulatedCall.type === 'Scam' || activeSimulatedCall.type === 'High-Risk'
                  ? 'rgba(239, 68, 68, 0.2)'
                  : activeSimulatedCall.type === 'Normal'
                  ? 'rgba(16, 185, 129, 0.2)'
                  : activeSimulatedCall.type === 'Suspicious'
                  ? 'rgba(245, 158, 11, 0.2)'
                  : '#0b0f19'
              }]}>
                <Icon name="phone-in-talk" color={
                  activeSimulatedCall.type === 'Spam' || activeSimulatedCall.type === 'Scam' || activeSimulatedCall.type === 'High-Risk'
                    ? colors.redDanger
                    : activeSimulatedCall.type === 'Normal'
                    ? colors.greenSuccess
                    : activeSimulatedCall.type === 'Suspicious'
                    ? colors.orangeWarning
                    : colors.purpleAccent
                } size={48} />
                <Text style={styles.callScreenName}>{activeSimulatedCall.name}</Text>
                <Text style={styles.callScreenNumber}>{activeSimulatedCall.number}</Text>
                <Text style={styles.callScreenCarrier}>
                  Carrier: {activeSimulatedCall.carrier} | {activeSimulatedCall.location}
                </Text>
                <Text
                  style={[
                    styles.callScreenScore,
                    {
                      color:
                        activeSimulatedCall.riskScore > 80
                          ? colors.redDanger
                          : activeSimulatedCall.riskScore > 50
                          ? colors.orangeWarning
                          : colors.greenSuccess,
                    },
                  ]}
                >
                  Risk Score: {activeSimulatedCall.riskScore}%
                </Text>

                <View style={styles.callActionsRow}>
                  <TouchableOpacity
                    style={[styles.callBtn, { backgroundColor: 'rgba(107, 110, 133, 0.2)' }]}
                    onPress={() => {
                      showToast(`Call allowed from ${activeSimulatedCall.name}`);
                      setActiveSimulatedCall(null);
                    }}
                  >
                    <Text style={styles.callBtnText}>Allow</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.callBtn, { backgroundColor: colors.redDanger }]}
                    onPress={() => {
                      setCallerToBlockOrReport(activeSimulatedCall);
                      setShowBlockConfirmation(true);
                    }}
                  >
                    <Text style={styles.callBtnText}>Block</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.callBtn, { backgroundColor: colors.cyanAccent }]}
                    onPress={() => {
                      setCallerToBlockOrReport(activeSimulatedCall);
                      setReportDesc('');
                      setShowReportPopup(true);
                    }}
                  >
                    <Text style={[styles.callBtnText, { color: '#000' }]}>Report</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.callScreenCardEmpty}>
                <Icon name="phone-in-talk" color="#6B6E85" size={48} />
                <Text style={styles.emptyCallText}>No simulated call active. Tap one of the triggers above.</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 2 && (
          <View style={{ width: '100%' }}>
            <View style={styles.searchCard}>
              <Text style={styles.searchTitle}>Reputation Directory Search</Text>
              <Text style={styles.searchSub}>Lookup the trust index of any phone number</Text>

              <View style={styles.searchInputRow}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Enter number (e.g. +1 (800) 555-0199)"
                  placeholderTextColor={colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  keyboardType="phone-pad"
                />
                <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
                  <Text style={styles.searchBtnText}>Search</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.simBtn, { width: '100%', marginTop: 12, borderColor: '#06b6d4', borderStyle: 'dashed', borderWidth: 2, height: 50, backgroundColor: 'rgba(6, 182, 212, 0.05)' }]}
                onPress={() => setShowAddContactModal(true)}
              >
                <Text style={[styles.simBtnText, { color: '#06b6d4', fontWeight: 'bold' }]}>Add New Contact</Text>
              </TouchableOpacity>
            </View>

            {searchResult && (
              <View style={styles.searchResultCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.resultTitle}>Search Result Details:</Text>
                  {(searchResultSource || searchResult.name.includes('Call:')) && (
                    <View style={{ backgroundColor: searchResult.name.includes('Call:') ? colors.greenSuccess + '33' : 'rgba(123, 44, 191, 0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                      <Text style={{ fontSize: 9, color: searchResult.name.includes('Call:') ? colors.greenSuccess : colors.cyanAccent, fontWeight: 'bold' }}>
                        {searchResult.name.includes('Call:') ? 'NETWORK VERIFIED' : searchResultSource?.toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.resultName}>{searchResult.name}</Text>
                <Text style={styles.resultNumber}>{searchResult.number}</Text>
                <Text style={styles.resultSub}>Carrier: {searchResult.carrier}</Text>
                <Text style={styles.resultSub}>Location: {searchResult.location}</Text>
                <Text
                  style={[
                    styles.resultScoreText,
                    {
                      color: getRiskColor(searchResult.riskScore),
                    },
                  ]}
                >
                  Risk Index: {searchResult.riskScore}/100
                </Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 3 && (
          <View style={{ width: '100%' }}>
            <Text style={styles.sectionTitle}>CALL HISTORY LOGS (LATEST FIRST)</Text>
            {callHistory.length > 0 ? (
              callHistory.map((call, idx) => {
                const score = call.riskScore ?? 0;

                // Professional professional colors
                let bgColor = 'rgba(16, 185, 129, 0.08)'; // Softer Green
                let labelColor = '#10b981';

                const status = (call.status || '').toLowerCase();
                const direction = (call.call_type || '').toUpperCase();

                if (status === 'scam' || status === 'spam' || score >= 60) {
                  bgColor = 'rgba(245, 158, 11, 0.12)'; // Softer Yellow
                  labelColor = '#fbbf24';
                  if (score >= 85) {
                      bgColor = 'rgba(239, 68, 68, 0.12)'; // Softer Red
                      labelColor = '#f87171';
                  }
                }

                // Reactive check: Use the live blockedNumbers registry for the toggle state
                const isBlocked = blockedNumbers.some(b => b.number === call.number);

                // ✅ PROMPT 3: Color entire item based on risk_score
                let itemBgColor = '#0f172a';
                let itemBorderColor = '#22c55e'; // Green < 15
                if (score >= 70) {
                  itemBgColor = 'rgba(239, 68, 68, 0.15)';
                  itemBorderColor = '#ef4444'; // Red
                } else if (score >= 40) {
                  itemBgColor = 'rgba(249, 115, 22, 0.15)';
                  itemBorderColor = '#f97316'; // Orange
                } else if (score >= 15) {
                  itemBgColor = 'rgba(234, 179, 8, 0.15)';
                  itemBorderColor = '#eab308'; // Yellow
                } else {
                  itemBgColor = 'rgba(34, 197, 94, 0.1)';
                }

                return (
                  <View key={idx} style={[styles.historyRow, { backgroundColor: itemBgColor, borderColor: isBlocked ? '#ef4444' : itemBorderColor, borderWidth: 2, borderRadius: 16, marginBottom: 12, paddingVertical: 14, paddingHorizontal: 16, elevation: 4 }]}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                         <Icon name={direction === 'OUTGOING' ? 'call-made' : direction === 'MISSED' ? 'call-missed' : 'call-received'} color="#fff" size={16} />
                         <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginLeft: 8 }}>{call.name || 'Unknown Caller'}</Text>
                      </View>
                      <Text style={{ color: '#94a3b8', fontSize: 13, marginTop: 4, fontWeight: '600' }}>{call.number}</Text>

                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                         <View style={{ backgroundColor: isBlocked ? 'rgba(239, 68, 68, 0.15)' : (labelColor + '22'), paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginRight: 10, borderWidth: 1, borderColor: isBlocked ? '#ef444444' : (labelColor + '44') }}>
                            <Text style={{ color: isBlocked ? '#ef4444' : labelColor, fontSize: 10, fontWeight: 'bold' }}>
                                {isBlocked ? 'BLOCKED' : (call.status || 'Safe').toUpperCase()}
                            </Text>
                         </View>
                         <Text style={{ color: '#64748b', fontSize: 11, fontWeight: '500' }}>{direction} • {call.duration} • {call.date}</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={{
                        backgroundColor: isBlocked ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                        borderWidth: 1.5,
                        borderColor: isBlocked ? '#10b981' : '#ef4444',
                        borderRadius: 12,
                        width: 100,
                        height: 44,
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                      onPress={() => {
                        if (isBlocked) {
                          removeBlockedNumber(call.number);
                          showToast(`Unblocked: ${call.number}`);
                        } else {
                          setCallerToBlockOrReport({ name: call.name, number: call.number } as any);
                          setShowBlockConfirmation(true);
                        }
                      }}
                    >
                      <Text style={{ color: isBlocked ? '#10b981' : '#ef4444', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 }}>
                        {isBlocked ? 'UNBLOCK' : 'BLOCK'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            ) : (
              <View style={styles.listEmptyPlaceholder}>
                <Icon name="phone" color={colors.textMuted} size={48} />
                <Text style={styles.placeholderText}>All incoming calls cleared. Secure filter active.</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 4 && (
          <View style={{ width: '100%' }}>
            <Text style={styles.sectionTitle}>SPAM CALLS LOG</Text>
            {spamCalls.length > 0 ? (
              spamCalls.map((spam, idx) => {
                const isBlocked = blockedNumbers.some(b => b.number === spam.number);
                const score = spam.riskScore || 0;

                // ✅ PROMPT 3: Color entire item based on risk_score
                let itemBgColor = '#0f172a';
                let itemBorderColor = '#22c55e';
                if (score >= 70) {
                  itemBgColor = 'rgba(239, 68, 68, 0.15)';
                  itemBorderColor = '#ef4444';
                } else if (score >= 40) {
                  itemBgColor = 'rgba(249, 115, 22, 0.15)';
                  itemBorderColor = '#f97316';
                } else if (score >= 15) {
                  itemBgColor = 'rgba(234, 179, 8, 0.15)';
                  itemBorderColor = '#eab308';
                } else {
                  itemBgColor = 'rgba(34, 197, 94, 0.1)';
                }

                return (
                  <View key={idx} style={[styles.blockedRow, { backgroundColor: itemBgColor, paddingHorizontal: 16, paddingVertical: 16, borderRadius: 16, marginBottom: 12, borderBottomWidth: 0, borderColor: isBlocked ? '#ef4444' : itemBorderColor, borderWidth: 2 }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>{spam.name}</Text>
                      <Text style={{ color: '#cbd5e1', fontSize: 14, marginTop: 4 }}>{spam.number}</Text>
                      <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 8 }}>{spam.reportType} • {spam.date}</Text>
                    </View>
                    <TouchableOpacity
                      style={{
                        backgroundColor: isBlocked ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        borderWidth: 1,
                        borderColor: isBlocked ? '#10b981' : '#ef4444',
                        borderRadius: 10,
                        paddingHorizontal: 16,
                        paddingVertical: 10
                      }}
                      onPress={() => {
                        if (isBlocked) {
                          removeBlockedNumber(spam.number);
                          showToast(`Unblocked ${spam.number}`);
                        } else {
                          addBlockedNumber(spam.number, spam.name, 'Manual Block from Spam List');
                          showToast(`Blocked ${spam.number}`);
                        }
                      }}
                    >
                      <Text style={{ color: isBlocked ? '#10b981' : '#ef4444', fontSize: 11, fontWeight: 'bold' }}>
                        {isBlocked ? 'UNBLOCK' : 'BLOCK'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            ) : (
              <View style={[styles.listEmptyPlaceholder, { backgroundColor: 'transparent' }]}>
                <Text style={{ color: '#64748b', fontSize: 13 }}>No active spam calls recorded today.</Text>
              </View>
            )}

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>BLOCKED TELEPHONY REGISTRY</Text>
            {blockedNumbers.length > 0 ? (
              blockedNumbers.map((blocked, idx) => {
                const score = (blocked as any).riskScore || 0;
                let itemBgColor = '#0f172a';
                let itemBorderColor = '#22c55e';
                if (score >= 70) {
                   itemBgColor = 'rgba(239, 68, 68, 0.15)';
                   itemBorderColor = '#ef4444';
                } else if (score >= 40) {
                   itemBgColor = 'rgba(249, 115, 22, 0.15)';
                   itemBorderColor = '#f97316';
                } else if (score >= 15) {
                   itemBgColor = 'rgba(234, 179, 8, 0.15)';
                   itemBorderColor = '#eab308';
                } else {
                   itemBgColor = 'rgba(34, 197, 94, 0.1)';
                }

                return (
                  <View key={idx} style={[styles.blockedRow, { backgroundColor: itemBgColor, paddingHorizontal: 16, paddingVertical: 16, borderRadius: 16, marginBottom: 12, borderBottomWidth: 0, borderColor: itemBorderColor, borderWidth: 2 }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>{blocked.name}</Text>
                      <Text style={{ color: '#cbd5e1', fontSize: 14, marginTop: 4 }}>{blocked.number}</Text>
                      <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 8 }}>Reason: <Text style={{color: '#fbbf24'}}>{blocked.reason}</Text> • {blocked.date}</Text>
                    </View>
                    <TouchableOpacity
                      style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderWidth: 1, borderColor: '#10b981', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 }}
                      onPress={() => {
                        removeBlockedNumber(blocked.number);
                        showToast(`Unblocked: ${blocked.number}`);
                      }}
                    >
                      <Text style={{ color: '#10b981', fontSize: 11, fontWeight: 'bold' }}>UNBLOCK</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            ) : (
              <View style={[styles.listEmptyPlaceholder, { backgroundColor: 'transparent' }]}>
                <Text style={{ color: '#64748b', fontSize: 13 }}>Blocklist is empty. Filter active.</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 5 && (
          <View style={{ width: '100%', minHeight: 400 }}>
            <View style={styles.settingCard}>
              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingTitle}>Auto-Block High-Risk Calls</Text>
                  <Text style={styles.settingSub}>Silently terminate known fraud senders</Text>
                </View>
                <Switch
                  value={!!localAutoBlock}
                  onValueChange={handleToggleAutoBlock}
                  trackColor={{ true: '#8b5cf6', false: '#1e293b' }}
                  thumbColor={localAutoBlock ? '#FFFFFF' : '#64748b'}
                />
              </View>

              <View style={[styles.switchRow, { marginTop: 30 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingTitle}>Spam Alert Notifications</Text>
                  <Text style={styles.settingSub}>Display floating warning banners for risk callers</Text>
                </View>
                <Switch
                  value={!!localNotifications}
                  onValueChange={handleToggleNotifications}
                  trackColor={{ true: '#8b5cf6', false: '#1e293b' }}
                  thumbColor={localNotifications ? '#FFFFFF' : '#64748b'}
                />
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingTitle}>Privacy-Preserving Logging</Text>
                  <Text style={styles.settingSub}>Anonymize numbers before threat analysis uploads</Text>
                </View>
                <Switch
                  value={!!localPrivacy}
                  onValueChange={handleTogglePrivacy}
                  trackColor={{ true: '#8b5cf6', false: '#1e293b' }}
                  thumbColor={localPrivacy ? '#FFFFFF' : '#64748b'}
                />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* POPUP 1: SPAM WARNING DIALOG */}
      <Modal transparent={true} visible={showSpamWarning && activeSimulatedCall !== null} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { borderColor: colors.orangeWarning }]}>
            <View style={styles.popupHeader}>
              <Icon name="warning" color={colors.orangeWarning} size={36} />
              <Text style={styles.popupTitle}>SPAM CALL DETECTED</Text>
            </View>
            {activeSimulatedCall && (
              <>
                <Text style={styles.popupSub}>Number: {activeSimulatedCall.number}</Text>
                <Text style={[styles.popupRiskText, { color: colors.redDanger }]}>
                  Risk Score: {activeSimulatedCall.riskScore}%
                </Text>
                <Text style={styles.popupDesc}>
                  This number matches active automated spam networks. We recommend blocking this caller.
                </Text>

                <View style={styles.popupActions}>
                  <TouchableOpacity
                    style={[styles.popupBtn, { backgroundColor: 'rgba(107, 110, 133, 0.2)' }]}
                    onPress={() => {
                      showToast('Call allowed under observation');
                      setShowSpamWarning(false);
                    }}
                  >
                    <Text style={styles.popupBtnText}>Allow</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.popupBtn, { backgroundColor: colors.redDanger }]}
                    onPress={() => {
                      addBlockedNumber(activeSimulatedCall.number, activeSimulatedCall.name, 'Spam Network Warning');
                      showToast('Caller Blocked');
                      setActiveSimulatedCall(null);
                      setShowSpamWarning(false);
                    }}
                  >
                    <Text style={styles.popupBtnText}>Block</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* POPUP 2: SCAM WARNING DIALOG */}
      <Modal transparent={true} visible={showScamAlert && activeSimulatedCall !== null} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { borderColor: colors.redDanger, backgroundColor: '#2E0914' }]}>
            <View style={styles.popupHeader}>
              <Icon name="gavel" color={colors.redDanger} size={36} />
              <Text style={styles.popupTitle}>IMMEDIATE SCAM WARNING</Text>
            </View>
            {activeSimulatedCall && (
              <>
                <Text style={[styles.popupRiskText, { color: colors.redDanger, fontWeight: '900' }]}>
                  Threat Level: CRITICAL RISK
                </Text>
                <Text style={styles.popupSub}>Caller: {activeSimulatedCall.name}</Text>
                <Text style={styles.popupSub}>Number: {activeSimulatedCall.number}</Text>
                <Text style={styles.popupDesc}>
                  Recommended Action: HANG UP IMMEDIATELY. This caller has been reported trying to spoof government bodies for credential fraud.
                </Text>

                <View style={styles.popupActions}>
                  <TouchableOpacity style={styles.popupTextBtn} onPress={() => setShowScamAlert(false)}>
                    <Text style={styles.popupTextBtnText}>Dismiss Alert</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.popupBtn, { backgroundColor: colors.redDanger }]}
                    onPress={() => {
                      addBlockedNumber(activeSimulatedCall.number, activeSimulatedCall.name, 'Scam Warning Block');
                      showToast('Scam Number Terminated & Blocked');
                      setActiveSimulatedCall(null);
                      setShowScamAlert(false);
                    }}
                  >
                    <Text style={styles.popupBtnText}>Block & Report</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* POPUP 3: HIGH-RISK CALLER DIALOG */}
      <Modal transparent={true} visible={showHighRiskAlert && activeSimulatedCall !== null} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { borderColor: '#ff1111', backgroundColor: '#2e0000' }]}>
            <View style={styles.popupHeader}>
              <Icon name="cancel" color="#ff1111" size={44} />
              <Text style={styles.popupTitle}>CRITICAL: HIGH RISK ATTACK</Text>
            </View>
            {activeSimulatedCall && (
              <>
                <Text style={[styles.popupRiskText, { color: '#ff1111', fontWeight: '900' }]}>
                  Risk Evaluation Score: {activeSimulatedCall.riskScore}%
                </Text>
                <Text style={styles.popupDesc}>
                  This caller is linked to known financial phishing campaigns. The connection is highly suspicious.
                </Text>

                <TouchableOpacity
                  style={[styles.primaryBtn, { backgroundColor: '#ff1111', height: 46 }]}
                  onPress={() => {
                    addBlockedNumber(activeSimulatedCall.number, activeSimulatedCall.name, 'Critical AI High-Risk Auto-Block');
                    showToast('Immediate Block Executed');
                    setActiveSimulatedCall(null);
                    setShowHighRiskAlert(false);
                  }}
                >
                  <Text style={styles.primaryBtnText}>IMMEDIATE BLOCK SENDER</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.popupTextBtn, { marginTop: 12 }]} onPress={() => setShowHighRiskAlert(false)}>
                  <Text style={styles.popupTextBtnText}>Ignore Risk (Dangerous)</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* POPUP 4: BLOCK CONFIRMATION */}
      <Modal transparent={true} visible={showBlockConfirmation && callerToBlockOrReport !== null} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.popupTitle}>Confirm Block Caller</Text>
            {callerToBlockOrReport && (
              <>
                <Text style={styles.popupDesc}>
                  Are you sure you want to block calls and texts from {callerToBlockOrReport.name} ({callerToBlockOrReport.number})?
                </Text>

                <View style={styles.popupActions}>
                  <TouchableOpacity style={styles.popupTextBtn} onPress={() => setShowBlockConfirmation(false)}>
                    <Text style={styles.popupTextBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.popupBtn, { backgroundColor: colors.redDanger }]}
                    onPress={() => {
                      addBlockedNumber(callerToBlockOrReport.number, callerToBlockOrReport.name, 'User Block');
                      showToast('Caller Blocked');
                      setActiveSimulatedCall(null);
                      setShowBlockConfirmation(false);
                    }}
                  >
                    <Text style={styles.popupBtnText}>Confirm Block</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* POPUP 5: REPORT SENDER FORM */}
      <Modal transparent={true} visible={showReportPopup && callerToBlockOrReport !== null} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { borderColor: colors.cyanAccent }]}>
            <Text style={styles.popupTitle}>Report Caller to Threat Database</Text>
            {callerToBlockOrReport && (
              <>
                <Text style={styles.reportFormLabel}>Report Type:</Text>
                {['Robocall / Telemarketing', 'Phishing / Identity Theft', 'Government Impersonation', 'Harassment'].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={styles.radioRow}
                    onPress={() => setReportType(type)}
                  >
                    <View style={styles.radioOuter}>
                      {reportType === type && <View style={styles.radioInner} />}
                    </View>
                    <Text style={styles.radioLabel}>{type}</Text>
                  </TouchableOpacity>
                ))}

                <TextInput
                  style={styles.reportInput}
                  placeholder="Incident Description (Optional)"
                  placeholderTextColor={colors.textMuted}
                  value={reportDesc}
                  onChangeText={setReportDesc}
                  multiline={true}
                />

                <View style={styles.popupActions}>
                  <TouchableOpacity style={styles.popupTextBtn} onPress={() => setShowReportPopup(false)}>
                    <Text style={styles.popupTextBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.popupBtn, { backgroundColor: colors.cyanAccent }]}
                    onPress={() => {
                      reportCall(callerToBlockOrReport.number, reportType, reportDesc || 'No description provided.');
                      showToast('Report Submitted. Thank you for securing the network!');
                      setShowReportPopup(false);
                    }}
                  >
                    <Text style={[styles.popupBtnText, { color: '#000' }]}>Submit Report</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* NEW POPUP: ADD NEW CONTACT */}
      <Modal transparent={true} visible={showAddContactModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { borderColor: '#06b6d422', backgroundColor: '#0f172a', borderWidth: 1, borderRadius: 24, padding: 24, width: '85%' }]}>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowAddContactModal(false)}>
              <Icon name="close" color="#64748b" size={20} />
            </TouchableOpacity>

            <Text style={{ fontSize: 18, color: '#FFFFFF', marginBottom: 24, textAlign: 'center', fontWeight: 'bold' }}>Add New Contact</Text>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 8, fontWeight: '600' }}>NAME</Text>
              <TextInput
                style={{ width: '100%', height: 50, backgroundColor: '#1e293b', color: '#FFFFFF', borderRadius: 12, paddingHorizontal: 16, fontSize: 16 }}
                placeholder="John Doe"
                placeholderTextColor="#475569"
                value={newContactName}
                onChangeText={setNewContactName}
              />
            </View>

            <View style={{ marginBottom: 32 }}>
              <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 8, fontWeight: '600' }}>PHONE NUMBER</Text>
              <TextInput
                style={{ width: '100%', height: 50, backgroundColor: '#1e293b', color: '#FFFFFF', borderRadius: 12, paddingHorizontal: 16, fontSize: 16 }}
                placeholder="+91..."
                placeholderTextColor="#475569"
                value={newContactPhone}
                onChangeText={setNewContactPhone}
                keyboardType="phone-pad"
              />
            </View>

            <TouchableOpacity
              style={{ backgroundColor: '#06b6d4', borderRadius: 12, height: 46, width: '60%', alignSelf: 'center', justifyContent: 'center', alignItems: 'center' }}
              onPress={handleAddContact}
            >
              <Text style={{ color: '#000', fontSize: 14, fontWeight: 'bold' }}>Save New Contact</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </View>
    </View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  contentWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0F0A2B',
    borderWidth: 1,
    borderColor: '#337b2cbf',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    marginLeft: 16,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#6B6E85',
    fontSize: 11,
    marginTop: 2,
  },
  tabsRowContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 6,
  },
  tabsRow: {
    paddingHorizontal: 14,
  },
  tabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#07051F',
    borderWidth: 1,
    borderColor: 'rgba(123, 44, 191, 0.12)',
    marginRight: 8,
  },
  tabBtnActive: {
    backgroundColor: 'rgba(0, 119, 182, 0.2)',
    borderColor: '#00E5FF',
  },
  tabBtnText: {
    fontSize: 11,
    color: '#6B6E85',
  },
  tabBtnTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  viewContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  dashboardCard: {
    width: '100%',
    borderRadius: 14,
    backgroundColor: '#0A0726',
    borderWidth: 1,
    borderColor: 'rgba(123, 44, 191, 0.2)',
    padding: 16,
  },
  gaugeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gaugeContainer: {
    position: 'relative',
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gaugeTextWrapper: {
    position: 'absolute',
    alignItems: 'center',
  },
  gaugePct: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  gaugeLabel: {
    color: '#6B6E85',
    fontSize: 8,
  },
  gaugeInfo: {
    flex: 1,
    marginLeft: 16,
  },
  gaugeInfoTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  gaugeInfoSub: {
    color: '#6B6E85',
    fontSize: 11,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  greenStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00E676',
  },
  statusText: {
    color: '#00E676',
    fontSize: 10,
    marginLeft: 6,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
  },
  statWidget: {
    flex: 0.31,
    borderRadius: 10,
    backgroundColor: '#0A0726',
    borderWidth: 0.5,
    borderColor: 'rgba(123, 44, 191, 0.2)',
    padding: 12,
  },
  statWidgetLabel: {
    color: colors.textMuted,
    fontSize: 12,
  },
  statWidgetValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textMuted,
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 8,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#1A1535',
    borderWidth: 0.5,
    borderColor: 'rgba(123, 44, 191, 0.2)',
    padding: 12,
    width: '100%',
    marginBottom: 8,
  },
  alertText: {
    color: colors.text,
    fontSize: 13,
    marginLeft: 10,
    flex: 1,
  },
  actionWidget: {
    flex: 0.48,
    borderRadius: 10,
    backgroundColor: '#0A0726',
    padding: 14,
  },
  actionWidgetTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 8,
  },
  actionWidgetSub: {
    color: colors.textMuted,
    fontSize: 9,
    marginTop: 2,
  },
  simulatorBtnsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  simBtn: {
    width: '48%',
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  simBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  callScreenCard: {
    width: '100%',
    borderRadius: 14,
    backgroundColor: '#0A0726',
    borderWidth: 1,
    borderColor: 'rgba(123, 44, 191, 0.22)',
    padding: 24,
    alignItems: 'center',
  },
  callScreenCardEmpty: {
    width: '100%',
    height: 260,
    borderRadius: 14,
    backgroundColor: '#0A0726',
    borderWidth: 1,
    borderColor: 'rgba(123, 44, 191, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyCallText: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 16,
  },
  callScreenName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
  },
  callScreenNumber: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  callScreenCarrier: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  callScreenScore: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 12,
  },
  callActionsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginTop: 28,
  },
  callBtn: {
    flex: 0.31,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  searchCard: {
    width: '100%',
    borderRadius: 14,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  searchTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
  searchSub: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  searchInputRow: {
    flexDirection: 'row',
    marginTop: 16,
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    color: colors.text,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  searchBtn: {
    width: 70,
    height: 44,
    backgroundColor: colors.cyanAccent,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  searchBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 13,
  },
  searchResultCard: {
    width: '100%',
    borderRadius: 14,
    backgroundColor: '#07051f',
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginTop: 16,
  },
  resultName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  resultNumber: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  resultScoreText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 12,
  },
  listEmptyPlaceholder: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: colors.cardBackground,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 12,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  historyName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  historyNumber: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  historyDate: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  historyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  historyBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  blockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  blockedName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  blockedNumber: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  blockedDate: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  unblockBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.redDanger,
  },
  unblockBtnText: {
    color: colors.redDanger,
    fontSize: 11,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    borderRadius: 16,
    backgroundColor: '#0b0f19',
    borderWidth: 1,
    padding: 20,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  popupHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  popupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 8,
    textAlign: 'center',
  },
  popupSub: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  popupRiskText: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 4,
  },
  popupDesc: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginVertical: 16,
  },
  popupActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  popupBtn: {
    flex: 0.48,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  popupTextBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    flex: 0.48,
  },
  popupTextBtnText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  reportFormLabel: {
    color: colors.textMuted,
    fontSize: 11,
    marginBottom: 8,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.cyanAccent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.cyanAccent,
  },
  radioLabel: {
    color: colors.text,
    fontSize: 13,
  },
  reportInput: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(123, 44, 191, 0.2)',
    backgroundColor: colors.background,
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    marginTop: 16,
    textAlignVertical: 'top',
  },
  resultTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultSub: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  primaryBtn: {
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  adHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  adHeaderTag: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ffd900',
    letterSpacing: 1,
    marginLeft: 6,
  },
  adBanner: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    backgroundColor: '#050B24',
    borderWidth: 0.5,
    borderColor: '#2874f033',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  adBannerTexts: {
    position: 'absolute',
    bottom: 20,
    alignItems: 'center',
  },
  adBannerTitle: {
    color: '#ffd900',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  adBannerSub: {
    color: colors.text,
    fontSize: 8,
    fontWeight: '500',
  },
  adMainTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  adDescription: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 20,
  },
  adCtaBtn: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  adCtaGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adCtaBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  adSkipBtn: {
    paddingVertical: 4,
  },
  adSkipBtnText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  settingCard: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: '#0f172a', // Solid dark background for visibility
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 24,
    marginTop: 10,
    elevation: 4,
  },
  settingTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingSub: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 24,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    width: '100%',
  },
  sliderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sliderButtonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  sliderTrackBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1e293b',
    overflow: 'hidden',
    marginHorizontal: 16,
  },
  sliderTrackFill: {
    height: '100%',
    backgroundColor: colors.purpleAccent,
  },
});
