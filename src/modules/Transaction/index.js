/* @flow */
/* eslint-disable class-methods-use-this */

import EventEmitter from 'eventemitter3';
import BigNumber from 'bn.js';
import type Lighthouse from '../../index';
import type {
  FunctionCall,
  TransactionData,
  Gas,
  Wei,
  SignedTransaction,
  TransactionReceipt,
} from '../../interface/Adapter';

export type TransactionState = {
  functionCall: FunctionCall,
  gas?: Gas,
  value?: Wei,
  signed?: SignedTransaction,
  receipt?: TransactionReceipt,
};

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

  async sign(): Promise<SignedTransaction> {
    throw new Error('Not yet implemented');
  }

  async send(): Promise<TransactionReceipt> {
    this.emit('transactionHash');
    this.emit('receipt');
    this.emit('confirmation');
    this.emit('error');
    throw new Error('Not yet implemented');
  }

  toJSON(): {} {
    throw new Error('Not yet implemented');
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
      BigNumber.isBn(gas) || typeof gas === 'number'
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
      BigNumber.isBn(value) || typeof value === 'number'
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
