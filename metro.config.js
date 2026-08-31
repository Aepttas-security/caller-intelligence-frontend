// metro.config.js
const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix for Node.js built-in modules handling to prevent invalid path issues
const existingBlockList = Array.isArray(config.resolver.blockList) ? config.resolver.blockList : [];
config.resolver.blockList = [
  ...existingBlockList,
  /node_modules\/.*\/node:.*/, // Block invalid node: protocol paths in Metro
];

module.exports = config;
