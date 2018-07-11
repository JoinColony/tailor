/* eslint-env jest */

import createSandbox from 'jest-sandbox';
import Lighthouse from '../index';

describe('Lighthouse', () => {
  const sandbox = createSandbox();

  beforeEach(() => {
    sandbox.clear();
  });

  const mockLoader = {
    load: sandbox.fn(),
  };

  test('Instantiating a Lighthouse', () => {
    const lh = new Lighthouse({
      loader: mockLoader,
    });
    expect(lh).toBeInstanceOf(Lighthouse);
  })
});
