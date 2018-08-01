/* eslint-env jest */
/* eslint-disable no-underscore-dangle */

import createSandbox from 'jest-sandbox';
import Web3 from 'web3';

import Web3Wallet from '../index';

jest.mock('web3', () => () => ({
  eth: {
    getAccounts: jest.fn(),
    signTransaction: jest.fn(),
    sign: jest.fn(),
    personal: {
      ecRecover: jest.fn(),
    },
  },
}));

describe('Web3Wallet', () => {
  const sandbox = createSandbox();

  beforeEach(() => {
    sandbox.clear();
  });

  test('provides a name', () => {
    expect(Web3Wallet.name).toEqual('web3');
  });

  test('open', async () => {
    const otherAddresses = ['address 1', 'address 2'];
    const web3 = new Web3();

    web3.eth.getAccounts.mockResolvedValue(otherAddresses);

    const wallet = await Web3Wallet.open({ web3 });

    expect(web3.eth.getAccounts).toHaveBeenCalled();
    expect(wallet).toHaveProperty('_web3', web3);
    expect(wallet).toHaveProperty('_otherAddresses', otherAddresses);
    expect(wallet).toHaveProperty('_defaultAddress', 0);

    // without web3
    await expect(Web3Wallet.open()).rejects.toThrow(
      'Web3 instance is required',
    );
  });

  test('constructor', () => {
    const otherAddresses = ['address 1', 'address 2'];
    const web3 = new Web3();
    const wallet = new Web3Wallet({ web3, otherAddresses });

    expect(wallet).toHaveProperty('_web3', web3);
    expect(wallet).toHaveProperty('_otherAddresses', otherAddresses);
    expect(wallet).toHaveProperty('_defaultAddress', 0);
  });

  test('get address', () => {
    const otherAddresses = ['address 1', 'address 2'];
    const web3 = new Web3();
    const wallet = new Web3Wallet({ web3, otherAddresses });

    expect(wallet.address).toEqual(otherAddresses[0]);

    const newDefault = 1;
    wallet._defaultAddress = newDefault;
    expect(wallet.address).toEqual(otherAddresses[1]);
  });

  test('get otherAddresses', () => {
    const otherAddresses = ['address 1', 'address 2'];
    const web3 = new Web3();

    const wallet = new Web3Wallet({ web3, otherAddresses });

    expect(wallet.otherAddresses).toEqual(otherAddresses);
  });

  test('setDefaultAddress', async () => {
    const otherAddresses = ['address 1', 'address 2'];
    const web3 = new Web3();
    const wallet = new Web3Wallet({ web3, otherAddresses });

    // valid new index
    expect(await wallet.setDefaultAddress(1)).toBe(true);
    expect(wallet._defaultAddress).toBe(1);

    // negative index
    expect(await wallet.setDefaultAddress(-1)).toBe(false);
    expect(wallet._defaultAddress).toBe(1);

    // too big index
    expect(await wallet.setDefaultAddress(20)).toBe(false);
    expect(wallet._defaultAddress).toBe(1);
  });

  test('sign', async () => {
    const otherAddresses = ['address 1', 'address 2'];
    const tx = {
      to: '0x123',
    };
    const raw = 'raw signed tx';
    const web3 = new Web3();
    const wallet = new Web3Wallet({ web3, otherAddresses });

    web3.eth.signTransaction.mockResolvedValue({ raw });

    const signed = await wallet.sign(tx);

    expect(signed).toBe(raw);
    expect(web3.eth.signTransaction).toHaveBeenCalledWith({
      to: tx.to,
      from: otherAddresses[0],
    });
  });

  test('signMessage', async () => {
    const otherAddresses = ['address 1', 'address 2'];
    const message = 'message to sign';
    const signedMessage = 'signed message';
    const web3 = new Web3();
    const wallet = new Web3Wallet({ web3, otherAddresses });

    web3.eth.sign.mockResolvedValue(signedMessage);

    const signed = await wallet.signMessage({ message });

    expect(signed).toBe(signedMessage);
    expect(web3.eth.sign).toHaveBeenCalledWith(message, otherAddresses[0]);
  });

  test('verifyMessage', async () => {
    const otherAddresses = ['address 1', 'address 2'];
    const toVerify = { message: 'to verify', signature: 'sig' };
    const web3 = new Web3();
    const wallet = new Web3Wallet({ web3, otherAddresses });

    web3.eth.personal.ecRecover
      .mockResolvedValueOnce('address 1')
      .mockResolvedValueOnce('address 3');

    const match1 = await wallet.verifyMessage(toVerify);
    expect(match1).toBe(true);

    const match2 = await wallet.verifyMessage(toVerify);
    expect(match2).toBe(false);
  });

  test('unsupported methods throw', async () => {
    const wallet = new Web3Wallet();

    expect(() => wallet.keystore).toThrow('get keystore');
    expect(() => {
      wallet.keystore = 'password';
    }).toThrow('set keystore');
    expect(() => wallet.privateKey).toThrow('get privateKey');
    expect(() => wallet.publicKey).toThrow('get publicKey');
  });
});
