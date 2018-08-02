/* @flow */

import EventEmitter from 'eventemitter3';
import BigNumber from 'bn.js';
import type {
  Address,
  FunctionCall,
  Gas,
  SignedTransaction,
  TransactionData,
  TransactionReceipt,
  TransactionState,
  Wei,
} from './flowtypes';

export default class Transaction extends EventEmitter {
  _lh: *;

  _functionCall: FunctionCall;

  _data: TransactionData;

  _gas: ?Gas;

  _gasPrice: ?Wei;

  _value: Wei;

  // TODO eventually: change SignedTransaction to object, thus removing
  // the need to seperately store the `from` address when signed.
  _from: ?Address;

  _signed: ?SignedTransaction;

  _receipt: ?TransactionReceipt;

  constructor(lh: *, state: TransactionState) {
    super();

    if (state.to && state.to.toLowerCase() !== lh.contractAddress.toLowerCase())
      throw new Error(
        'State "to" address does not match Lighthouse "contractAddress',
      );

    this._lh = lh;
    this._from = state.from;
    this._functionCall = state.functionCall;
    this._data = this._lh.adapter.encodeFunctionCall(state.functionCall);
    this.value = state.value;
    this.gas = state.gas;
    this.gasPrice = state.gasPrice;
  }

  async estimate(): Promise<Gas> {
    return this._lh.adapter.estimate({
      from: this._lh.wallet.address,
      to: this._lh.contractAddress,
      data: this._data,
      value: this.value,
    });
  }

  async sign(): Promise<SignedTransaction> {
    this._signed = await this._lh.wallet.sign({
      from: this._lh.wallet.address,
      to: this._lh.contractAddress,
      data: this._data,
      gas: this.gas,
      gasPrice: await this.gasPrice,
      value: this.value,
    });
    this._from = this._lh.wallet.address;
    return this._signed;
  }

  async send(): Promise<TransactionReceipt> {
    // if not signed or signed with different wallet, sign it again!
    if (
      !this.signed ||
      (this._from &&
        this._from.toLowerCase() !== this._lh.wallet.address.toLowerCase())
    )
      await this.sign();

    return new Promise((resolve, reject) => {
      // XXX in practise, `this._signed` is always set at this point, but
      // Flow doesn't know that.
      if (this.signed) {
        this._lh.adapter
          .sendSignedTransaction(this.signed)
          .on('transactionHash', hash => this.emit('transactionHash', hash))
          .on('receipt', receipt => this.emit('receipt', receipt))
          .on('confirmation', (confirmationNumber, receipt) =>
            this.emit('confirmation', confirmationNumber, receipt),
          )
          .on('error', error => this.emit('error', error))
          .catch(reject)
          .then(resolve);
      } else {
        reject(new Error('Cannot send an unsigned transaction'));
      }
    });
  }

  toJSON(): TransactionState {
    const state: TransactionState = {
      functionCall: this.functionCall,
      gas: this.gas,
      to: this._lh.contractAddress,
      value: this.value,
    };
    if (this.signed && this._from) {
      state.from = this._from;
      state.signed = this.signed;
    }
    if (this.receipt) state.receipt = this.receipt;
    return state;
  }

  get functionCall(): FunctionCall {
    return this._functionCall;
  }

  get gas(): Gas {
    return this._gas || null;
  }

  // provide non-number for auto gas
  set gas(gas: Gas | number | string) {
    if (this._signed)
      throw new Error('Cannot set gas for already signed transaction');

    const bn =
      BigNumber.isBN(gas) || typeof gas === 'number' || typeof gas === 'string'
        ? new BigNumber(gas)
        : null;

    this._gas = BigNumber.isBN(bn) ? bn : null;
  }

  get gasPrice(): Promise<Wei> {
    return this._gasPrice
      ? Promise.resolve(this._gasPrice)
      : this._lh.adapter.getGasPrice();
  }

  // provide non-number for auto gas price
  set gasPrice(price: Wei | number | string) {
    if (this._signed)
      throw new Error('Cannot set gas price for already signed transaction');

    const bn =
      BigNumber.isBN(price) ||
      typeof price === 'number' ||
      typeof price === 'string'
        ? new BigNumber(price)
        : null;

    this._gasPrice = BigNumber.isBN(bn) ? bn : null;
  }

  get value(): Wei {
    return this._value || 0;
  }

  // provide non-bn for auto gas
  set value(value: Wei | number | string) {
    if (this._signed)
      throw new Error('Cannot set value for already signed transaction');

    const bn =
      BigNumber.isBN(value) ||
      typeof value === 'number' ||
      typeof value === 'string'
        ? new BigNumber(value)
        : null;

    this._value = BigNumber.isBN(bn) ? bn : null;
  }

  get signed(): ?SignedTransaction {
    return this._signed || null;
  }

  get receipt(): ?TransactionReceipt {
    return this._receipt || null;
  }
}
