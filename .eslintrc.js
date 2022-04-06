'use strict';

module.exports = {
  env: {
    es6: true,
    browser: true,
    node: true
  },
  parserOptions: {
    ecmaVersion: 2018
  },
  extends: ['eslint:recommended', 'plugin:jest/recommended', 'emarsys'],
  rules: {
    'curly': ['error', 'multi-line']
  },
  overrides: [
    {
      files: ['*.spec.js'],
      env: {
        jest: true
      }
    }
  ]
};
