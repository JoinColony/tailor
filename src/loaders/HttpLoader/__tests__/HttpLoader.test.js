/* eslint-env jest */

import createSandbox from 'jest-sandbox';
import HttpLoader from '../index';

describe('HttpLoader', () => {
  const sandbox = createSandbox();

  const endpoint =
    '//endpoint?name=%%NAME%%&version=%%VERSION%%&address=%%ADDRESS%%';
  const contractName = 'MyContract';
  const contractAddress = '0x7da82c7ab4771ff031b66538d2fb9b0b047f6cf9';
  const version = 1;

  beforeEach(() => {
    sandbox.clear();
    fetch.resetMocks();
  });

  test('Instantiating an HttpLoader', () => {
    expect(() => {
      new HttpLoader();
    }).toThrow('An "endpoint" option must be provided');

    const loader = new HttpLoader({ endpoint });
    expect(loader).toHaveProperty('_endpoint', endpoint);
    expect(loader).toBeInstanceOf(HttpLoader);
  });

  test('Resolving an endpoint resource', () => {
    const loader = new HttpLoader({ endpoint });
    const resource = loader.resolveEndpointResource({
      contractAddress,
      contractName,
      version,
    });
    expect(resource).toBe(
      `//endpoint?name=${contractName}&version=${version}&address=${contractAddress}`, // eslint-disable-line max-len
    );
  });

  test('Loading contract data', async () => {
    const loader = new HttpLoader({ endpoint });

    sandbox.spyOn(loader, 'resolveEndpointResource');

    const query = { contractName };
    const contractResponse = {
      contractName,
      address: contractAddress,
      bytecode: '0xbytecode',
      abi: ['mock ABI'],
    };

    fetch.once(JSON.stringify(contractResponse));

    const data = await loader.load(query);
    expect(data).toEqual(contractResponse);
    expect(loader.resolveEndpointResource).toHaveBeenCalledWith(query);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining(contractName));
  });

  test('Loading contract data: failure to fetch resource', async () => {
    const loader = new HttpLoader({ endpoint });

    const query = { contractName };

    fetch.mockRejectOnce(new Error('Boom!'));

    try {
      await loader.load(query);
      expect(false).toBe(true); // should be unreachable
    } catch (error) {
      expect(error.toString()).toMatch(
        'Unable to fetch resource for contract MyContract',
      );
    }
  });

  test('Loading contract data: failure to get JSON', async () => {
    const loader = new HttpLoader({ endpoint });

    const query = { contractName };

    fetch.once('not valid json');

    try {
      await loader.load(query);
      expect(false).toBe(true); // should be unreachable
    } catch (error) {
      expect(error.toString()).toMatch(
        'Unable to get JSON for contract MyContract: invalid json response',
      );
    }
  });
});
