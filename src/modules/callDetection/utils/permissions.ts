// src/modules/callDetection/utils/permissions.ts
import { Alert, Linking, PermissionsAndroid, Platform } from 'react-native';

export const requestSpamRole = async (): Promise<boolean> => {
  if (Platform.OS === 'android' && Platform.Version >= 29) {
    try {
      // @ts-ignore
      const { CallDetectionModule } = require('react-native').NativeModules;
      if (CallDetectionModule) {
        return await CallDetectionModule.requestRole();
      }
    } catch (err) {
      console.error('Role request error:', err);
    }
  }
  return true;
};

export const requestCallPermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
        PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
      ];

      const granted = await PermissionsAndroid.requestMultiple(permissions);
      
      const allGranted = Object.values(granted).every(
        status => status === PermissionsAndroid.RESULTS.GRANTED
      );

      // Also request Spam Role for Android 10+
      if (allGranted) {
        await requestSpamRole();

        // ✅ NEW: Explicitly check and request Overlay Permission
        const hasOverlay = await checkOverlayPermission();
        if (!hasOverlay) {
          Alert.alert(
            'Overlay Permission Required',
            'To show caller ID over other apps (Truecaller style), please enable "Display over other apps" for Shield.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Settings', onPress: () => requestOverlayPermission() }
            ]
          );
        }
      }

      if (!allGranted) {
        const deniedPermissions = Object.entries(granted)
          .filter(([_, status]) => status !== PermissionsAndroid.RESULTS.GRANTED)
          .map(([perm]) => perm);
        
        Alert.alert(
          'Permissions Required',
          `Please grant all permissions for call identification and spam protection to work correctly.\n\nMissing: ${deniedPermissions.join(', ')}`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
      }

      return allGranted;
      
    } catch (err) {
      console.error('Permission error:', err);
      return false;
    }
  }
  
  return true;
};

export const checkOverlayPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      // @ts-ignore - Native module method
      const { CallDetectionModule } = require('react-native').NativeModules;
      if (CallDetectionModule) {
        return await CallDetectionModule.checkOverlayPermission();
      }
      return false;
    } catch (err) {
      console.error('Overlay permission check error:', err);
      return false;
    }
  }
  return true;
};

export const requestOverlayPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      // @ts-ignore - Native module method
      const { CallDetectionModule } = require('react-native').NativeModules;
      if (CallDetectionModule) {
        await CallDetectionModule.requestOverlayPermission();
        await new Promise(resolve => setTimeout(resolve, 2000));
        return await checkOverlayPermission();
      }
      return false;
    } catch (err) {
      console.error('Overlay permission request error:', err);
      return false;
    }
  }
  return true;
};

export const checkAllPermissions = async (): Promise<{
  allGranted: boolean;
  phoneState: boolean;
  callLog: boolean;
  notifications: boolean;
  foregroundService: boolean;
  overlay: boolean;
}> => {
  if (Platform.OS === 'android') {
    try {
      const results = {
        phoneState: false,
        callLog: false,
        notifications: false,
        foregroundService: false,
        overlay: false
      };

      const phoneState = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE
      );
      const callLog = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.READ_CALL_LOG
      );
      const notifications = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );

      results.phoneState = phoneState;
      results.callLog = callLog;
      results.notifications = notifications;
      results.foregroundService = true; // Handled by native module
      results.overlay = await checkOverlayPermission();

      const allGranted = Object.values(results).every(v => v === true);

      return { allGranted, ...results };
    } catch (err) {
      console.error('Permission check error:', err);
      return {
        allGranted: false,
        phoneState: false,
        callLog: false,
        notifications: false,
        foregroundService: false,
        overlay: false
      };
    }
  }
  
  return {
    allGranted: true,
    phoneState: true,
    callLog: true,
    notifications: true,
    foregroundService: true,
    overlay: true
  };
};