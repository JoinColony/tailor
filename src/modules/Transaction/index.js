/* @flow */

import EventEmitter from 'eventemitter3';
import BigNumber from 'bn.js';
import type Lighthouse from '../../index';
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
  _lh: Lighthouse;

  _functionCall: FunctionCall;

  _data: TransactionData;

  _gas: ?Gas;

  _value: Wei;

  _signed: ?SignedTransaction;

  _receipt: ?TransactionReceipt;

  constructor(lighthouse: Lighthouse, state: TransactionState) {
    super();
    this._lh = lighthouse;
    this._functionCall = state.functionCall;
    this._data = this._lh.adapter.encodeFunctionCall(state.functionCall);
    this._value = state.value;
    this._gas = state.gas;
  }

  async estimate(): Promise<Gas> {
    return this._lh.adapter.estimate({
      from: 'todo', // TODO: get address from wallet
      to: 'todo', // TODO: get contract address from lh
      data: this._data,
      gas: this._gas || (await this._lh.adapter.getGasPrice()),
      value: this._value || 0,
    });
  }

  // eslint-disable-next-line class-methods-use-this
  async sign(): Promise<SignedTransaction> {
    // TODO implement sign()
    throw new Error('Not yet implemented');
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
      functionCall: this._functionCall,
      gas: this._gas,
      value: this._value,
      signed: this._signed || undefined,
      receipt: this._receipt || undefined,
    };
    Object.keys(state).forEach(
      key => state[key] === undefined && delete state[key],
    );
    return state;
  }

  get functionCall(): FunctionCall {
    return this._functionCall;
  }

  get gas(): Gas {
    return this._gas || null;
  }

  // provide non-bn for auto gas
  set gas(gas: Gas | number) {
    if (this._signed)
      throw new Error('Cannot set gas for already signed transaction');

    this._gas =
      BigNumber.isBN(gas) || typeof gas === 'number'
        ? new BigNumber(gas)
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
