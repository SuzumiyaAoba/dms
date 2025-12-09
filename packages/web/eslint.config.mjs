// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import nextPlugin from '@next/eslint-plugin-next';
import tsParser from '@typescript-eslint/parser';

export default [{
  ignores: ['.next/', 'node_modules/', 'out/', 'public/'],
}, {
  files: ['**/*.{js,jsx,ts,tsx}'],
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
  plugins: {
    '@next/next': nextPlugin,
  },
  rules: {
    ...nextPlugin.configs.recommended.rules,
    ...nextPlugin.configs['core-web-vitals'].rules,
  },
}, ...storybook.configs["flat/recommended"]];
