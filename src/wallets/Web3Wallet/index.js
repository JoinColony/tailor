/* @flow */

import Wallet from '../Wallet';

import type { Address } from '../../interface/flowtypes';

type Web3WalletOptions = *;

const notSupportedError = methodName => {
  throw new Error(`Web3Wallet does not support the "${methodName}" method`);
};

export default class Web3Wallet extends Wallet {
  _web3: Object;

  _otherAddresses: Array<Address>;

  _defaultGasLimit: ?number;

  _defaultAddress: number;

  static get name() {
    return 'web3';
  }

  static async open(walletOptions: Web3WalletOptions = {}): Promise<this> {
    if (!walletOptions.web3)
      throw new Error('A Web3 instance is required for Web3Wallet');

    const otherAddresses = await walletOptions.web3.eth.getAccounts();

    return new this({ ...walletOptions, otherAddresses });
  }

  constructor({
    web3,
    otherAddresses,
    defaultGasLimit,
    defaultAddress,
  }: {
    web3: *,
    otherAddresses: Array<Address>,
    defaultGasLimit?: number,
    defaultAddress?: number,
  }) {
    super();
    this._web3 = web3;
    this._otherAddresses = otherAddresses;
    this._defaultGasLimit = defaultGasLimit;
    this._defaultAddress = defaultAddress || 0;
  }

  get address() {
    return this._otherAddresses[this._defaultAddress];
  }

  get otherAddresses() {
    return this._otherAddresses;
  }

  get defaultGasLimit() {
    return this._defaultGasLimit;
  }

  async setDefaultAddress(addressIndex: number) {
    if (addressIndex >= 0 && addressIndex < this._otherAddresses.length) {
      this._defaultAddress = addressIndex;
      return true;
    }
    return false;
  }

  async sign(transactionObject: {}): Promise<string> {
    const tx = Object.assign(
      {},
      { from: this.address, gas: this._defaultGasLimit },
      transactionObject,
    );
    const signedTx = await this._web3.eth.signTransaction(tx);
    return signedTx.raw;
  }

  async signMessage(messageObject: *) {
    return this._web3.eth.sign(messageObject.message, this.address);
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

  verifyMessage(verificationObject: *) {
    return notSupportedError('verifyMessage');
  }
  /* eslint-enable no-unused-vars,class-methods-use-this */
}
