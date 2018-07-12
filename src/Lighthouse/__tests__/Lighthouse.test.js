/* eslint-env jest */

import createSandbox from 'jest-sandbox';
import Lighthouse from '../index';
import LoaderEngine from '../../LoaderEngine';

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
    expect(lh).toHaveProperty('loader', expect.any(LoaderEngine));
    expect(lh.loader).toHaveProperty(
      '_loader',
      expect.objectContaining({ load: expect.any(Function) }),
    );
  });
});
