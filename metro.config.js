/**
 * @type {import('expo/metro-config').MetroConfig}
 */
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// 1. Ensure Metro recognizes .jsx files
config.resolver.sourceExts = [
  ...(config.resolver.sourceExts || []),
  'jsx',
];

// 2. Polyfill Node core modules for compatibility
config.resolver.extraNodeModules = {
  stream: require.resolve('stream-browserify'),
  crypto: require.resolve('crypto-browserify'),
  buffer: require.resolve('buffer/'),
  process: require.resolve('process/'),
};

// 3. Disable package.json exports resolution to allow old-style requires
config.resolver.unstable_enablePackageExports = false;

// 4. Watch root node_modules to support linked or monorepo modules
config.watchFolders = [
  path.resolve(__dirname, 'node_modules'),
];

module.exports = config;
