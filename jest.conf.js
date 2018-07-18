/* eslint-disable flowtype/require-valid-file-annotation */

module.exports = {
  rootDir: 'src',
  collectCoverageFrom: ['*.{js}', '**/*.{js}'],
  coverageDirectory: '../coverage',
  coverageThreshold: {
    global: {
      branches: 0,
    },
  },
  setupFiles: ['../scripts/setup-jest.js'],
};
