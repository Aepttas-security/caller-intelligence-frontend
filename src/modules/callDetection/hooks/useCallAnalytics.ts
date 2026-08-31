// src/modules/callDetection/hooks/useCallAnalytics.ts
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import apiService from '../../../services/api';
import { RootState } from '../../../store';

interface AnalyticsEvent {
  eventType: string;
  phoneNumber: string;
  callerName?: string;
  riskScore?: number;
  threatLevel?: string;
  duration?: number;
  timestamp: string;
}

export const useCallAnalytics = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  
  const recentCalls = useSelector((state: RootState) => state.callDetection.recentCalls);

  useEffect(() => {
    if (recentCalls.length > 0) {
      const lastCall = recentCalls[0];
      trackEvent({
        eventType: 'CALL_RECEIVED',
        phoneNumber: lastCall.phoneNumber,
        callerName: lastCall.callerName,
        timestamp: lastCall.timestamp
      });
    }
  }, [recentCalls]);

  // ✅ FIX: Use fetch directly since request is private
  const trackEvent = async (event: AnalyticsEvent) => {
    try {
      setIsTracking(true);
      // Use fetch directly to send analytics
      const response = await fetch('http://192.168.1.6:8000/api/analytics/call-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'test-api-key'
        },
        body: JSON.stringify(event)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      setEvents(prev => [event, ...prev].slice(0, 100));
      console.log('[Analytics] Tracked event:', event.eventType);
    } catch (error) {
      console.error('[Analytics] Failed to track event:', error);
    } finally {
      setIsTracking(false);
    }
  };

  const trackSpamReport = async (phoneNumber: string, reason: string) => {
    try {
      await apiService.createReport({
        caller_number: phoneNumber,
        report_type: 'Spam',
        description: reason
      });
      await trackEvent({
        eventType: 'SPAM_REPORTED',
        phoneNumber,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[Analytics] Failed to track spam report:', error);
    }
  };

  const trackBlock = async (phoneNumber: string, reason: string) => {
    try {
      await apiService.blockNumber({
        phone_number: phoneNumber,
        block_reason: reason,
        is_permanent: false
      });
      await trackEvent({
        eventType: 'NUMBER_BLOCKED',
        phoneNumber,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[Analytics] Failed to track block:', error);
    }
  };

  const trackProfileView = async (phoneNumber: string, callerName: string) => {
    await trackEvent({
      eventType: 'PROFILE_VIEWED',
      phoneNumber,
      callerName,
      timestamp: new Date().toISOString()
    });
  };

  const getCallStats = () => {
    const totalCalls = events.length;
    const spamCalls = events.filter(e => e.eventType === 'SPAM_REPORTED').length;
    const blockedCalls = events.filter(e => e.eventType === 'NUMBER_BLOCKED').length;
    
    return {
      totalCalls,
      spamCalls,
      blockedCalls,
      callHistory: events
    };
  };

  return {
    isTracking,
    events,
    trackEvent,
    trackSpamReport,
    trackBlock,
    trackProfileView,
    getCallStats
  };
};