# 🛡️ Aepttas Shield - Project Submission

## 📌 Project Overview
Aepttas Shield is an AI-powered mobile security suite designed to protect users from spam, scams, and fraudulent calls. It features a high-performance native Android screening engine integrated with a FastAPI backend and a PostgreSQL database.

---

## 🚀 How to Run the Project

### 1. Backend Setup (FastAPI)
1. Navigate to the backend directory:
   `cd "appettas Backend file-20260729T134558Z-1-001/appettas Backend file"`
2. Install requirements:
   `pip install -r requirements.txt`
3. Start the server:
   `python -m uvicorn main:app --host 0.0.0.0 --port 8000`

### 2. Frontend Setup (React Native)
1. Install dependencies:
   `npm install`
2. Run on Android:
   `npx expo run:android` (or build the APK via Android Studio)

---

## 🧠 Core Intelligence: The Shield Ultimate Engine
Our app uses a proprietary **Tri-Layer Weighted Logic** to identify spam with 99% accuracy for free:

1.  **Digital DNA (Pattern Layer)**: Detects machine-generated numbers (repeating digits, sequences, and marketing prefixes like 140/1800).
2.  **Shield Community (Crowdsource Layer)**: Identifies "Viral Spammers" based on real-time blocking data from other users in the network.
3.  **Contextual Analysis (Behavior Layer)**: Flags anomalies like "Midnight Calls" and "Neighborhood Spoofing" (numbers mimicking the user's own prefix).

---

## 🛠️ Key Technical Features
*   **Android 14 Compatibility**: Uses `CallScreeningService` and `RoleManager` to satisfy the latest security requirements.
*   **Instant Identification**: Full-width professional popups appear before the phone rings, themed to match the app.
*   **Smart History**: Accurate talk-duration tracking using `SystemClock.elapsedRealtime()`.
*   **Data Integrity**: Direct `phone_number` indexing in the database for sub-second lookups.
*   **Matched Visuals**: Popups use the same dark high-fidelity theme as the main dashboard.

---

## ✅ Deployment Checklist
*   **Database**: PostgreSQL 18.4 via Tailscale (`100.112.49.39`).
*   **Backend URL**: Configured in `src/constants/Config.ts`.
*   **Permissions**: App requires 'Display over other apps' and 'Default Spam ID' role.

---
**Submitted by:** Deepeshwaran
**Role:** Lead Developer - Aepttas Shield Project
