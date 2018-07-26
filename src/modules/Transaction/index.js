/* @flow */
/* eslint-disable class-methods-use-this */

import type PromiEvent from 'web3-core-promievent';

import type Lighthouse from '../../index';
import type {
  FunctionCall,
  Gas,
  SignedTransaction,
  TransactionReceipt,
} from '../../interface/Adapter';

type TransactionState = FunctionCall & {
  receipt?: TransactionReceipt,
  signedTransaction?: SignedTransaction,
};

export default class Transaction {
  _lh: Lighthouse;

  _state: TransactionState;

  static fromJSON(): Transaction {
    throw new Error('Not yet implemented');
  }

  constructor(lighthouse: Lighthouse, functionCall: FunctionCall) {
    this._lh = lighthouse;
    this._state = Object.assign({}, functionCall);
  }

  get state(): TransactionState {
    return this._state;
  }

  toJSON(): string {
    throw new Error('Not yet implemented');
  }

  async estimate(): Promise<Gas> {
    throw new Error('Not yet implemented');
  }

  async sign(): Promise<SignedTransaction> {
    throw new Error('Not yet implemented');
  }

  send(): PromiEvent<TransactionReceipt> {
    throw new Error('Not yet implemented');
  }

  getReceipt(): TransactionReceipt {
    if (!this._state.receipt)
      throw new Error('No receipt available for this transaction');

    return this._state.receipt;
  }
}
