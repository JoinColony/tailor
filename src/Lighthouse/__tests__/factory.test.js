/* eslint-env jest */

import createSandbox from 'jest-sandbox';
import Web3 from 'web3';

import Web3Adapter from '../../adapters/Web3Adapter';
import TruffleLoader from '../../loaders/TruffleLoader';
import TruffleParser from '../../parsers/TruffleParser';
import Web3Wallet from '../../wallets/Web3Wallet';

import { getAdapter, getLoader, getParser, getWallet } from '../factory';

jest.mock('web3', () => () => ({
  eth: {
    getAccounts: jest.fn(),
  },
}));

describe('Lighthouse factory', () => {
  const sandbox = createSandbox();

  beforeEach(() => {
    sandbox.clear();
  });

  test('Getting an adapter', async () => {
    expect(() => getAdapter(null)).toThrow('Expected an adapter');
    expect(() => getAdapter({ name: undefined })).toThrow('not found');
    expect(() => getAdapter('schmadapter')).toThrow('not found');

    const web3 = new Web3();
    const adapterInstance = new Web3Adapter({ web3 });
    const wallet = new Web3Wallet({ web3 });

    const withName = getAdapter('web3');
    expect(withName).toBeInstanceOf(Web3Adapter);

    const withSpec = getAdapter(
      {
        name: 'web3',
        options: { web3 },
      },
      wallet,
    );
    expect(withSpec).toBeInstanceOf(Web3Adapter);
    expect(withSpec).toHaveProperty('wallet', wallet);
    expect(withSpec).toHaveProperty('_web3', web3);
    // TODO: check constructor arguments, see below about "ideal world"

    const withInstance = getAdapter(adapterInstance);
    expect(withInstance).toBe(adapterInstance);

    const noArgs = getAdapter();
    expect(noArgs).toBeInstanceOf(Web3Adapter);
  });

  test('Getting a loader', () => {
    expect(() => getLoader(null)).toThrow('Expected a loader');
    expect(() => getLoader({ name: undefined })).toThrow('not found');
    expect(() => getLoader('schmloader')).toThrow('not found');

    const directory = 'custom directory';
    const loaderInstance = new TruffleLoader({ directory });

    const withName = getLoader('truffle');
    expect(withName).toBeInstanceOf(TruffleLoader);

    const withSpec = getLoader({
      name: 'truffle',
      options: { directory },
    });
    expect(withSpec).toBeInstanceOf(TruffleLoader);
    // In an ideal world, we would test which args the mocked constructor
    // was called with, but we also need to check `instanceof`, so
    // let's just check a property of the loader we created.
    expect(withSpec).toHaveProperty('_directory', directory);

    const withInstance = getLoader(loaderInstance);
    expect(withInstance).toBe(loaderInstance);

    const noArgs = getLoader();
    expect(noArgs).toBeInstanceOf(TruffleLoader);
  });

  test('Getting a parser', () => {
    expect(() => getParser(null)).toThrow('Expected a parser');
    expect(() => getParser({ name: undefined })).toThrow('not found');
    expect(() => getParser('schmparser')).toThrow('not found');

    const parserInstance = new TruffleParser();

    const withName = getParser('truffle');
    expect(withName).toBeInstanceOf(TruffleParser);

    const withSpec = getParser({
      name: 'truffle',
    });
    expect(withSpec).toBeInstanceOf(TruffleParser);

    const withInstance = getParser(parserInstance);
    expect(withInstance).toBe(parserInstance);

    const noArgs = getParser();
    expect(noArgs).toBeInstanceOf(TruffleParser);
  });

  test('Getting a wallet', async () => {
    await expect(getWallet(null)).rejects.toThrow('Expected a wallet');
    await expect(getWallet({ name: undefined })).rejects.toThrow('not found');
    await expect(getWallet('imaginarywallet')).rejects.toThrow('not found');

    const web3 = new Web3();
    const walletInstance = new Web3Wallet({ web3 });

    await expect(getWallet('web3')).rejects.toThrow(
      'Web3 instance is required',
    );

    const withSpec = await getWallet({
      name: 'web3',
      options: { web3 },
    });
    expect(withSpec).toBeInstanceOf(Web3Wallet);
    // TODO: check constructor arguments, see above about "ideal world"

    const withInstance = await getWallet(walletInstance);
    expect(withInstance).toBe(walletInstance);

    await expect(getWallet()).rejects.toThrow('Web3 instance is required');
  });
});
