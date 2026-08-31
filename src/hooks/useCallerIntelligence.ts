import { useState, useCallback, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';

export const useCallerIntelligence = () => {
  const context = useAppContext();

  // Mapping context fields to what the new UI expects
  return {
    blockedNumbers: context.blockedNumbers.map(n => ({
      number: n.phone_number,
      name: n.caller_name || 'Unknown',
      reason: n.block_reason,
      date: new Date(n.block_date).toLocaleDateString()
    })),
    spamCalls: context.callHistory.filter(c => c.status === 'Spam').map(c => ({
      name: c.caller_name || 'Spam Caller',
      number: c.caller_number,
      riskScore: c.risk_score,
      date: new Date(c.created_at).toLocaleDateString()
    })),
    reportHistory: [], // Placeholder if not in context
    callHistory: context.callHistory.map(c => ({
      name: c.caller_name || 'Unknown Caller',
      number: c.caller_number,
      riskScore: c.risk_score,
      type: c.status as any,
      location: 'Unknown', // Backend doesn't return this in history yet
      date: new Date(c.created_at).toLocaleDateString()
    })),
    autoBlockEnabled: context.settings?.auto_block_calls ?? true,
    notificationsEnabled: context.settings?.notifications_enabled ?? true,
    addBlockedNumber: (number: string, name: string, reason: string) =>
      context.blockNumber({ phone_number: number, caller_name: name, block_reason: reason }),
    removeBlockedNumber: (number: string) => context.unblockNumber(number),
    reportCall: (number: string, type: string, description: string) =>
      context.blockNumber({ phone_number: number, block_reason: `[${type}] ${description}` }), // Mapping report to block for now
    toggleAutoBlock: () => context.updateSettings({ auto_block_calls: !context.settings?.auto_block_calls }),
    toggleNotifications: () => context.updateSettings({ notifications_enabled: !context.settings?.notifications_enabled }),
  };
};
