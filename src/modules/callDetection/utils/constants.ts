// src/modules/callDetection/utils/constants.ts
export const CALL_STATES = {
  RINGING: 'RINGING',
  OFFHOOK: 'OFFHOOK',
  IDLE: 'IDLE',
  MISSED: 'MISSED',
  ANSWERED: 'ANSWERED',
  REJECTED: 'REJECTED'
} as const;

export type CallState = typeof CALL_STATES[keyof typeof CALL_STATES];

export const THREAT_LEVELS = {
  SAFE: 'Safe',
  SUSPICIOUS: 'Suspicious',
  SPAM: 'Spam',
  SCAM: 'Scam',
  CRITICAL: 'Critical Scam'
} as const;

export type ThreatLevel = typeof THREAT_LEVELS[keyof typeof THREAT_LEVELS];

export const CALL_TYPES = {
  INCOMING: 'INCOMING',
  OUTGOING: 'OUTGOING',
  MISSED: 'MISSED',
  REJECTED: 'REJECTED',
  ANSWERED: 'ANSWERED'
} as const;

export type CallType = typeof CALL_TYPES[keyof typeof CALL_TYPES];

export const POPUP_TIMING = {
  SHOW_DELAY: 300,
  HIDE_DELAY: 500,
  SUMMARY_DELAY: 1000,
  ANIMATION_DURATION: 400
} as const;

export const DEFAULT_IMAGE = 'https://via.placeholder.com/100/1a1a2e/ffffff?text=?';

// ✅ Updated to match your backend API endpoints
export const API_ENDPOINTS = {
  ANALYZE_CALL: '/api/live-call/analyze',     // POST
  BLOCK_NUMBER: '/api/blocked-numbers',       // POST
  REPORT_NUMBER: '/api/reports',              // POST
  CALL_HISTORY: '/api/calls',                 // GET
  ADVERTISEMENT: '/api/advertisements/next',  // GET
  AD_IMPRESSION: '/api/advertisements/impression', // POST
  CALLER_INFO: '/api/caller',                 // GET
  RISK_ANALYSIS: '/api/caller/risk-analysis', // GET
  NUMBER_SEARCH: '/api/number-search',        // GET
  SETTINGS: '/api/settings',                  // GET/PUT
  DASHBOARD: '/api/dashboard',                // GET
  ALERTS: '/api/alerts',                      // GET
  SPAM_CALLS: '/api/spam-calls',              // GET
  BLOCKED_CALLS: '/api/blocked-calls'         // GET
} as const;

export const STORAGE_KEYS = {
  CALL_HISTORY: '@callDetection/callHistory',
  BLOCKED_NUMBERS: '@callDetection/blockedNumbers',
  SETTINGS: '@callDetection/settings',
  RECENT_CALLS: '@callDetection/recentCalls'
} as const;