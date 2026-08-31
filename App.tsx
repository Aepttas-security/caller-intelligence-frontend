import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { CallSummaryPopup, LiveCallPopup, useCallDetection, requestCallPermissions } from './src/modules/callDetection';
import { store } from './src/store';

const AppContent = () => {
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

  // FIX: Wrapper function that calls handleReportNumber with default reason
  const onReport = (phoneNumber: string) => {
    handleReportNumber(phoneNumber); // âœ… Now passes 1 argument
  };

  return (
    <>
      {/* Live Call Popup */}
      {popupState.isVisible && (
        <LiveCallPopup
          isVisible={popupState.isVisible}
          phoneNumber={popupState.phoneNumber || ''}
          callerInfo={popupState.callerInfo}
          analysis={popupState.analysis}
          onDismiss={handleDismissPopup}
          onBlock={handleBlockNumber}
          onReport={onReport}  // âœ… Use wrapper
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
          onReport={onReport}  // âœ… Use wrapper
        />
      )}

    </>
  );
};

const App = () => {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
};

export default App;
