/* eslint-env jest */

import Lighthouse from '../index';

describe('Lighthouse index', () => {
  test('Default export', () => {
    expect(Lighthouse).toBeInstanceOf(Lighthouse.constructor);
  });
});
