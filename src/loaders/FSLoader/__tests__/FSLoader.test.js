/* eslint-env jest */
/* eslint-disable no-underscore-dangle,no-new */

import createSandbox from 'jest-sandbox';
import path from 'path';
import jsonfile from 'jsonfile';

import FSLoader from '../index';

jest.mock('path', () => ({
  resolve: jest.fn().mockReturnValue('contract json'),
}));

jest.mock('jsonfile', () => ({
  readFile: jest.fn().mockImplementation((file, callback) => {
    callback(null, 'contract data');
  }),
}));

describe('FSLoader', () => {
  const sandbox = createSandbox();

  const directory = '~/contracts';
  const contractName = 'MyContract';

  beforeEach(() => {
    sandbox.clear();
  });

  test('Instantiating an FSLoader', () => {
    expect(() => {
      new FSLoader();
    }).toThrow('A "directory" option must be provided');

    const loader = new FSLoader({ directory });
    expect(loader).toHaveProperty('_directory', directory);
    expect(loader).toBeInstanceOf(FSLoader);
  });

  test('Loading contract data', async () => {
    const loader = new FSLoader({ directory });

    try {
      await loader.load({ contractAddress: '0x123' });
      expect(false).toBe(true); // Should be unreachable
    } catch (error) {
      expect(error.toString()).toMatch(
        'A "contractName" property must be provided',
      );
    }

    const query = { contractName };
    const data = await loader.load(query);
    expect(path.resolve).toHaveBeenCalledWith(
      loader._directory,
      `${contractName}.json`,
    );
    expect(jsonfile.readFile).toHaveBeenCalledWith(
      'contract json',
      expect.any(Function),
    );
    expect(data).toEqual('contract data');
  });
});
