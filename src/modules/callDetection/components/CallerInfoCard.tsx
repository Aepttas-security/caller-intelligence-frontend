import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { borderRadius, colors, spacing } from '../../../theme';
import { CallerInfo } from '../types/callDetection.types';

interface CallerInfoCardProps {
  callerInfo: CallerInfo;
  onPress?: () => void;
  onBlock?: () => void;
  onReport?: () => void;
  showActions?: boolean;
}

const { width } = Dimensions.get('window');

export const CallerInfoCard: React.FC<CallerInfoCardProps> = ({
  callerInfo,
  onPress,
  onBlock,
  onReport,
  showActions = false
}) => {
  const getRiskColor = (score: number) => {
    if (score < 30) return colors.success;
    if (score < 60) return colors.warning;
    if (score < 80) return colors.danger;
    return colors.critical;
  };

  const getThreatBadge = (level: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      'Safe': { label: 'âœ… Safe', color: colors.success },
      'Suspicious': { label: 'âš ï¸ Suspicious', color: colors.warning },
      'Spam': { label: 'ðŸ“¢ Spam', color: colors.danger },
      'Scam': { label: 'ðŸ”´ Scam', color: colors.critical },
      'Critical Scam': { label: 'ðŸš¨ Critical Scam', color: colors.critical }
    };
    return badges[level] || { label: level, color: colors.textSecondary };
  };

  const threat = getThreatBadge(callerInfo.threatLevel);

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['#1a1a2e', '#16213e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Image
              source={callerInfo.photoUrl ? { uri: callerInfo.photoUrl } : require('../../../../assets/default-avatar.png')}
              style={styles.avatar}
              defaultSource={require('../../../../assets/default-avatar.png')}
            />
            {callerInfo.isBlocked && (
              <View style={styles.blockedBadge}>
                <Text style={styles.blockedBadgeText}>Blocked</Text>
              </View>
            )}
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.name}>{callerInfo.name}</Text>
            <Text style={styles.phoneNumber}>{callerInfo.phoneNumber}</Text>
            <Text style={styles.details}>
              {callerInfo.carrier} â€¢ {callerInfo.location}
            </Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="shield-checkmark" size={20} color={getRiskColor(callerInfo.riskScore)} />
            <Text style={[styles.statValue, { color: getRiskColor(callerInfo.riskScore) }]}>
              {callerInfo.riskScore}
            </Text>
            <Text style={styles.statLabel}>Risk Score</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Ionicons name="alert-circle" size={20} color={threat.color} />
            <Text style={[styles.statValue, { color: threat.color }]}>
              {threat.label}
            </Text>
            <Text style={styles.statLabel}>Threat Level</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Ionicons name="flag" size={20} color={colors.warning} />
            <Text style={styles.statValue}>{callerInfo.spamReports}</Text>
            <Text style={styles.statLabel}>Reports</Text>
          </View>
        </View>

        <View style={styles.ratingContainer}>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color={colors.warning} />
            <Text style={styles.ratingText}>Reputation: {callerInfo.reputation}/10</Text>
          </View>
          {callerInfo.communityRating && (
            <View style={styles.ratingRow}>
              <Ionicons name="people" size={16} color={colors.textSecondary} />
              <Text style={styles.communityText}>Community Rating: {callerInfo.communityRating}%</Text>
            </View>
          )}
        </View>

        {showActions && (
          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.blockButton]} 
              onPress={onBlock}
            >
              <Ionicons name="ban" size={18} color="#FFFFFF" />
              <Text style={styles.actionText}>Block</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.reportButton]} 
              onPress={onReport}
            >
              <Ionicons name="flag" size={18} color="#FFFFFF" />
              <Text style={styles.actionText}>Report</Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width * 0.92,
    maxWidth: 400,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginVertical: spacing.sm,
    alignSelf: 'center'
  },
  gradient: {
    padding: spacing.md
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.md
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  blockedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.danger,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10
  },
  blockedBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold'
  },
  infoContainer: {
    flex: 1
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF'
  },
  phoneNumber: {
    fontSize: 14,
    color: '#8a8a8a',
    marginVertical: 2
  },
  details: {
    fontSize: 12,
    color: '#666'
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm
  },
  statItem: {
    alignItems: 'center'
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 2
  },
  statLabel: {
    fontSize: 10,
    color: '#666'
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)'
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  ratingText: {
    fontSize: 12,
    color: '#8a8a8a',
    marginLeft: 4
  },
  communityText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)'
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20
  },
  blockButton: {
    backgroundColor: colors.danger
  },
  reportButton: {
    backgroundColor: colors.warning
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6
  }
});
