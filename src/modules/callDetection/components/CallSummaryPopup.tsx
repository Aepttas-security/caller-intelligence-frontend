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

interface CallSummaryPopupProps {
  isVisible: boolean;
  phoneNumber: string;
  callerName?: string;
  callType: string;
  duration: number;
  riskScore?: number;
  threatLevel?: string;
  carrier?: string;
  location?: string;
  onDismiss: () => void;
  onBlock: (phoneNumber: string) => void;
  onReport: (phoneNumber: string) => void;
}

const { width } = Dimensions.get('window');

export const CallSummaryPopup: React.FC<CallSummaryPopupProps> = ({
  isVisible,
  phoneNumber,
  callerName,
  callType,
  duration,
  riskScore = 50,
  onDismiss,
  onBlock,
  onReport
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 9, tension: 45, useNativeDriver: true })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 50, duration: 200, useNativeDriver: true })
      ]).start();
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const getRiskColor = (s: number) => {
    if (s < 15) return '#10b981';
    if (s < 75) return '#f59e0b';
    return '#ef4444';
  };

  const riskColor = getRiskColor(riskScore);
  const bgColors = riskScore < 15 ? ['#021a1a', '#010505'] : riskScore >= 75 ? ['#1a0202', '#050101'] : ['#0b1126', '#03050d'];

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Animated.View style={[styles.popup, { transform: [{ translateY: slideAnim }] }]}>
        <LinearGradient colors={bgColors as any} style={styles.gradient}>
          <TouchableOpacity style={styles.closeBtn} onPress={onDismiss}>
            <Ionicons name="close" size={22} color="rgba(255,255,255,0.2)" />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconWrapper}>
               <Ionicons name="call" size={36} color={riskColor} />
            </View>
            <Text style={[styles.summaryTag, { color: riskColor }]}>CALL SUMMARY</Text>
            <Text style={styles.nameText}>{callerName || 'Unknown Caller'}</Text>
            <Text style={styles.numberText}>{phoneNumber}</Text>
            <Text style={styles.infoText}>
              {callType} | {formatDuration(duration)}
            </Text>
          </View>

          <View style={styles.riskBadge}>
             <Text style={[styles.riskLabel, { color: riskColor }]}>
                RISK SCORE: {riskScore}%
             </Text>
          </View>

          <View style={styles.btnRow}>
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
    width: width * 0.85,
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
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.02)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryTag: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 12,
    letterSpacing: 2,
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
    justifyContent: 'space-around',
    width: '100%',
  },
  btn: {
    flex: 0.45,
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
  blockBtn: {
    backgroundColor: '#ef4444',
  },
  reportBtn: {
    backgroundColor: '#06b6d4',
  }
});
