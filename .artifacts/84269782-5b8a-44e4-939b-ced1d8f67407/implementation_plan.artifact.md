# Implementation Plan - Shield Ultimate Risk Engine

This plan implements the comprehensive, lifetime-free spam detection logic using digital patterns, network crowdsourcing, and contextual analysis.

## User Review Required

> [!IMPORTANT]
> **Auto-Block Threshold**: Following the proposed logic, calls with a Risk Score of **85 or higher** will be automatically rejected by the system before the phone rings.
>
> **Time Zone Note**: The "Midnight Rule" uses the server's current time. For more precision, we would need to pass the user's local time zone from the app, but server time is a safe "Free" starting point.

## Proposed Changes

### [Backend] Risk Intelligence

#### [MODIFY] [main.py](file:///C:/Projects/react-native-app/appettas%20Backend%20file-20260729T134558Z-1-001/appettas%20Backend%20file/main.py)
- **New Logic**: Implement `check_patterns(number)` to detect repetitions, sequences, and risky country codes.
- **Enhanced `calculate_risk_score`**:
    - **Digital DNA**: Pattern matching (+30), Staircase rule (+20), Marketing prefixes (+40).
    - **Shield Community**: Viral blocking check (+50 if 3+ blocks in 24h), Mass dialer check (+30 if calling many unique users).
    - **Context**: Midnight rule (+15), Copycat/Neighborhood spoofing (+25).
- **Usage Update**: Pass `receiver_number` to the risk engine during analysis for neighborhood spoofing detection.

### [Native Android] Deep Defense

#### [MODIFY] [ScreeningService.java](file:///C:/Projects/react-native-app/android/app/src/main/java/com/aepttas/shield/services/ScreeningService.java)
- **Auto-Block Sync**: Update the pre-ring rejection logic to trigger at **Score >= 85** (previously 90) to match the new professional logic.

## Verification Plan

### Manual Verification
1. **Pattern Test**: Add a contact with digits `123456` and verify its risk score increases.
2. **Marketing Test**: Simulate a call from a number starting with `140` and verify it is labeled as Spam.
3. **Neighborhood Test**: Receive a call from a number starting with the same 5 digits as yours; verify the "Neighborhood Spoofing" warning appears.
4. **Auto-Block Test**: Simulate a call from a known viral spammer (manually adjust DB to test) and verify the call is rejected.
