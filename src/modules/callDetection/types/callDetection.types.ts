export interface CallerInfo {
  id?: string;
  name: string;
  phoneNumber: string;
  carrier: string;
  location: string;
  riskScore: number;
  threatLevel: 'Safe' | 'Suspicious' | 'Spam' | 'Scam' | 'Critical Scam';
  spamReports: number;
  reputation: number;
  isBlocked: boolean;
  photoUrl?: string;
  communityRating?: number;
}

export interface CallAnalysisResponse {
  callerInfo: CallerInfo;
  riskScore: number;
  threatLevel: string;
  scamProbability: number;
  isBlocked: boolean;
  categories: string[];
}

export interface CallPopupState {
  isVisible: boolean;
  phoneNumber: string | null;
  callerInfo: CallerInfo | null;
  analysis: CallAnalysisResponse | null;
  isLoading: boolean;
  error: string | null;
}

export interface CallSummaryState {
  isVisible: boolean;
  phoneNumber: string | null;
  callerName: string | null;
  callType: 'INCOMING' | 'OUTGOING' | 'MISSED' | 'REJECTED' | 'ANSWERED' | null;
  duration: number;
  riskScore?: number;
  threatLevel?: string;
  carrier?: string;
  location?: string;
}

export interface CallHistoryEntry {
  id: string;
  phoneNumber: string;
  callerName: string;
  callType: 'INCOMING' | 'OUTGOING' | 'MISSED' | 'REJECTED' | 'ANSWERED';
  duration: number;
  timestamp: string;
  riskScore: number;
  threatLevel: string;
  carrier: string;
  location: string;
}

export interface AdBanner {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  ctaUrl: string;
  campaignId: string;
}

export interface CallDetectionConfig {
  enableLivePopup: boolean;
  enableSummaryPopup: boolean;
  enableAutoBlock: boolean;
  autoBlockThreshold: number;
  enableSpamDetection: boolean;
}