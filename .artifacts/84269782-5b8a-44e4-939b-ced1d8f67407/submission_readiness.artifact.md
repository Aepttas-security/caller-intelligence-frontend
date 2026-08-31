# 🛡️ Aepttas Shield - Submission Readiness Report

This report outlines the final status of the "Shield Ultimate Engine" and provides a technical guide for HR/Demo review.

---

## 📋 Real-World Data Checklist
Before submitting, verify these items with **real phone calls** (not simulators):

1.  **[ ] API URL Sync**: Ensure `src/constants/Config.ts` and `android/app/src/main/java/com/aepttas/shield/constants/Config.java` both use your **Live Production URL** (or your current stable ngrok URL).
2.  **[ ] Role Permission**: Verify that on the first launch, the app asks to be the **"Default Spam ID app"**. Without this, Android 10+ will block the before-call popup.
3.  **[ ] Contact Privacy**: Verify that `READ_CONTACTS` is allowed. The app must see your local contacts to correctly show names like "Mohan" instead of "Unknown".
4.  **[ ] Overlay Support**: Verify **"Display over other apps"** is enabled in System Settings.
5.  **[ ] Database Connection**: Ensure the backend can reach the PostgreSQL database at `100.112.49.39` via Tailscale.

---

## 🧠 Spam Detection & Risk Engine: Working Principle

The Shield Ultimate Engine uses a **Tri-Layer Weighted Logic** to calculate risk in real-time.

### Step-by-Step Execution:
1.  **Signal Capture**: The `ScreeningService` (Native Android) captures the incoming number before the phone rings.
2.  **Contact Audit (Local)**: The app checks the phone's built-in address book using fuzzy 10-digit matching. If found, Risk = 0 (Safe).
3.  **Network Lookup (Remote)**: If not in contacts, it queries the Shield Backend's `live-call/lookup` endpoint.
4.  **Pattern Analysis (AI-Lite)**: The backend runs the number through regular expressions to find "Machine Signatures".

### Risk Calculation Logic (The "0-100" Score):

| Layer | Technique | Impact | Example |
| :--- | :--- | :--- | :--- |
| **Layer 1: DNA** | Pattern Detection | **+20-40** | Number has repeating digits like `5555` or `4555 4555`. |
| **Layer 1: DNA** | Sequential Match | **+25** | Number contains `123456` or `987654`. |
| **Layer 1: DNA** | Marketing Prefix | **+40** | Starts with `140` (Legal telemarketer prefix in India). |
| **Layer 2: Community** | Viral Blocking | **+50** | If 3+ users in the Shield Network blocked this number today. |
| **Layer 2: Community** | Mass Dialer | **+30** | Number has called 5+ different Shield users in one hour. |
| **Layer 3: Context** | Midnight Rule | **+15** | Unknown caller between 11:00 PM and 6:00 AM. |
| **Layer 3: Context** | Copycat Rule | **+25** | First 5 digits match the user's own number (Prefix Spoofing). |

### Example Scenario:
*   An unknown number `+91 99405 99999` calls at **1:30 AM**.
*   **Result**:
    *   Repeating digits `99999` (**+30**)
    *   Midnight Rule (**+15**)
    *   **Total Score: 45 (Suspicious)** -> Popup shows ⚠️ Warn label.

---

## 🛠️ Final Fix List (Things to Clean Up)

1.  **[ ] Dashboard User Info**: The dashboard now uses the new UI provided by the team. Ensure user data is pulled from the backend instead of "Leo Anderson".
2.  **[ ] API Key Security**: Ensure `shield-prod-key-2024` is kept consistent between frontend and backend.
3.  **[ ] Notification Icon**: Replace the generic `ic_dialog_info` with your actual Aepttas Shield logo in the `PopupService` notification.

---

## 🚀 Demo Guide for HR
*   **Before Call**: The popup appears instantly with "🛡️ Shield Analyzing..." then updates to the real name/spam status.
*   **During Call**: User can click **Block** or **Report** directly from the popup.
*   **After Call**: A summary appears showing exactly how many seconds/minutes the call lasted and the final security verdict.
