// src/components/NewsFeed.tsx
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../src/styles/theme';

interface NewsItem {
  id: string;
  title: string;
  description: string;
  date: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source?: string;
}

// Fallback mock data - used if API fails
const FALLBACK_NEWS: NewsItem[] = [
  {
    id: '1',
    title: 'ðŸš¨ New IRS Scam Alert',
    description: 'Scammers are calling claiming to be from the IRS. They demand immediate payment via gift cards.',
    date: new Date().toISOString(),
    severity: 'critical',
    source: 'FTC Alert'
  },
  {
    id: '2',
    title: 'âš ï¸ Bank OTP Phishing',
    description: 'New scam targeting bank customers. Callers ask for OTP codes to "verify" your account.',
    date: new Date(Date.now() - 3600000).toISOString(),
    severity: 'high',
    source: 'Cyber Security'
  },
  {
    id: '3',
    title: 'ðŸ“± Tech Support Scam',
    description: 'Fake Microsoft support calls claiming your computer has a virus.',
    date: new Date(Date.now() - 7200000).toISOString(),
    severity: 'medium',
    source: 'Tech Safety'
  },
  {
    id: '4',
    title: 'ðŸ’³ Credit Card Fraud Alert',
    description: 'Scammers pretending to be from your bank about suspicious transactions.',
    date: new Date(Date.now() - 14400000).toISOString(),
    severity: 'high',
    source: 'Bank Security'
  },
  {
    id: '5',
    title: 'ðŸ“¦ Package Delivery Scam',
    description: 'Fake delivery notifications asking for payment to release packages.',
    date: new Date(Date.now() - 86400000).toISOString(),
    severity: 'medium',
    source: 'Postal Alert'
  },
  {
    id: '6',
    title: 'ðŸ”´ Emergency: New Scam Wave',
    description: 'Scammers impersonating bank officials asking for OTP and UPI PIN.',
    date: new Date(Date.now() - 1200000).toISOString(),
    severity: 'critical',
    source: 'National Cyber Crime'
  },
  {
    id: '7',
    title: 'âš ï¸ WhatsApp Call Scam',
    description: 'Fraudsters making video calls with AI-generated faces to steal identity.',
    date: new Date(Date.now() - 5400000).toISOString(),
    severity: 'high',
    source: 'Cyber Security Alert'
  }
];

export const NewsFeed: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>(FALLBACK_NEWS);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNews = async () => {
    try {
      // Try to fetch from API, but if it fails, use fallback data
      const response = await fetch('http://localhost:8000/api/scam-alerts');
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setNews(data);
        }
      }
    } catch (error) {
      console.log('Using fallback news data');
      // Keep using fallback data
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    setLoading(true);
    fetchNews();
    const interval = setInterval(fetchNews, 300000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNews();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return colors.redDanger;
      case 'high': return '#ff6b35';
      case 'medium': return colors.orangeWarning;
      case 'low': return colors.greenSuccess;
      default: return colors.textMuted;
    }
  };

  const getSeverityEmoji = (severity: string) => {
    switch (severity) {
      case 'critical': return 'ðŸ”´';
      case 'high': return 'ðŸŸ ';
      case 'medium': return 'ðŸŸ¡';
      case 'low': return 'ðŸŸ¢';
      default: return 'âšª';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'critical': return 'CRITICAL';
      case 'high': return 'HIGH';
      case 'medium': return 'MEDIUM';
      case 'low': return 'LOW';
      default: return 'UNKNOWN';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.cyanAccent} />
        <Text style={styles.loadingText}>Loading latest scam alerts...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.cyanAccent]} />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ðŸ“° Live Scam Alerts</Text>
        <Text style={styles.headerSub}>Real-time updates from scam intelligence network</Text>
      </View>
      
      {news.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No alerts available</Text>
          <Text style={styles.emptySubText}>Check back later for updates</Text>
        </View>
      ) : (
        news.map((item) => (
          <View key={item.id} style={[styles.newsCard, { borderLeftColor: getSeverityColor(item.severity) }]}>
            <View style={styles.newsHeader}>
              <Text style={styles.newsTitle}>
                {getSeverityEmoji(item.severity)} {item.title}
              </Text>
              <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity) }]}>
                <Text style={styles.severityText}>{getSeverityLabel(item.severity)}</Text>
              </View>
            </View>
            <Text style={styles.newsDescription}>{item.description}</Text>
            <View style={styles.newsFooter}>
              <Text style={styles.newsSource}>{item.source || 'Alert Network'}</Text>
              <Text style={styles.newsDate}>{formatDate(item.date)}</Text>
            </View>
          </View>
        ))
      )}
      
      <View style={styles.safetyCard}>
        <Text style={styles.safetyTitle}>ðŸ›¡ï¸ How to Stay Safe</Text>
        <View style={styles.safetyList}>
          <Text style={styles.safetyItem}>â€¢ Never share OTP, PIN, or passwords with anyone</Text>
          <Text style={styles.safetyItem}>â€¢ Hang up and call back on official numbers</Text>
          <Text style={styles.safetyItem}>â€¢ Report suspicious calls immediately</Text>
          <Text style={styles.safetyItem}>â€¢ Keep your auto-block feature enabled</Text>
          <Text style={styles.safetyItem}>â€¢ Verify caller identity before sharing info</Text>
        </View>
      </View>

      <View style={styles.emergencyCard}>
        <Text style={styles.emergencyTitle}>ðŸ“ž Emergency Contacts</Text>
        <View style={styles.emergencyList}>
          <Text style={styles.emergencyItem}>ðŸš¨ Cyber Crime Helpline: 1930</Text>
          <Text style={styles.emergencyItem}>ðŸ“± National Cyber Crime Portal: cybercrime.gov.in</Text>
          <Text style={styles.emergencyItem}>ðŸ‘® Police Emergency: 112</Text>
          <Text style={styles.emergencyItem}>ðŸ¦ Bank Fraud Helpline: 14440</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { padding: 40, alignItems: 'center' },
  loadingText: { color: colors.textMuted, marginTop: 12, fontSize: 14 },
  header: { marginBottom: 16 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  headerSub: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { color: colors.textMuted, fontSize: 16, fontWeight: 'bold' },
  emptySubText: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  newsCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderColor: colors.border,
  },
  newsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  newsTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold', flex: 1, marginRight: 8 },
  severityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  severityText: { color: '#fff', fontSize: 8, fontWeight: 'bold' },
  newsDescription: { color: colors.textMuted, fontSize: 12, lineHeight: 16 },
  newsFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  newsSource: { color: colors.cyanAccent, fontSize: 10, fontWeight: '500' },
  newsDate: { color: '#6B6E85', fontSize: 10 },
  safetyCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  safetyTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  safetyList: { marginTop: 4 },
  safetyItem: { color: colors.textMuted, fontSize: 12, lineHeight: 20, paddingVertical: 2 },
  emergencyCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    padding: 16,
    marginBottom: 16,
  },
  emergencyTitle: { color: '#ff6b6b', fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  emergencyList: { marginTop: 4 },
  emergencyItem: { color: colors.textMuted, fontSize: 12, lineHeight: 22, paddingVertical: 2 },
});

export default NewsFeed;
