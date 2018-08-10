/* @flow */
/* eslint-disable no-unused-vars,class-methods-use-this */

import { IWallet } from '../../interface/Wallet';

const notDefinedError = methodName => {
  throw new Error(`Expected "${methodName}" to be defined in a derived class`);
};

export default class Wallet implements IWallet {
  static get name() {
    return 'wallet';
  }

  static async open(walletArguments: *) {
    return notDefinedError('open');
  }

  get address() {
    return notDefinedError('get address');
  }

  get keystore() {
    return notDefinedError('get keystore');
  }

  set keystore(password: *) {
    return notDefinedError('set keystore');
  }

  get privateKey() {
    return notDefinedError('get privateKey');
  }

  get publicKey() {
    return notDefinedError('get publicKey');
  }

  setDefaultAddress(addressIndex: *) {
    return notDefinedError('setDefaultAddress');
  }

  sign(transactionObject: *) {
    return notDefinedError('sign');
  }

  signMessage(messageObject: *) {
    return notDefinedError('signMessage');
  }

  verifyMessage(verificationObject: *) {
    return notDefinedError('verifyMessage');
  }
}
