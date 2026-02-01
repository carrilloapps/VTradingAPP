module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['.'],
        alias: {
          src: './src',
          '@': './src',
        },
      },
    ],
    'react-native-worklets/plugin',
  ],
};
