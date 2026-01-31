import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import globals from 'globals';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import eslintPluginPrettier from 'eslint-plugin-prettier';
import eslintPluginReact from 'eslint-plugin-react';
import eslintPluginReactNative from 'eslint-plugin-react-native';
import eslintPluginJest from 'eslint-plugin-jest';
import babelParser from '@babel/eslint-parser';

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: [
      '.agent/*',
      '.bundle/*',
      'android/*',
      'ios/*',
      'node_modules/*',
      'vendor/*',
      'dist/*',
      'coverage/*',
    ],
  },
  {
    plugins: {
      prettier: eslintPluginPrettier,
      react: eslintPluginReact,
      'react-native': eslintPluginReactNative,
      jest: eslintPluginJest,
    },
  },
  ...compat.extends('@react-native'),
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        project: null,
        babelOptions: {
          presets: ['@react-native/babel-preset'],
        },
      },
      globals: {
        ...globals.node,
      },
    },
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
        jest: true,
      },
    },
    rules: {
      'react-native/no-inline-styles': 'off',
      'prettier/prettier': 'error',
    },
  },
];
