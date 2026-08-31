import { useState, useCallback, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';

export interface DashboardMetrics {
  device_security_score: number;
  total_scanned: number;
  threats_detected: number;
  quarantined_files: number;
}

export interface AutoScanState {
  lastScanTimestamp: string | null;
  isScanning: boolean;
}

export const useApkScanner = () => {
  const { dashboardData, refreshDashboard } = useAppContext();

  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics>({
    device_security_score: 98,
    total_scanned: 1240,
    threats_detected: 0,
    quarantined_files: 0,
  });

  useEffect(() => {
    if (dashboardData) {
      setDashboardMetrics({
        device_security_score: Math.round(dashboardData.security_score),
        total_scanned: 1240 + dashboardData.total_calls_today,
        threats_detected: dashboardData.spam_calls_detected,
        quarantined_files: dashboardData.blocked_calls_count,
      });
    }
  }, [dashboardData]);

  const [autoScanState, setAutoScanState] = useState<AutoScanState>({
    lastScanTimestamp: new Date().toISOString(),
    isScanning: false,
  });

  const refreshData = useCallback(async () => {
    console.log('Refreshing Security data...');
    await refreshDashboard();
  }, [refreshDashboard]);

  return {
    dashboardMetrics,
    autoScanState,
    refreshData,
  };
};
