# Implementation Plan: Shield Intelligence System Integration

This plan integrates the **Aepttas Shield** Android app with the `apt.apt_callers_b` database schema to provide Truecaller-like features: contact syncing, real-time lookups, spam reporting, and auto-blocking.

## User Review Required

> [!IMPORTANT]
> This implementation assumes a backend is running at `Config.BACKEND_URL` with endpoints for `/api/callers/*` and `/api/reports/*`. You will need to verify the backend database schema matches `apt.apt_callers_b`.

## Proposed Changes

### [Android] Data & Persistence Layer
Set up a local Room database to cache caller intelligence for offline use.

#### [NEW] [CallerEntity.java](file:///D:/Projects/react-native-app/android/app/src/main/java/com/aepttas/shield/db/CallerEntity.java)
Room entity mapping to the `apt.apt_callers_b` schema.
#### [NEW] [CallerDao.java](file:///D:/Projects/react-native-app/android/app/src/main/java/com/aepttas/shield/db/CallerDao.java)
DAO for caching and searching caller data.
#### [NEW] [ShieldDatabase.java](file:///D:/Projects/react-native-app/android/app/src/main/java/com/aepttas/shield/db/ShieldDatabase.java)
Main Room database class.

---

### [Android] Core Services & Helpers
Implement the intelligence services using the provided prompts as functional requirements.

#### [MODIFY] [ContactSyncHelper.java](file:///D:/Projects/react-native-app/android/app/src/main/java/com/aepttas/shield/helpers/ContactSyncHelper.java)
Update to support batch processing with `apt_callers_b` mapping and `WorkManager` support.
#### [NEW] [ContactLookupService.java](file:///D:/Projects/react-native-app/android/app/src/main/java/com/aepttas/shield/services/ContactLookupService.java)
Implements dual-layer lookup (Room Cache -> Remote API).
#### [NEW] [AutoBlockService.java](file:///D:/Projects/react-native-app/android/app/src/main/java/com/aepttas/shield/services/AutoBlockService.java)
Logic for automated blocking based on risk scores and report counts.
#### [MODIFY] [SpamReportHelper.java](file:///D:/Projects/react-native-app/android/app/src/main/java/com/aepttas/shield/helpers/SpamReportHelper.java)
Update to map to the new `/api/reports/spam` endpoint.

---

### [React Native] Bridge Integration
Expose the intelligence features to the React Native layer.

#### [NEW] [CallerDirectoryModule.java](file:///D:/Projects/react-native-app/android/app/src/main/java/com/aepttas/shield/CallerDirectoryModule.java)
Native module providing `uploadContacts`, `lookupNumber`, and `reportSpam` to JavaScript.

---

### [Android] UI Integration
Update the call popup to reflect detailed intelligence data.

#### [MODIFY] [PopupService.java](file:///D:/Projects/react-native-app/android/app/src/main/java/com/aepttas/shield/services/PopupService.java)
Update UI to display risk scores, total reports, and provide an "Auto-Block" toggle.

## Verification Plan

### Automated Tests
- Unit tests for `PrivacyPolicyManager` (GDPR checks).
- Room database migration tests.

### Manual Verification
1. **Contact Upload**: Trigger sync and verify backend receiving JSON with `caller_name` and `phone_number`.
2. **Lookup**: Call from a number in the database; verify the popup shows "Risk Score" and "Total Reports".
3. **Spam Report**: Press "Report Spam" on popup; verify backend increments `total_reports`.
4. **Auto-Block**: Simulate a number with 10+ reports; verify `AutoBlockService` triggers system block.
