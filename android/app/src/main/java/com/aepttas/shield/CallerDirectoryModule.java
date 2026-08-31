package com.aepttas.shield;

import com.aepttas.shield.db.CallerEntity;
import com.aepttas.shield.helpers.ContactSyncHelper;
import com.aepttas.shield.helpers.SpamReportHelper;
import com.aepttas.shield.services.ContactLookupService;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;

public class CallerDirectoryModule extends ReactContextBaseJavaModule {

    public CallerDirectoryModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "CallerDirectoryModule";
    }

    @ReactMethod
    public void uploadContacts(Promise promise) {
        try {
            ContactSyncHelper.syncContacts(getReactApplicationContext());
            promise.resolve("Sync Started");
        } catch (Exception e) {
            promise.reject("SYNC_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void lookupNumber(String phoneNumber, Promise promise) {
        ContactLookupService.lookup(getReactApplicationContext(), phoneNumber, new ContactLookupService.OnLookupCompleted() {
            @Override
            public void onResult(CallerEntity caller) {
                if (caller != null) {
                    WritableMap map = Arguments.createMap();
                    map.putString("callerName", caller.callerName);
                    map.putString("phoneNumber", caller.phoneNumber);
                    map.putInt("riskScore", caller.riskScore);
                    map.putInt("reputationScore", caller.reputationScore);
                    map.putInt("totalReports", caller.totalReports);
                    map.putBoolean("isSpam", caller.isSpam);
                    map.putBoolean("isBlocked", caller.isBlocked);
                    map.putString("carrier", caller.carrier);
                    map.putString("location", caller.location);
                    promise.resolve(map);
                } else {
                    promise.resolve(null);
                }
            }

            @Override
            public void onError(String message) {
                promise.reject("LOOKUP_ERROR", message);
            }
        });
    }

    @ReactMethod
    public void reportSpam(String phone, String type, String comment, Promise promise) {
        try {
            SpamReportHelper.reportSpam(getReactApplicationContext(), phone, type, comment);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("REPORT_ERROR", e.getMessage());
        }
    }
}