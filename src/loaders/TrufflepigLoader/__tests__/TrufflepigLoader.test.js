/* eslint-env jest */
/* eslint-disable no-new,no-underscore-dangle */

import createSandbox from 'jest-sandbox';
import TrufflepigLoader from '../index';
import HttpLoader from '../../HttpLoader';

describe('TrufflepigLoader', () => {
  const sandbox = createSandbox();

  beforeEach(() => {
    sandbox.clear();
  });

  test('Instantiating a TrufflepigLoader', () => {
    expect(() => {
      new TrufflepigLoader({ endpoint: '' });
    }).toThrow('An "endpoint" option must be provided');

    const loader = new TrufflepigLoader();
    expect(loader).toHaveProperty('_endpoint');
    expect(loader).toBeInstanceOf(HttpLoader);
  });

  test('Loading contract data', async () => {
    const loader = new TrufflepigLoader();
    sandbox.spyOn(loader, '_transform');

    const contractName = 'TruffleContract';
    const query = { contractName, network: 'my selected network' };

    const correctAddress = '0x7da82c7ab4771ff031b66538d2fb9b0b047f6cf9';
    const wrongAddress = '0x12d508fa65654654ffdb334a3023353587112e09';

    const contractResponse = {
      contractName,
      networks: {
        'my selected network': {
          address: correctAddress,
        },
        'another network': {
          address: wrongAddress,
        },
      },
      bytecode: '0xbytecode',
      abi: ['mock ABI'],
    };

    fetch.once(JSON.stringify(contractResponse));

    const data = await loader.load(query);
    expect(data).toEqual({
      abi: contractResponse.abi,
      address: correctAddress,
      bytecode: contractResponse.bytecode,
    });
    expect(loader._transform).toHaveBeenCalledWith(contractResponse, query);
  });
});
