/* @flow */

import EventEmitter from 'eventemitter3';
import BigNumber from 'bn.js';
import type {
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

  _signed: ?SignedTransaction;

  _receipt: ?TransactionReceipt;

  constructor(lighthouse: *, state: TransactionState) {
    super();
    this._lh = lighthouse;
    this._functionCall = state.functionCall;
    this._data = this._lh.adapter.encodeFunctionCall(state.functionCall);
    this._value = state.value;
    this._gas = state.gas;
    this._gasPrice = state.gasPrice;
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
    return this._signed;
  }

  async send(): Promise<TransactionReceipt> {
    if (!this.signed) await this.sign();

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
      value: this.value,
    };
    if (this.signed) state.signed = this.signed;
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

    this._gas =
      BigNumber.isBN(gas) || typeof gas === 'number' || typeof gas === 'string'
        ? new BigNumber(gas)
        : null;
  }

  get gasPrice(): Promise<Wei> {
    return this._gas
      ? Promise.resolve(this._gas)
      : this._lh.adapter.getGasPrice();
  }

  // provide non-number for auto gas price
  set gasPrice(price: Wei | number | string) {
    if (this._signed)
      throw new Error('Cannot set gas price for already signed transaction');

    this._gas =
      BigNumber.isBN(price) ||
      typeof price === 'number' ||
      typeof price === 'string'
        ? new BigNumber(price)
        : null;
  }

  get value(): Wei {
    return this._value || 0;
  }

  // provide non-bn for auto gas
  set value(value: Wei | number) {
    if (this._signed)
      throw new Error('Cannot set value for already signed transaction');

    this._value =
      BigNumber.isBN(value) || typeof value === 'number'
        ? new BigNumber(value)
        : null;
  }

  get signed(): ?SignedTransaction {
    return this._signed || null;
  }

  get receipt(): ?TransactionReceipt {
    return this._receipt || null;
  }
}
