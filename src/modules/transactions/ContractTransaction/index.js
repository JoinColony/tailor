/* @flow */

import type { TransactionReceipt, TransactionState } from '../flowtypes';
import Transaction from '../Transaction';
// eslint-disable-next-line import/no-cycle
import type Lighthouse from '../../../Lighthouse';

export default class ContractTransaction extends Transaction {
  _lh: Lighthouse;

  _state: TransactionState;

  constructor(
    lh: Lighthouse,
    {
      functionCall,
      data = lh.adapter.encodeFunctionCall(functionCall),
      to = lh.contractAddress,
      events = [],
      ...state
    }: Object,
  ) {
    super(lh.adapter, { functionCall, data, to, events, ...state });

    if (to && to.toLowerCase() !== lh.contractAddress.toLowerCase())
      throw new Error('"to" address does not match contract address');

    this._lh = lh;
  }

  get events() {
    return this._state.events;
  }

  get functionCall() {
    return this._state.functionCall;
  }

  _handleReceiptEvents(receipt: TransactionReceipt) {
    return Object.keys(receipt.events || {}).reduce((acc, eventName) => {
      const eventCls = this._lh.events[eventName];
      receipt.events[eventName].forEach(rawEvent => {
        acc.push(eventCls.handleEvent(rawEvent));
      });
      return acc;
    }, []);
  }

  _handleReceipt(receipt: TransactionReceipt) {
    this._state.receipt = receipt;
    this._state.events = this._handleReceiptEvents(receipt);
    this.emit('receipt', receipt);
  }

  toJSON() {
    const state: TransactionState = {
      confirmations: this.confirmations,
      createdAt: this.createdAt,
      data: this.data,
      events: this.events,
      from: this.from,
      functionCall: this.functionCall,
      to: this.to,
      value: this.value.toString(),
    };

    if (this.confirmedAt) state.confirmedAt = this.confirmedAt;
    if (this.gas) state.gas = this.gas.toString();
    if (this.gasPrice) state.gasPrice = this.gasPrice.toString();
    if (this.hash) state.hash = this.hash;
    if (this.chainId) state.chainId = this.chainId;
    if (this.receipt) state.receipt = this.receipt;
    if (this.sentAt) state.sentAt = this.sentAt;

    return JSON.stringify(state);
  }
}
