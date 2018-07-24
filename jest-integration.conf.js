/* eslint-disable flowtype/require-valid-file-annotation */

module.exports = {
  testMatch: ['**/?(*.)(spec|test).js?(x)'],
  rootDir: 'integration-testing',
  globalSetup: './utils/integration-testing-setup.js',
  globalTeardown: './utils/integration-testing-teardown.js',
  setupFiles: ['./utils/setup-accounts-global.js'],
  testPathIgnorePatterns: ['utils'],
  testEnvironment: 'node',
};
