/* eslint-env jest */
/* eslint-disable no-new */

jest.mock('jsonfile', () => {
  throw new Error('Not installed!');
});

describe('FSLoader without jsonfile', () => {
  test('Requiring FSLoader', () => {
    expect(() => {
      require('../index');
    }).toThrowError('FSLoader requires "jsonfile" as a dependency');
  });
});
