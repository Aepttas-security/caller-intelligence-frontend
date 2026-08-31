# iOS Call Detection & Spam Blocking Feasibility Report

Implementing call features on iOS is significantly more restricted than on Android due to Apple's privacy policies. Below is a comparison of how the features will work on iOS.

## Feature Comparison: Android vs. iOS

| Feature | Android (Current) | iOS (Proposed) |
| :--- | :--- | :--- |
| **Incoming Number** | Real-time access to phone number. | **Restricted**. Apps cannot see the incoming number in real-time. |
| **Popup UI** | Custom Dark Popup over other apps. | **Impossible**. Apple forbids drawing over the native dialer. |
| **Caller ID** | Real-time API lookup and DB check. | **Pre-cached List**. App must provide a list of numbers to iOS ahead of time. |
| **Spam Blocking** | Real-time rejection by app logic. | **System Handled**. iOS blocks numbers present in your "Call Directory". |
| **Contact Sync** | Real-time `READ_CONTACTS` lookup. | Integrated into the Call Directory matching. |

---

## 🛠️ The "iOS Way": Call Directory Extension

To provide the features you want for iOS, we must use a **Call Directory Extension**.

### 1. Before Call Experience
Instead of a dark popup, the user will see your app's branding directly in the iOS incoming call screen:
- **Example**: `+91 91505...`
- **Sub-label**: `Aepttas Shield: Suspected Spam`

### 2. Implementation Strategy
1.  **Shared Storage**: We create a small shared database (App Group) that both your React Native app and the iOS Extension can see.
2.  **Number Syncing**: Whenever your app starts, it will download the latest "Spam" and "Blocked" lists from your backend and save them to this shared storage.
3.  **Extension Activation**: The iOS System will read this storage and automatically identify/block those numbers.

### 3. Critical Requirement
For this to work, the user **must** manually go to:
`Settings → Phone → Call Blocking & Identification` and toggle **ON** `Aepttas Shield`.

---

## 📈 Next Steps
Would you like me to:
1.  **Implement the Shared Storage Logic**: So the app is ready to feed data to iOS?
2.  **Guide you through adding the Extension**: (This part requires Xcode interaction which I can provide the code for)?

> [!CAUTION]
> **No Popups on iOS**: I cannot make a custom floating popup appear on iOS during a call. We must rely on the labels shown by the iPhone system itself.
