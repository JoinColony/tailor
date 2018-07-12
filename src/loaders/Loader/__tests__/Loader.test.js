/* eslint-env jest */
/* eslint-disable no-underscore-dangle,no-new */

import createSandbox from 'jest-sandbox';
import Loader from '../index';

describe('Loader', () => {
  const sandbox = createSandbox();

  beforeEach(() => {
    sandbox.clear();
  });

  test('Instantiating a Loader', () => {
    expect(() => {
      new Loader({ transform: null });
    }).toThrowError('A "transform" option must be provided');

    const loader = new Loader();
    expect(loader).toBeInstanceOf(Loader);
    expect(loader).toHaveProperty('_transform', expect.any(Function));
  });

  test('Transforming contract data', () => {
    const transform = sandbox.fn().mockImplementation(input => input + 1);
    const query = { contractName: 'MyContract' };
    const loader = new Loader({ transform });
    expect(loader.transform(1, query)).toEqual(2);
    expect(loader._transform).toHaveBeenCalledWith(1, query);
  });

  test('Loading contract data', async () => {
    const loader = new Loader();
    try {
      await loader.load({ contractName: 'MyContract' });
      expect(false).toBe(true); // Should be unreachable
    } catch (error) {
      expect(error.toString()).toMatch(
        'Expected "load()" to be defined in a derived class',
      );
    }
  });
});
