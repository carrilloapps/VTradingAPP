module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest-setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-?native|@react-native|react-native|@react-navigation|react-native-paper|react-native-vector-icons|react-native-safe-area-context|react-native-linear-gradient)/)',
  ],
};
