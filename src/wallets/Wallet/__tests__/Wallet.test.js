/* eslint-env jest */

import Wallet from '../index';

describe('Wallet', () => {
  test('provides a name', () => {
    expect(Wallet.name).toEqual('wallet');
  });

  test('has no implemented methods', async () => {
    const wallet = new Wallet();
    await expect(Wallet.open()).rejects.toThrow('open');
    expect(() => wallet.address).toThrow('get address');
    expect(() => wallet.keystore).toThrow('get keystore');
    expect(() => {
      wallet.keystore = 'password';
    }).toThrow('set keystore');
    expect(() => wallet.privateKey).toThrow('get privateKey');
    expect(() => wallet.publicKey).toThrow('get publicKey');
    expect(() => wallet.setDefaultAddress()).toThrow('setDefaultAddress');
    expect(() => wallet.sign()).toThrow('sign');
    expect(() => wallet.signMessage()).toThrow('signMessage');
    expect(() => wallet.verifyMessage()).toThrow('verifyMessage');
  });
});
