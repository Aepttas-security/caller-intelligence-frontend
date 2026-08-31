import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CallAnalysisResponse, CallerInfo, CallPopupState, CallSummaryState } from '../types/callDetection.types';

interface CallDetectionState {
  popup: CallPopupState;
  summary: CallSummaryState;
  recentCalls: Array<{
    phoneNumber: string;
    callerName: string;
    timestamp: string;
    callType: string;
  }>;
  isServiceActive: boolean;
  error: string | null;
}

const initialState: CallDetectionState = {
  popup: {
    isVisible: false,
    phoneNumber: null,
    callerInfo: null,
    analysis: null,
    isLoading: false,
    error: null
  },
  summary: {
    isVisible: false,
    phoneNumber: null,
    callerName: null,
    callType: null,
    duration: 0
  },
  recentCalls: [],
  isServiceActive: false,
  error: null
};

const callDetectionSlice = createSlice({
  name: 'callDetection',
  initialState,
  reducers: {
    // Popup actions
    setCallPopup: (state, action: PayloadAction<Partial<CallPopupState>>) => {
      state.popup = { ...state.popup, ...action.payload };
    },
    showCallPopup: (state, action: PayloadAction<{ phoneNumber: string; callerInfo?: CallerInfo }>) => {
      state.popup.isVisible = true;
      state.popup.phoneNumber = action.payload.phoneNumber;
      if (action.payload.callerInfo) {
        state.popup.callerInfo = action.payload.callerInfo;
      }
      state.popup.isLoading = true;
      state.popup.error = null;
    },
    hidePopup: (state) => {
      state.popup.isVisible = false;
      state.popup.phoneNumber = null;
      state.popup.callerInfo = null;
      state.popup.analysis = null;
      state.popup.isLoading = false;
      state.popup.error = null;
    },
    setPopupAnalysis: (state, action: PayloadAction<CallAnalysisResponse>) => {
      state.popup.analysis = action.payload;
      state.popup.isLoading = false;
    },
    setPopupError: (state, action: PayloadAction<string>) => {
      state.popup.error = action.payload;
      state.popup.isLoading = false;
    },
    
    // Summary actions
    showSummaryPopup: (state, action: PayloadAction<Partial<CallSummaryState>>) => {
      state.summary.isVisible = true;
      state.summary = { ...state.summary, ...action.payload };
    },
    hideSummary: (state) => {
      state.summary.isVisible = false;
      state.summary.phoneNumber = null;
      state.summary.callerName = null;
      state.summary.callType = null;
      state.summary.duration = 0;
    },
    
    // Recent calls
    addRecentCall: (state, action: PayloadAction<{
      phoneNumber: string;
      callerName: string;
      callType: string;
    }>) => {
      state.recentCalls.unshift({
        ...action.payload,
        timestamp: new Date().toISOString()
      });
      if (state.recentCalls.length > 50) {
        state.recentCalls.pop();
      }
    },
    clearRecentCalls: (state) => {
      state.recentCalls = [];
    },
    
    // Service state
    setServiceActive: (state, action: PayloadAction<boolean>) => {
      state.isServiceActive = action.payload;
    },
    setServiceError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    clearServiceError: (state) => {
      state.error = null;
    }
  }
});

export const {
  setCallPopup,
  showCallPopup,
  hidePopup,
  setPopupAnalysis,
  setPopupError,
  showSummaryPopup,
  hideSummary,
  addRecentCall,
  clearRecentCalls,
  setServiceActive,
  setServiceError,
  clearServiceError
} = callDetectionSlice.actions;

export default callDetectionSlice.reducer;