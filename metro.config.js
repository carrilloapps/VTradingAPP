const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const { withSentryConfig } = require('@sentry/react-native/metro');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const defaultConfig = getDefaultConfig(__dirname);
const { assetExts, sourceExts } = defaultConfig.resolver;

const config = {
  resolver: {
    assetExts: assetExts.filter(ext => ext !== 'svg'),
    sourceExts: [...sourceExts, 'svg'],
    // Ensure we resolve react-native fields first to avoid issues with some packages
    mainFields: ['react-native', 'browser', 'main'],

    // Fix for @react-native-firebase/app "invalid package.json" warnings
    resolveRequest: (context, moduleName, platform) => {
      // Check if this is a request for the problematic firebase internal modules
      if (
        moduleName.startsWith('@react-native-firebase/app/lib/internal/') ||
        moduleName.startsWith('@react-native-firebase/app/lib/common/')
      ) {
        try {
          // We map the requested path to the physical location in dist/module with .js extension
          // This bypasses the broken "exports" mapping in the package.json
          const relativePath = moduleName.replace(
            '@react-native-firebase/app/lib/',
            '',
          );
          const filePath = path.resolve(
            __dirname,
            'node_modules/@react-native-firebase/app/dist/module',
            relativePath + '.js',
          );

          return {
            filePath,
            type: 'sourceFile',
          };
        } catch (e) {
          console.log('Firebase module resolve error:', e);
          // Fallback to default resolution if anything goes wrong
        }
      }

      // Default resolution for everything else
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = withSentryConfig(mergeConfig(defaultConfig, config));
