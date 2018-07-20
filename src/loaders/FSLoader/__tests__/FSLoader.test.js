/* eslint-env jest */
/* eslint-disable no-underscore-dangle,no-new,import/no-extraneous-dependencies */

import createSandbox from 'jest-sandbox';
import path from 'path';
import jsonfile from 'jsonfile';

import FSLoader from '../index';

jest.mock('path', () => ({
  resolve: jest.fn().mockReturnValue('contract json'),
}));

jest.mock('jsonfile', () => ({
  readFile: jest
    .fn()
    .mockImplementationOnce((file, callback) => {
      callback(null, 'contract data');
    })
    .mockImplementationOnce((file, callback) => {
      callback(new Error('jsonfile error'));
    }),
}));

describe('FSLoader', () => {
  const sandbox = createSandbox();

  const directory = '~/contracts';
  const contractName = 'MyContract';

  beforeEach(() => {
    sandbox.clear();
  });

  test('It should provide a name', () => {
    expect(FSLoader.name).toEqual('fs');
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
      await loader.loadContractData({ contractAddress: '0x123' });
      expect(false).toBe(true); // Should be unreachable
    } catch (error) {
      expect(error.toString()).toMatch(
        'A "contractName" property must be provided',
      );
    }

    const query = { contractName };
    const data = await loader.loadContractData(query);
    expect(path.resolve).toHaveBeenCalledWith(
      loader._directory,
      `${contractName}.json`,
    );
    expect(jsonfile.readFile).toHaveBeenCalledWith(
      'contract json',
      expect.any(Function),
    );
    expect(data).toEqual('contract data');

    try {
      await loader.loadContractData(query);
      expect(false).toBe(true); // unreachable
    } catch (error) {
      expect(error.toString()).toMatch('jsonfile error');
    }
  });
});
