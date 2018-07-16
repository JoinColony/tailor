/* eslint-env jest */

import createSandbox from 'jest-sandbox';
import Lighthouse from '../index';
import Loader from '../../loaders/Loader';

jest.mock('../../loaders/Loader');

describe('Lighthouse', () => {
  const sandbox = createSandbox();

  beforeEach(() => {
    sandbox.clear();
  });

  test('Instantiating a Lighthouse', () => {
    const lh = new Lighthouse({
      loader: new Loader(),
    });
    expect(lh).toBeInstanceOf(Lighthouse);
    expect(lh).toHaveProperty('loader', expect.any(Loader));
  });
});
