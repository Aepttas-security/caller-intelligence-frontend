package com.aepttas.shield.helpers;

import android.content.ContentResolver;
import android.content.Context;
import android.database.Cursor;
import android.provider.ContactsContract;
import android.util.Log;

import com.aepttas.shield.constants.Config;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class ContactSyncHelper {
    private static final String TAG = "ContactSyncHelper";
    private static final ExecutorService executor = Executors.newSingleThreadExecutor();

    public static void syncContacts(Context context) {
        // 🛡️ Technique 5: Regional Privacy Check
        if (!PrivacyPolicyManager.isContactSyncAllowed(context)) {
            Log.i(TAG, "🚫 Contact sync disabled for this region (GDPR Compliance)");
            return;
        }

        executor.execute(() -> {
            try {
                Log.d(TAG, "🔄 Starting Contact Sync...");
                JSONArray contactsArray = new JSONArray();
                ContentResolver resolver = context.getContentResolver();
                
                // 🛡️ Technique 1: Uploading Complete Contact Lists
                Cursor cursor = resolver.query(
                    ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
                    new String[]{
                        ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
                        ContactsContract.CommonDataKinds.Phone.NUMBER
                    },
                    null, null, null
                );

                if (cursor != null) {
                    while (cursor.moveToNext()) {
                        String name = cursor.getString(0);
                        String phone = cursor.getString(1);
                        
                        JSONObject contact = new JSONObject();
                        contact.put("name", name);
                        contact.put("phone", phone);
                        contactsArray.put(contact);
                        
                        // Batch upload every 100 contacts to avoid memory issues
                        if (contactsArray.length() >= 100) {
                            uploadBatch(contactsArray);
                            contactsArray = new JSONArray();
                        }
                    }
                    cursor.close();
                }
                
                // Final batch upload
                if (contactsArray.length() > 0) {
                    uploadBatch(contactsArray);
                }
                
                Log.d(TAG, "✅ Contact Sync Completed");
            } catch (Exception e) {
                Log.e(TAG, "❌ Sync Error: " + e.getMessage());
            }
        });
    }

    private static void uploadBatch(JSONArray contacts) throws Exception {
        URL url = new URL(Config.BACKEND_URL + "/api/sync/contacts");
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setRequestProperty("X-API-Key", Config.API_KEY);
        conn.setDoOutput(true);

        try (OutputStream os = conn.getOutputStream()) {
            byte[] input = contacts.toString().getBytes("utf-8");
            os.write(input, 0, input.length);
        }

        int code = conn.getResponseCode();
        Log.d(TAG, "📤 Batch Upload Status: " + code);
        conn.disconnect();
    }
}