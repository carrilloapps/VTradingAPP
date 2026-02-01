module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest-setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-?native|@react-native|react-native|@react-navigation|react-native-paper|react-native-vector-icons|react-native-safe-area-context|react-native-linear-gradient|react-native-tab-view|react-native-pager-view|react-native-webview|@sentry|@microsoft|react-native-share|react-native-reanimated|react-native-view-shot|react-native-svg|react-native-mmkv|react-native-config|react-native-worklets)/)',
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    // 'src/**/*.{js,jsx,ts,tsx}',
    'src/services/**/*.{js,jsx,ts,tsx}',
    'src/config/**/*.{js,jsx,ts,tsx}',
    'src/constants/**/*.{js,jsx,ts,tsx}',
    'src/hooks/**/*.{js,jsx,ts,tsx}',
    'src/stores/**/*.{js,jsx,ts,tsx}',
    'src/utils/**/*.{js,jsx,ts,tsx}',
    'src/widget/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/assets/**',
    '!**/node_modules/**',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/android/',
    '/ios/',
    '/scripts/',
    '/__tests__/',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
