// src/modules/callDetection/hooks/useCallPopup.ts
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { callDetectionService } from '../services/CallDetectionService';
import {
    addRecentCall,
    hidePopup,
    hideSummary
} from '../store/callDetectionSlice';
import { CallerInfo } from '../types/callDetection.types';

export const useCallDetection = () => {
  const dispatch = useDispatch();
  const [isServiceActive, setIsServiceActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const popupState = useSelector((state: RootState) => state.callDetection.popup);
  const summaryState = useSelector((state: RootState) => state.callDetection.summary);

  useEffect(() => {
    initializeService();

    return () => {
      callDetectionService.cleanup();
    };
  }, []);

  const initializeService = async () => {
    try {
      callDetectionService.initialize();
      setIsServiceActive(true);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize call detection';
      setError(errorMessage);
      setIsServiceActive(false);
    }
  };

  const handleDismissPopup = () => {
    dispatch(hidePopup());
  };

  const handleDismissSummary = () => {
    dispatch(hideSummary());
  };

  const handleBlockNumber = async (phoneNumber: string) => {
    try {
      console.log('[CallDetection] Blocking number:', phoneNumber);
      const { NativeModules } = require('react-native');
      if (NativeModules.CallDetectionModule && NativeModules.CallDetectionModule.blockNumber) {
        await NativeModules.CallDetectionModule.blockNumber(phoneNumber);
      }

      // Also update database via API
      const api = require('../../../services/api').default;
      await api.blockNumber({
        phone_number: phoneNumber,
        block_reason: 'User blocked via summary popup',
        is_permanent: true
      });

      dispatch(hidePopup());
      dispatch(hideSummary());
    } catch (error) {
      console.error('[CallDetection] Block failed:', error);
    }
  };

  const handleReportNumber = async (phoneNumber: string) => {
    try {
      console.log('[CallDetection] Reporting number:', phoneNumber);
      const api = require('../../../services/api').default;
      await api.createReport({
        caller_number: phoneNumber,
        report_type: 'Spam',
        description: 'Reported via summary popup'
      });

      // Optionally block as well
      await handleBlockNumber(phoneNumber);
    } catch (error) {
      console.error('[CallDetection] Report failed:', error);
    }
  };

  const handleViewProfile = (callerInfo: CallerInfo) => {
    console.log('[CallDetection] Viewing profile:', callerInfo);
    dispatch(hidePopup());
  };

  const handleCloseSummary = () => {
    dispatch(hideSummary());
  };

  const handleAddRecentCall = (phoneNumber: string, callerName: string, callType: string) => {
    dispatch(addRecentCall({
      phoneNumber,
      callerName,
      callType
    }));
  };

  return {
    isServiceActive,
    error,
    popupState,
    summaryState,
    handleDismissPopup,
    handleDismissSummary,
    handleBlockNumber,
    handleReportNumber,
    handleViewProfile,
    handleCloseSummary,
    handleAddRecentCall
  };
};