package com.aepttas.shield.services;

import android.content.Context;
import android.util.Log;

import com.aepttas.shield.constants.Config;
import com.aepttas.shield.db.CallerDao;
import com.aepttas.shield.db.CallerEntity;
import com.aepttas.shield.db.ShieldDatabase;

import org.json.JSONObject;

import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Scanner;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class ContactLookupService {
    private static final String TAG = "ContactLookupService";
    private static final ExecutorService executor = Executors.newCachedThreadPool();

    public interface OnLookupCompleted {
        void onResult(CallerEntity caller);
        void onError(String message);
    }

    public static void lookup(Context context, String phoneNumber, OnLookupCompleted callback) {
        executor.execute(() -> {
            try {
                ShieldDatabase db = ShieldDatabase.getDatabase(context);
                CallerDao dao = db.callerDao();

                // 1. Search Local Room Cache
                CallerEntity localCaller = dao.getByPhoneNumber(phoneNumber);
                if (localCaller != null) {
                    Log.d(TAG, "📦 Found in Local Cache: " + localCaller.callerName);
                    // Check if data is fresh (e.g., less than 24 hours old)
                    if (System.currentTimeMillis() - localCaller.lastUpdated < 86400000) {
                        callback.onResult(localCaller);
                        return;
                    }
                }

                // 2. Remote API Lookup
                lookupRemote(phoneNumber, new OnLookupCompleted() {
                    @Override
                    public void onResult(CallerEntity remoteCaller) {
                        if (remoteCaller != null) {
                            remoteCaller.lastUpdated = System.currentTimeMillis();
                            dao.insertOrUpdate(remoteCaller);
                        }
                        callback.onResult(remoteCaller);
                    }

                    @Override
                    public void onError(String message) {
                        // If remote fails but we have local, return local
                        if (localCaller != null) {
                            callback.onResult(localCaller);
                        } else {
                            callback.onError(message);
                        }
                    }
                });

            } catch (Exception e) {
                Log.e(TAG, "❌ Lookup Task Error: " + e.getMessage());
                callback.onError(e.getMessage());
            }
        });
    }

    private static void lookupRemote(String phoneNumber, OnLookupCompleted callback) {
        try {
            URL url = new URL(Config.BACKEND_URL + "/api/callers/lookup/" + phoneNumber);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("X-API-Key", Config.API_KEY);
            conn.setConnectTimeout(5000);

            if (conn.getResponseCode() == 200) {
                Scanner s = new Scanner(conn.getInputStream()).useDelimiter("\\A");
                String result = s.hasNext() ? s.next() : "";
                JSONObject json = new JSONObject(result);

                CallerEntity caller = new CallerEntity();
                caller.phoneNumber = phoneNumber;
                caller.callerName = json.optString("caller_name", "Unknown");
                caller.riskScore = json.optInt("risk_score", 0);
                caller.reputationScore = json.optInt("reputation_score", 50);
                caller.totalReports = json.optInt("total_reports", 0);
                caller.isSpam = json.optBoolean("is_spam", false);
                caller.isBlocked = json.optBoolean("is_blocked", false);
                caller.carrier = json.optString("carrier", "Unknown");
                caller.location = json.optString("location", "Unknown");
                
                callback.onResult(caller);
            } else {
                callback.onError("Server Error: " + conn.getResponseCode());
            }
            conn.disconnect();
        } catch (Exception e) {
            callback.onError(e.getMessage());
        }
    }
}