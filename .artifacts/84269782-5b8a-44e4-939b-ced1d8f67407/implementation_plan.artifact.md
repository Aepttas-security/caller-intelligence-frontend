# Implement iOS Call Directory Extension (Spam Shield for iOS)

This plan outlines the steps to add spam identification and blocking capabilities to the iOS version of the app using a **Call Directory Extension**.

## User Review Required

> [!IMPORTANT]
> - **App Groups**: This feature requires an "App Group" to be created in the Apple Developer Portal (e.g., `group.com.aepttas.shield`). You will need to add this entitlement to both the main app and the extension target in Xcode.
> - **Xcode Target**: Since I cannot physically add a new target to your Xcode project, I will provide the source files and the linking logic. You will need to manually add a "Call Directory Extension" target in Xcode and copy the provided code into it.

## Proposed Changes

### [Native iOS] Call Directory Extension

#### [NEW] [CallDirectoryHandler.swift](file:///C:/Projects/react-native-app/ios/CallDetection/CallDirectoryHandler.swift)
- Implement the `CXCallDirectoryProvider` class.
- Read blocked/identified numbers from a shared `UserDefaults` (using the App Group).
- Provide the identification labels (e.g., "Suspected Spam") to the system.

#### [MODIFY] [CallDetectionModule.swift](file:///C:/Projects/react-native-app/ios/CallDetection/CallDetectionModule.swift)
- Add a new method `updateSpamDirectory(numbers: [String], labels: [String])`.
- Store the data in shared `UserDefaults` using the App Group ID.
- Request the system to reload the extension via `CXCallDirectoryManager`.

#### [MODIFY] [CallDetectionModule.m](file:///C:/Projects/react-native-app/ios/CallDetection/CallDetectionModule.m)
- Export the new `updateSpamDirectory` method to React Native.

---

### [TypeScript] Call Detection Service

#### [MODIFY] [CallDetectionService.ts](file:///C:/Projects/react-native-app/src/modules/callDetection/services/CallDetectionService.ts)
- Add a `syncSpamDirectory()` method.
- Logic:
  1. Fetch blocked numbers from `apiService.getBlockedNumbers()`.
  2. Call `CallDetectionModule.updateSpamDirectory()` with the fetched data.
- Call this method during initialization on iOS.

## Verification Plan

### Automated Tests
- I will verify the TypeScript logic and ensure the native module exports match the frontend calls.

### Manual Verification
1. **Xcode Setup**: The user adds the extension target and enables App Groups.
2. **Sync**: Launch the app on an iPhone; verify in `Settings -> Phone -> Call Blocking & Identification` that "Aepttas Shield" appears.
3. **Trigger**: Simulate a call from a number in the blocked list; verify the "Suspected Spam" label appears on the system call screen.
