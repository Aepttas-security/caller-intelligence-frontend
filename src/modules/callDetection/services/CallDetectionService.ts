// src/modules/callDetection/services/CallDetectionService.ts
import { AppState, NativeEventEmitter, NativeModules, Platform } from 'react-native';
import { store } from '../../../store';
import {
    addRecentCall,
    hidePopup,
    setCallPopup,
    setPopupAnalysis,
    setPopupError,
    setServiceActive,
    setServiceError,
    showCallPopup,
    showSummaryPopup
} from '../store/callDetectionSlice';
import { CallAnalysisResponse } from '../types/callDetection.types';
// ✅ Use your existing API service
import apiService from '../../../services/api';

// ✅ Use the standard CallDetectionModule name
const { CallDetectionModule } = NativeModules;

class CallDetectionService {
  private eventEmitter: NativeEventEmitter | null = null;
  private isListening: boolean = false;
  private currentPhoneNumber: string | null = null;
  private currentDirection: string = 'INCOMING';
  private callStartTime: number = 0;
  private appStateListener: any = null;

  constructor() {
    if (CallDetectionModule) {
      this.eventEmitter = new NativeEventEmitter(CallDetectionModule);
    }
  }

  initialize(): void {
    try {
      if (Platform.OS === 'android') {
        if (CallDetectionModule) {
          // Defensive checks: only call methods if they exist
          if (CallDetectionModule.initialize) CallDetectionModule.initialize();
          if (CallDetectionModule.startDetection) CallDetectionModule.startDetection();

          this.startListening();
          this.setupAppStateListener();
          store.dispatch(setServiceActive(true));
          console.log('[CallDetection] Service initialized successfully');
        } else {
          console.error('[CallDetection] Native module not found');
        }
      } else if (Platform.OS === 'ios') {
        this.initializeCallKit();
      }
    } catch (error) {
      console.error('[CallDetection] Initialization failed:', error);
      store.dispatch(setServiceError('Failed to initialize call detection'));
    }
  }

  private startListening(): void {
    if (this.isListening || !this.eventEmitter) return;

    this.eventEmitter.addListener('onCallStateChanged', this.handleCallStateChange.bind(this));
    this.eventEmitter.addListener('onCallerNameResolved', this.handleCallerResolved.bind(this));
    this.eventEmitter.addListener('onShowPopup', this.handleShowPopup.bind(this));
    this.eventEmitter.addListener('onHidePopup', this.handleHidePopup.bind(this));
    this.eventEmitter.addListener('onShowSummaryPopup', this.handleShowSummaryPopup.bind(this));
    this.eventEmitter.addListener('onAutoBlock', this.handleAutoBlock.bind(this));
    this.eventEmitter.addListener('onOverlayAction', this.handleOverlayAction.bind(this));

    this.isListening = true;
    console.log('[CallDetection] Started listening for calls');
  }

  private async handleCallStateChange(data: any): Promise<void> {
    const { type, phoneNumber, duration, answered, callerName } = data;
    console.log(`[CallDetection] Call state changed: ${type} ${phoneNumber || ''}`);

    if (!phoneNumber || phoneNumber === "null") {
        if (type === 'IDLE') {
            store.dispatch(hidePopup());
        }
        return;
    }

    // ✅ Guard: Prevent summary showing before a real call starts
    if (type === 'IDLE' && !this.currentPhoneNumber) {
        return;
    }

    switch (type) {
      case 'INCOMING':
      case 'OUTGOING':
      case 'DIALING':
        this.currentPhoneNumber = phoneNumber;
        this.currentDirection = type === 'INCOMING' ? 'INCOMING' : 'OUTGOING';
        this.callStartTime = Date.now();

        // 🚀 SHOW POPUP IMMEDIATELY
        store.dispatch(showCallPopup({
            phoneNumber,
            callerInfo: {
              name: callerName || (type === 'INCOMING' ? '🛡️ Scanning Incoming...' : '🛡️ Scanning Dialed Number...'),
              phoneNumber: phoneNumber,
              carrier: 'Shield Network',
              location: 'Identifying...',
              riskScore: 50,
              threatLevel: 'Suspicious',
              spamReports: 0,
              reputation: 5,
              isBlocked: false,
              communityRating: 0,
              reason: 'AI security scan...'
            }
        }));

        await this.analyzeCaller(phoneNumber, type);
        break;
      
      case 'OFFHOOK':
        this.handleCallAnswered(phoneNumber);
        break;
      
      case 'IDLE':
        this.handleCallEnded(phoneNumber, duration || 0, answered);
        break;
    }
  }

  private async analyzeCaller(phoneNumber: string, callDirection: string): Promise<void> {
    try {
      // 1. Check blocked numbers first (Safe fallback if API fails)
      let isBlocked = false;
      let blockedData = null;
      try {
        const blockedNumbers = await apiService.getBlockedNumbers(0, 100);
        blockedData = blockedNumbers.find(b => b.phone_number === phoneNumber);
        isBlocked = !!blockedData;
      } catch (e) {
        console.log('[CallDetection] Blocked numbers check failed');
      }
      
      // ✅ LOGIC: Only auto-block INCOMING calls. Let OUTGOING calls proceed.
      if (isBlocked && callDirection === 'INCOMING') {
        console.log('[CallDetection] INCOMING Blocked number detected. Dropping call.');
        this.autoBlockNumber(phoneNumber);

        // Immediate UI feedback for blocked call
        store.dispatch(hidePopup());
        store.dispatch(showSummaryPopup({
          phoneNumber,
          callerName: blockedData?.caller_name || 'Blocked Caller',
          callType: 'AUTO-BLOCKED',
          duration: 0,
          riskScore: 100,
          threatLevel: 'Critical',
          carrier: 'Blocked by Shield',
          location: 'Restricted'
        }));
        return;
      }

      // 2. Perform Live Call Analysis
      let analysis;
      try {
        analysis = await apiService.analyzeCall({
          caller_number: phoneNumber,
          receiver_number: 'user',
          duration: 0,
          call_type: callDirection as any, // ✅ Use actual direction (INCOMING/OUTGOING)
          risk_score: 50
        });
      } catch (e) {
        console.log('[CallDetection] AnalyzeCall failed, using safe defaults');
        analysis = { status: 'Safe', final_risk_score: 0, threat_level: 'Low' };
      }

      // ✅ Transform to match CallAnalysisResponse type
      const response: CallAnalysisResponse = {
        callerInfo: {
          name: analysis.caller_name || 'Unknown Caller',
          phoneNumber: phoneNumber,
          carrier: analysis.carrier || 'Unknown',
          location: analysis.location || 'Unknown',
          riskScore: analysis.risk_score || 50,
          threatLevel: analysis.threat_level || 'Suspicious',
          spamReports: analysis.total_reports || 0,
          reputation: analysis.reputation_score || 5,
          isBlocked: analysis.is_blocked || false,
          communityRating: analysis.community_rating || 0,
          reason: analysis.detection_reason || 'Pattern analysis'
        },
        riskScore: analysis.risk_score || 50,
        threatLevel: analysis.threat_level || 'Suspicious',
        scamProbability: analysis.scam_probability || 0,
        isBlocked: analysis.is_blocked || false,
        categories: analysis.categories || []
      };

      // ✅ IMMEDIATE BLOCK if DB says so
      if (response.isBlocked) {
        console.log('[CallDetection] Number is in Blocklist. Terminating call.');
        this.autoBlockNumber(phoneNumber);
        return;
      }

      // ✅ Update popup with real data
      store.dispatch(setCallPopup({
        phoneNumber,
        callerInfo: response.callerInfo,
        isLoading: false
      }));
      
      store.dispatch(setPopupAnalysis(response));

      store.dispatch(addRecentCall({
        phoneNumber,
        callerName: response.callerInfo.name,
        callType: 'INCOMING'
      }));

      // ✅ Check auto-block threshold from settings
      const settings = await apiService.getSettings();
      if (settings.auto_block_calls && response.riskScore > settings.auto_block_threshold) {
        this.autoBlockNumber(phoneNumber);
      }

    } catch (error) {
      console.error('[CallDetection] Failed to analyze caller:', error);
      store.dispatch(setPopupError('Failed to analyze caller'));
    }
  }

  private async autoBlockNumber(phoneNumber: string): Promise<void> {
    try {
      await apiService.blockNumber({
        phone_number: phoneNumber,
        block_reason: 'Auto-blocked - High Risk Score',
        is_permanent: false
      });
      console.log('[CallDetection] Auto-blocked number:', phoneNumber);
    } catch (error) {
      console.error('[CallDetection] Auto-block failed:', error);
    }
  }

  private async handleCallerResolved(data: any): Promise<void> {
    const { phoneNumber, callerName, riskScore, reason } = data;
    console.log(`[CallDetection] Identity Resolved: ${callerName} for ${phoneNumber}`);

    // Parse riskScore safely since it's now sent as a String from Native
    const parsedScore = typeof riskScore === 'string' ? parseInt(riskScore, 10) : (riskScore || 0);

    // Update the popup state with the newly resolved name
    store.dispatch(setCallPopup({
        phoneNumber,
        callerInfo: {
            name: callerName,
            phoneNumber,
            riskScore: parsedScore,
            threatLevel: parsedScore >= 85 ? 'Critical' : parsedScore >= 60 ? 'Spam' : 'Safe',
            carrier: 'Verified',
            location: 'India',
            spamReports: 0,
            reputation: 5,
            isBlocked: false,
            communityRating: 0,
            reason: reason || 'Verified identity'
        },
        isLoading: false
    }));

    // Re-trigger analysis storage with the correct name
    try {
        await apiService.analyzeCall({
            caller_number: phoneNumber,
            caller_name: callerName,
            receiver_number: 'user',
            duration: 0,
            call_type: 'Incoming',
            risk_score: parsedScore
        });
    } catch (e) {
        console.error('[CallDetection] Failed to save resolved identity:', e);
    }
  }

  private async handleOverlayAction(data: any): Promise<void> {
    const { action, phoneNumber } = data;
    console.log(`[CallDetection] Overlay action: ${action} for ${phoneNumber}`);

    try {
      switch (action) {
        case 'VIEW_PROFILE':
          // Navigate to profile or show details
          // You can add your router navigation here
          break;
        case 'BLOCK_NUMBER':
          await apiService.blockNumber({
            phone_number: phoneNumber,
            block_reason: 'User blocked via Call Shield Overlay',
            is_permanent: true
          });
          console.log('[CallDetection] Number blocked via overlay:', phoneNumber);
          break;
        case 'REPORT_NUMBER':
          await apiService.createReport({
            caller_number: phoneNumber,
            report_type: 'Spam',
            description: 'Reported via Call Shield Overlay'
          });
          console.log('[CallDetection] Number reported via overlay:', phoneNumber);
          break;
      }
    } catch (error) {
      console.error('[CallDetection] Failed to process overlay action:', error);
    }
  }

  private handleAutoBlock(data: any): void {
    const { phoneNumber } = data;
    store.dispatch(hidePopup());
    console.log('[CallDetection] Number auto-blocked:', phoneNumber);
  }

  private handleCallAnswered(phoneNumber: string): void {
    store.dispatch(hidePopup());
  }

  private handleCallMissed(phoneNumber: string): void {
    const duration = (Date.now() - this.callStartTime) / 1000;
    store.dispatch(hidePopup());
    store.dispatch(showSummaryPopup({
      phoneNumber,
      callType: 'MISSED',
      duration: duration
    }));
  }

  private handleCallRejected(phoneNumber: string): void {
    store.dispatch(hidePopup());
    store.dispatch(showSummaryPopup({
      phoneNumber,
      callType: 'REJECTED',
      duration: 0
    }));
  }

  private handleCallEnded(phoneNumber: string, duration: number, answered?: boolean): void {
    const state = store.getState();
    const popupData = state.callDetection.popup;
    const callerInfo = popupData.callerInfo;
    const analysis = popupData.analysis;

    store.dispatch(hidePopup());

    store.dispatch(showSummaryPopup({
      phoneNumber,
      callerName: callerInfo?.name || 'Unknown Caller',
      callType: answered ? 'ANSWERED' : 'MISSED',
      duration: duration,
      riskScore: analysis?.riskScore || 50,
      threatLevel: analysis?.threatLevel || 'Safe',
      carrier: callerInfo?.carrier,
      location: callerInfo?.location,
      spamReports: callerInfo?.spamReports || 0,
      reputation: callerInfo?.reputation || 5,
      photoUrl: callerInfo?.photoUrl
    }));

    // ✅ Save to call history using your API
    this.saveCallHistory(phoneNumber, duration);
  }

  private async saveCallHistory(phoneNumber: string, duration: number): Promise<void> {
    try {
      const state = store.getState();
      const popupData = state.callDetection.popup;
      const callerInfo = popupData.callerInfo;
      const type = state.callDetection.summary.callType || 'MISSED';

      // Use the direction strictly tracked by the service state
      const finalDirection = this.currentDirection;

      console.log(`[CallDetection] Saving ${finalDirection} call history:`, phoneNumber, duration);

      await apiService.saveCallHistory({
        phoneNumber: phoneNumber,
        status: `${finalDirection} (${type})`,
        duration: Math.round(duration),
        riskScore: callerInfo?.riskScore || 0,
        callerName: callerInfo?.name || 'Unknown Caller',
        source: 'DATABASE'
      });

      console.log('[CallDetection] Call history saved successfully');
      this.currentPhoneNumber = null; // ✅ Clear for next call
    } catch (error) {
      console.error('[CallDetection] Failed to save call history:', error);
    }
  }

  private handleShowPopup(data: any): void {
    const { phoneNumber, callState } = data;
    if (!phoneNumber || phoneNumber === "null") return; // ✅ Block stray popups

    this.currentPhoneNumber = phoneNumber;
    store.dispatch(showCallPopup({ phoneNumber }));
  }

  private handleHidePopup(): void {
    store.dispatch(hidePopup());
    // Also explicitly stop the native service to be sure
    const { NativeModules } = require('react-native');
    if (NativeModules.CallDetectionModule && NativeModules.CallDetectionModule.stopPopupService) {
        NativeModules.CallDetectionModule.stopPopupService();
    }
  }

  private handleShowSummaryPopup(data: any): void {
    const { phoneNumber, duration, callType } = data;
    store.dispatch(showSummaryPopup({
      phoneNumber,
      callType,
      duration: duration || 0
    }));
  }

  private setupAppStateListener(): void {
    this.appStateListener = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background' && Platform.OS === 'android') {
        this.startForegroundService();
      }
    });
  }

  private async initializeCallKit(): Promise<void> {
    if (Platform.OS !== 'ios' || !CallDetectionModule) return;

    try {
      console.log('[CallDetection] Syncing Professional iOS Labels...');

      // 1. Fetch blocked numbers from your API
      const blockedNumbersData = await apiService.getBlockedNumbers(0, 500);
      const blockedNumbers = blockedNumbersData.map(b => b.phone_number);

      const labels: { [key: string]: string } = {};

      // 2. Add Blocked/Spam entries with professional labels (Android style)
      blockedNumbersData.forEach(b => {
        // Example: "SPAM ALERT | Risk: 95%" or "Blocked by Shield"
        const label = b.caller_name ? `${b.caller_name} | Blocked` : 'SPAM ALERT | Shield Verified';
        labels[b.phone_number] = label;
      });

      // 3. Add Verified Contacts (Android style)
      // This maps your contacts into the iOS system list for identification
      const recentCalls = store.getState().callDetection.recentCalls;
      recentCalls.forEach(call => {
        if (call.callerName && call.callerName !== 'Unknown') {
          labels[call.phoneNumber] = `${call.callerName} | Shield Verified`;
        }
      });

      // 4. Sync to Native iOS Extension
      if (CallDetectionModule.setDirectoryData) {
        await CallDetectionModule.setDirectoryData(blockedNumbers, labels);
        console.log('✅ iOS Professional Labels synced successfully');
      }

    } catch (error) {
      console.error('❌ iOS Professional Sync Failed:', error);
    }
  }

  // Public methods
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android' && CallDetectionModule) {
      const initialized = await CallDetectionModule.initialize();
      // ✅ Request Default Spam App Role (Required for Android 10+ Screening)
      if (initialized && CallDetectionModule.requestRole) {
        await CallDetectionModule.requestRole();
      }
      return initialized;
    }
    return Promise.resolve(true);
  }

  checkOverlayPermission(): Promise<boolean> {
    if (Platform.OS === 'android' && CallDetectionModule) {
      return CallDetectionModule.checkOverlayPermission();
    }
    return Promise.resolve(true);
  }

  requestOverlayPermission(): Promise<void> {
    if (Platform.OS === 'android' && CallDetectionModule) {
      return CallDetectionModule.requestOverlayPermission();
    }
    return Promise.resolve();
  }

  startForegroundService(): Promise<void> {
    if (Platform.OS === 'android' && CallDetectionModule && CallDetectionModule.startForegroundService) {
      return CallDetectionModule.startForegroundService();
    }
    return Promise.resolve();
  }

  cleanup(): void {
    this.isListening = false;
    if (this.eventEmitter) {
      this.eventEmitter.removeAllListeners('onCallStateChanged');
      this.eventEmitter.removeAllListeners('onShowPopup');
      this.eventEmitter.removeAllListeners('onHidePopup');
      this.eventEmitter.removeAllListeners('onShowSummaryPopup');
      this.eventEmitter.removeAllListeners('onAutoBlock');
    }
    if (this.appStateListener) {
      this.appStateListener.remove();
    }
    console.log('[CallDetection] Cleaned up');
  }
}

export const callDetectionService = new CallDetectionService();