module.exports = {
  root: true,
  extends: 'airbnb-base',
  settings: {
    'import/resolver': {
      alias: {
        map: [
          ['@helper', './scripts/helpers'],
        ],
        extensions: ['.js'],
      },
    },
  },
  env: {
    browser: true,
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    allowImportExportEverywhere: true,
    sourceType: 'module',
    requireConfigFile: false,
  },
  rules: {
    'import/extensions': ['error', { js: 'always' }], // require js file extensions in imports
    'linebreak-style': ['error', 'unix'], // enforce unix linebreaks
    'no-console': ['warn', { allow: ['warn', 'error'] }], // warn on console usage except warn/error
    'no-param-reassign': [2, { props: false }], // allow modifying properties of param
  },
};
