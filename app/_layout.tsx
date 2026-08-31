import { Stack } from 'expo-router';
import { AppProvider } from '../src/contexts/AppContext';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { Provider } from 'react-redux';
import { store } from '../src/store';
import { CallSummaryPopup, LiveCallPopup, useCallDetection, requestCallPermissions } from '../src/modules/callDetection';
import React, { useEffect } from 'react';

function AppContent({ children }: { children: React.ReactNode }) {
  const {
    popupState,
    summaryState,
    handleDismissPopup,
    handleDismissSummary,
    handleBlockNumber,
    handleReportNumber,
    handleViewProfile
  } = useCallDetection();

  useEffect(() => {
    requestCallPermissions();
  }, []);

  const onReport = (phoneNumber: string) => {
    handleReportNumber(phoneNumber);
  };

  return (
    <>
      {children}
      {/* Live Call Popup */}
      {popupState.isVisible && (
        <LiveCallPopup
          isVisible={popupState.isVisible}
          phoneNumber={popupState.phoneNumber || ''}
          callerInfo={popupState.callerInfo}
          analysis={popupState.analysis}
          onDismiss={handleDismissPopup}
          onBlock={handleBlockNumber}
          onReport={onReport}
          isLoading={popupState.isLoading}
        />
      )}

      {/* Call Summary Popup */}
      {summaryState.isVisible && (
        <CallSummaryPopup
          isVisible={summaryState.isVisible}
          phoneNumber={summaryState.phoneNumber || ''}
          callerName={summaryState.callerName || undefined}
          callType={summaryState.callType || 'INCOMING'}
          duration={summaryState.duration}
          riskScore={summaryState.riskScore}
          threatLevel={summaryState.threatLevel}
          carrier={summaryState.carrier}
          location={summaryState.location}
          spamReports={popupState.callerInfo?.spamReports}
          reputation={popupState.callerInfo?.reputation}
          photoUrl={popupState.callerInfo?.photoUrl}
          onDismiss={handleDismissSummary}
          onBlock={handleBlockNumber}
          onReport={onReport}
        />
      )}

    </>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <AppProvider>
        <ThemeProvider>
          <AppContent>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="LoginScreen" />
              <Stack.Screen name="SignUpScreen" />
              <Stack.Screen name="DashboardScreen" />
              <Stack.Screen name="CallerIntelligenceScreen" />
              <Stack.Screen name="TwoStepBindingScreen" />
            </Stack>
          </AppContent>
        </ThemeProvider>
      </AppProvider>
    </Provider>
  );
}
