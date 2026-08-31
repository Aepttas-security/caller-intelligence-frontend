import { useState, useCallback, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';

export const useCallerIntelligence = () => {
  const context = useAppContext();

  // Mapping context fields to what the new UI expects
  const blockedNumbers = Array.isArray(context?.blockedNumbers) ? context.blockedNumbers : [];
  const spamReports = Array.isArray(context?.spamReports) ? context.spamReports : [];
  const callHistory = Array.isArray(context?.callHistory) ? context.callHistory : [];

  return {
    blockedNumbers: blockedNumbers.map(n => ({
      number: n?.phone_number || '',
      name: n?.caller_name || 'Unknown',
      reason: n?.block_reason || 'No reason',
      date: n?.block_date ? new Date(n.block_date).toLocaleDateString() : new Date().toLocaleDateString(),
      riskScore: (n as any).risk_score || 0
    })),
    spamCalls: spamReports.map(r => ({
      name: r?.caller_name || 'Spam Caller',
      number: r?.phone_number || '',
      reportType: r?.report_type || 'Spam',
      riskScore: r?.risk_score || 75,
      date: r?.reported_at ? new Date(r.reported_at).toLocaleDateString() : new Date().toLocaleDateString()
    })),
    reportHistory: spamReports,
    callHistory: callHistory.map(c => {
      const durationSecs = c?.duration || 0;
      const mm = Math.floor(durationSecs / 60).toString().padStart(2, '0');
      const ss = (durationSecs % 60).toString().padStart(2, '0');

      return {
        name: c?.caller_name || 'Unknown Caller',
        number: c?.caller_number || '',
        riskScore: c?.risk_score || 0,
        duration: `${mm}:${ss}`,
        type: (c?.call_type || 'INCOMING') as any,
        status: c?.status || 'Safe',
        isBlocked: !!c?.is_blocked,
        location: c?.location || 'India',
        date: c?.created_at || new Date().toLocaleString()
      };
    }),
    autoBlockEnabled: context.settings?.auto_block_calls ?? true,
    notificationsEnabled: context.settings?.notifications_enabled ?? true,
    sensitivity: context.settings?.detection_sensitivity ?? 75,
    privacyLogging: context.settings?.privacy_mode ?? false,
    addBlockedNumber: (number: string, name: string, reason: string) => {
      if (!number) return;
      return context.blockNumber({ phone_number: number, caller_name: name, block_reason: reason });
    },
    removeBlockedNumber: (number: string) => {
      if (!number) return;
      return context.unblockNumber(number);
    },
    reportCall: (number: string, type: string, description: string) =>
      context.blockNumber({ phone_number: number, block_reason: `[${type}] ${description}` }),
    toggleAutoBlock: (val: boolean) => context.updateSettings({ auto_block_calls: val }),
    toggleNotifications: (val: boolean) => context.updateSettings({ notifications_enabled: val }),
    updateSensitivity: (val: number) => context.updateSettings({ detection_sensitivity: val }),
    togglePrivacyLogging: (val: boolean) => context.updateSettings({ privacy_mode: val }),
  };
};
