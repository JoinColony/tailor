/* eslint-env jest */

import Tailor from '../index';

describe('Tailor index', () => {
  test('Default export', () => {
    expect(Tailor).toBeInstanceOf(Tailor.constructor);
  });
});
