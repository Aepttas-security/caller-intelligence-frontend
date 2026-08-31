const fs = require('fs');
const path = require('path');

const pkg = {
  name: "call-management-app",
  version: "1.0.0",
  main: "node_modules/expo/AppEntry.js",
  scripts: {
    start: "expo start",
    android: "expo start --android",
    ios: "expo start --ios",
    web: "expo start --web",
    "build:android": "expo run:android"
  },
  dependencies: {
    "expo": "~50.0.0",
    "expo-status-bar": "~1.11.0",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "react-native": "0.73.4",
    "react-native-safe-area-context": "4.8.2",
    "react-native-screens": "3.29.0",
    "react-native-gesture-handler": "~2.14.0",
    "react-native-reanimated": "~3.6.0",
    "react-native-svg": "14.0.0",
    "react-native-web": "~0.19.6",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/stack": "^6.3.20",
    "@react-navigation/bottom-tabs": "^6.5.11",
    "react-native-permissions": "^3.10.0",
    "react-native-device-info": "^10.11.0",
    "axios": "^1.6.0",
    "react-native-call-detection": "^1.0.0",
    "react-native-contacts": "^7.0.4"
  },
  devDependencies: {
    "@babel/core": "^7.23.0",
    "@types/react": "~18.2.0",
    "@types/react-native": "~0.73.0",
    "typescript": "^5.3.0"
  },
  private: true
};

// Write with proper UTF-8 without BOM
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2), { encoding: 'utf8' });

console.log('✅ package.json created successfully!');
