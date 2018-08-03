/* @flow */

import Wallet from '../Wallet';

import type { Address } from '../../interface/flowtypes';
import type { Web3, Web3WalletOptions } from './flowtypes';

const notSupportedError = methodName => {
  throw new Error(`Web3Wallet does not support the "${methodName}" method`);
};

export default class Web3Wallet extends Wallet {
  _web3: Web3;

  _otherAddresses: Array<Address>;

  _defaultAddress: number;

  static get name() {
    return 'web3';
  }

  static async open(walletOptions: Web3WalletOptions = {}): Promise<this> {
    if (!walletOptions.web3)
      throw new Error('A Web3 instance is required for Web3Wallet');

    const otherAddresses: Array<
      Address,
    > = await walletOptions.web3.eth.getAccounts();

    return new this({ ...walletOptions, otherAddresses });
  }

  constructor({
    web3,
    otherAddresses,
  }: {
    web3: Web3,
    otherAddresses: Array<Address>,
  } = {}) {
    super();
    this._web3 = web3;
    this._otherAddresses = otherAddresses;
    this._defaultAddress = 0;
  }

  get address() {
    return this._otherAddresses[this._defaultAddress];
  }

  get otherAddresses() {
    return this._otherAddresses;
  }

  async setDefaultAddress(addressIndex: number) {
    if (addressIndex >= 0 && addressIndex < this._otherAddresses.length) {
      this._defaultAddress = addressIndex;
      return true;
    }
    return false;
  }

  async sign(transactionObject: {}) {
    const tx = Object.assign({}, { from: this.address }, transactionObject);
    const { raw }: { raw: string } = await this._web3.eth.signTransaction(tx);
    return raw;
  }

  async signMessage(messageObject: *) {
    return this._web3.eth.sign(messageObject.message, this.address);
  }

  async verifyMessage({
    message,
    signature,
  }: {
    message: string,
    signature: string,
  }) {
    const addr: string = await this._web3.eth.personal.ecRecover(
      message,
      signature,
    );
    return addr.toLowerCase() === this.address.toLowerCase();
  }

  /* unsupported methods */
  /* eslint-disable no-unused-vars,class-methods-use-this */
  get keystore() {
    return notSupportedError('get keystore');
  }

  set keystore(password: *) {
    return notSupportedError('set keystore');
  }

  get privateKey() {
    return notSupportedError('get privateKey');
  }

  get publicKey() {
    return notSupportedError('get publicKey');
  }
  /* eslint-enable no-unused-vars,class-methods-use-this */
}
