package com.aepttas.shield;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.telephony.TelephonyManager;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class CallDetectionModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;

    public CallDetectionModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "CallDetectionModule";
    }

    @ReactMethod
    public void initialize(Promise promise) {
        // Initialization logic if any
        promise.resolve(true);
    }

    @ReactMethod
    public void initialize() {
        // Overloaded for JS calls that don't pass promise
    }

    @ReactMethod
    public void checkOverlayPermission(Promise promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            promise.resolve(Settings.canDrawOverlays(reactContext));
        } else {
            promise.resolve(true);
        }
    }

    @ReactMethod
    public void requestOverlayPermission(Promise promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + reactContext.getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            reactContext.startActivity(intent);
        }
        promise.resolve(null);
    }

    @ReactMethod
    public void startForegroundService(Promise promise) {
        // Implementation for starting foreground service if needed
        promise.resolve(null);
    }

    @ReactMethod
    public void requestPermissions(Promise promise) {
        // Permissions are usually handled via react-native-permissions, 
        // but we can return true here if they are already granted in Manifest.
        promise.resolve(true);
    }

    @ReactMethod
    public void startCallDetection(Promise promise) {
        promise.resolve(true);
    }

    @ReactMethod
    public void stopCallDetection(Promise promise) {
        promise.resolve(true);
    }

    @ReactMethod
    public void getCallState(Promise promise) {
        WritableMap map = Arguments.createMap();
        map.putInt("state", 0); // IDLE
        map.putString("stateName", "IDLE");
        map.putBoolean("isActive", false);
        promise.resolve(map);
    }

    @ReactMethod
    public void isCallActive(Promise promise) {
        promise.resolve(false);
    }

    public void sendEvent(String eventName, WritableMap params) {
        reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, params);
    }
}
