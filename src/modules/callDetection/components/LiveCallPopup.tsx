import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { CallAnalysisResponse, CallerInfo } from '../types/callDetection.types';

interface LiveCallPopupProps {
  isVisible: boolean;
  phoneNumber: string;
  callerInfo: CallerInfo | null;
  analysis: CallAnalysisResponse | null;
  onDismiss: () => void;
  onBlock: (phoneNumber: string) => void;
  onReport: (phoneNumber: string) => void;
  isLoading: boolean;
}

const { width } = Dimensions.get('window');

export const LiveCallPopup: React.FC<LiveCallPopupProps> = ({
  isVisible,
  phoneNumber,
  callerInfo,
  analysis,
  onDismiss,
  onBlock,
  onReport,
  isLoading
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 9, tension: 45, useNativeDriver: true })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: -100, duration: 200, useNativeDriver: true })
      ]).start();
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const score = analysis?.riskScore || 50;
  const isSafe = score < 15;
  const isHighRisk = score >= 75;

  const getRiskColor = (s: number) => {
    if (s < 15) return '#10b981'; // Green
    if (s < 75) return '#f59e0b'; // Gold/Yellow
    return '#ef4444'; // Red
  };

  const riskColor = getRiskColor(score);
  const bgColors = isSafe ? ['#021a1a', '#010505'] : isHighRisk ? ['#1a0202', '#050101'] : ['#0b1126', '#03050d'];

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Animated.View style={[styles.popup, { transform: [{ translateY: slideAnim }] }]}>
        <LinearGradient colors={bgColors as any} style={styles.gradient}>
          <TouchableOpacity style={styles.closeBtn} onPress={onDismiss}>
            <Ionicons name="close" size={22} color="rgba(255,255,255,0.2)" />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconWrapper}>
               <Ionicons name="shield-checkmark" size={40} color={riskColor} />
            </View>
            <Text style={styles.nameText}>{callerInfo?.name || (isLoading ? 'Identifying...' : 'Unknown Caller')}</Text>
            <Text style={styles.numberText}>{phoneNumber}</Text>
            <Text style={styles.infoText}>
              {callerInfo?.carrier || 'Network Verified'} | {callerInfo?.location || 'India'}
            </Text>
          </View>

          <View style={styles.riskBadge}>
             <Text style={[styles.riskLabel, { color: riskColor }]}>
                RISK SCORE: {score}%
             </Text>
          </View>

          <View style={styles.btnRow}>
            <TouchableOpacity style={[styles.btn, styles.allowBtn]} onPress={onDismiss}>
              <Text style={styles.btnText}>Allow</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btn, styles.blockBtn]} onPress={() => onBlock(phoneNumber)}>
              <Text style={styles.btnText}>Block</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btn, styles.reportBtn]} onPress={() => onReport(phoneNumber)}>
              <Text style={styles.btnText}>Report</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
  },
  popup: {
    width: width * 0.85, // Perfect size
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    elevation: 25,
  },
  gradient: {
    padding: 24,
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconWrapper: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.02)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  nameText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  numberText: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 6,
    textAlign: 'center',
  },
  riskBadge: {
    marginTop: 12,
    marginBottom: 24,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  riskLabel: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  btn: {
    flex: 0.31,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  allowBtn: {
    backgroundColor: '#1e293b',
  },
  blockBtn: {
    backgroundColor: '#ef4444',
  },
  reportBtn: {
    backgroundColor: '#06b6d4',
  }
});
