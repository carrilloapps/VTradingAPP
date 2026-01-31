module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest-setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-?native|@react-native|react-native|@react-navigation|react-native-paper|react-native-vector-icons|react-native-safe-area-context|react-native-linear-gradient|react-native-tab-view|react-native-pager-view|react-native-webview|@sentry|@microsoft|react-native-share|react-native-reanimated|react-native-view-shot|react-native-svg)/)',
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
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
