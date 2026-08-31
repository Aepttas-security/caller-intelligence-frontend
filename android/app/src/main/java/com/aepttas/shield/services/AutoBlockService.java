package com.aepttas.shield.services;

import android.content.Context;
import android.util.Log;

import com.aepttas.shield.constants.Config;
import com.aepttas.shield.db.CallerEntity;
import com.aepttas.shield.helpers.NotificationHelper;

import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class AutoBlockService {
    private static final String TAG = "AutoBlockService";
    private static final ExecutorService executor = Executors.newSingleThreadExecutor();

    public static void checkAndBlock(Context context, CallerEntity caller) {
        if (caller == null) return;

        // 🛡️ Technique 6: Auto-Block Logic
        // Logic: 1) Check if total_reports > 10 or risk_score > 70
        if (caller.totalReports > 10 || caller.riskScore >= 70) {
            Log.w(TAG, "🚨 Auto-Blocking suspicious number: " + caller.phoneNumber);
            
            // 2) Set is_blocked = true (Local for UI)
            caller.isBlocked = true;
            
            // 3) Update Backend & Block List
            updateBlockStatusOnBackend(caller.phoneNumber);
            
            // 4) Send notification to user
            NotificationHelper.showSpamAlert(context, caller.callerName, caller.phoneNumber, "Auto-Blocked: Viral Spam Detected");
        }
    }

    private static void updateBlockStatusOnBackend(String phoneNumber) {
        executor.execute(() -> {
            try {
                // API: POST /api/callers/block
                URL url = new URL(Config.BACKEND_URL + "/api/callers/block");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setRequestProperty("X-API-Key", Config.API_KEY);
                conn.setDoOutput(true);

                org.json.JSONObject body = new org.json.JSONObject();
                body.put("phone_number", phoneNumber);
                body.put("is_blocked", true);
                body.put("reason", "Auto-blocked by Shield Intelligence");

                try (java.io.OutputStream os = conn.getOutputStream()) {
                    os.write(body.toString().getBytes("utf-8"));
                }

                int code = conn.getResponseCode();
                Log.d(TAG, "📤 Auto-Block Sync Status: " + code);
                conn.disconnect();
            } catch (Exception e) {
                Log.e(TAG, "❌ Auto-Block Sync Error: " + e.getMessage());
            }
        });
    }
}