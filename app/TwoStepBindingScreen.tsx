import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useTheme } from '../src/contexts/ThemeContext';
import { Icon } from '../components/Icon';
import { ParentalRepository } from '../src/data/parentalRepository';
import { Storage } from '../src/utils/storage';

export default function TwoStepBindingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const [code, setCode] = useState('582-914');
  const [isGenerating, setIsGenerating] = useState(false);
  const [pairingStatus, setPairingStatus] = useState<'PENDING' | 'LINKED' | 'EXPIRED'>('PENDING');
  const [statusMessage, setStatusMessage] = useState('Waiting for child device to connect...');

  useEffect(() => {
    async function initCode() {
      try {
        setIsGenerating(true);
        const res = await ParentalRepository.generateParentLinkingCode(1);
        if (res?.linking_code) setCode(res.linking_code);
      } catch (err) {
        console.warn('[Pairing] Fallback to default code');
      } finally {
        setIsGenerating(false);
      }
    }
    initCode();
  }, []);

  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const liveStatus = await ParentalRepository.checkPairingStatusByCode(code);
        if (liveStatus?.status === 'LINKED') {
          setPairingStatus('LINKED');
          setStatusMessage('Device linked successfully!');
          clearInterval(pollInterval);
        }
      } catch (e) {}
    }, 3000);
    return () => clearInterval(pollInterval);
  }, [code]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Icon name="arrow-back" color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pair Child Device</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Step-by-Step Pairing</Text>
        <Text style={styles.subtitle}>Enter this code on your child's device to secure it.</Text>

        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>LINKING CODE</Text>
          {isGenerating ? (
            <ActivityIndicator color={colors.purpleAccent} />
          ) : (
            <Text style={styles.codeText}>{code}</Text>
          )}
        </View>

        <View style={styles.statusBox}>
          <Text style={{ color: colors.text }}>Status: {statusMessage}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 40 },
  backBtn: { padding: 8 },
  headerTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold', marginLeft: 12 },
  scrollContent: { padding: 24, alignItems: 'center' },
  title: { color: colors.text, fontSize: 24, fontWeight: 'bold' },
  subtitle: { color: colors.textMuted, textAlign: 'center', marginTop: 8, marginBottom: 40 },
  codeCard: { backgroundColor: colors.cardBackground, borderRadius: 20, padding: 32, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  codeLabel: { color: colors.purpleAccent, fontWeight: 'bold', fontSize: 12, letterSpacing: 2 },
  codeText: { color: colors.text, fontSize: 42, fontWeight: 'bold', marginTop: 16, letterSpacing: 5 },
  statusBox: { marginTop: 40, padding: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 }
});
