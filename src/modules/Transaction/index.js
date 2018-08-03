/* @flow */

import EventEmitter from 'eventemitter3';
import type { Gas, TransactionReceipt, TransactionState } from './flowtypes';
import { parseBigNumber } from '../utils';

// eslint-disable-next-line import/no-cycle
import type Lighthouse from '../../Lighthouse';
import type {
  TypedEvents,
  UnsignedTransaction,
} from '../../interface/flowtypes';

export default class Transaction extends EventEmitter {
  _lh: Lighthouse;

  _state: TransactionState;

  constructor(
    lh: Lighthouse,
    {
      functionCall,
      data = lh.adapter.encodeFunctionCall(functionCall),
      from = lh.adapter.wallet.address,
      to = lh.contractAddress,
      confirmations = [],
      createdAt = new Date(),
      events = {},
      gas,
      gasPrice,
      nonce,
      value,
      ...state
    }: Object,
  ) {
    super();

    if (to && to.toLowerCase() !== lh.contractAddress.toLowerCase())
      throw new Error('"to" address does not match contract address');

    this._lh = lh;
    this._state = Object.assign(
      {},
      {
        confirmations,
        createdAt,
        data,
        events,
        from,
        functionCall,
        to,
        ...state,
      },
    );

    // Use setters to sanitise these values
    this.gas = gas;
    this.gasPrice = gasPrice;
    this.nonce = nonce;
    this.value = value || 0;
  }

  get chainId() {
    return this._state.chainId;
  }

  get confirmations() {
    return this._state.confirmations;
  }

  get confirmedAt() {
    return this._state.confirmedAt;
  }

  get createdAt() {
    return this._state.createdAt;
  }

  get data() {
    return this._state.data;
  }

  get from() {
    return this._state.from;
  }

  get functionCall() {
    return this._state.functionCall;
  }

  get gas() {
    return this._state.gas;
  }

  get gasPrice() {
    return this._state.gasPrice;
  }

  get hash() {
    return this._state.hash;
  }

  get receipt() {
    return this._state.receipt;
  }

  get sentAt() {
    return this._state.sentAt;
  }

  get to() {
    return this._state.to;
  }

  get value() {
    return this._state.value;
  }

  get nonce() {
    return this._state.nonce;
  }

  get rawTransaction() {
    const rawTx: UnsignedTransaction = {
      data: this.data,
      from: this.from,
      to: this.to,
      value: this.value,
    };

    if (this.chainId) rawTx.chainId = this.chainId;
    if (this.gas) rawTx.gas = this.gas;
    if (this.gasPrice) rawTx.gasPrice = this.gasPrice;
    if (this.nonce) rawTx.nonce = this.nonce;

    return rawTx;
  }

  set nonce(nonce: any) {
    this._checkNotSent('set nonce');
    this._state.nonce = parseBigNumber(nonce);
  }

  set gas(gas: any) {
    this._checkNotSent('set gas limit');
    this._state.gas = parseBigNumber(gas);
  }

  set gasPrice(gasPrice: any) {
    this._checkNotSent('set gas price');
    this._state.gasPrice = parseBigNumber(gasPrice);
  }

  set chainId(chainId: number) {
    this._checkNotSent('set network ID');
    this._state.chainId = chainId;
  }

  set value(value: any) {
    this._checkNotSent('set value');
    this._state.value = parseBigNumber(value);
  }

  _checkNotSent(action: string = 'perform action') {
    if (this.sentAt) {
      throw new Error(
        `Unable to ${action}: the transaction has already been sent`,
      );
    }
  }

  _handleConfirmation(confirmationNumber: number, receipt: TransactionReceipt) {
    if (!this.confirmedAt) this._state.confirmedAt = new Date();
    this._state.confirmations.push(receipt);
    this.emit('confirmation', confirmationNumber, receipt);
  }

  _handleTransactionHash(hash: string) {
    this._state.sentAt = new Date();
    this._state.hash = hash;
    this.emit('transactionHash', hash);
  }

  _handleReceipt(receipt: TransactionReceipt) {
    this._state.receipt = receipt;
    if (receipt.events) {
      if (!this._state.events) this._state.events = {};
      Object.keys(receipt.events).forEach(eventName => {
        const event = this._lh.events[eventName];
        this._state.events[eventName] = event.handleEvent(receipt.events[eventName]);
      });
    }
    this.emit('receipt', receipt);
    this.emit('receipt', receipt);
  }

  _handleSendError(error: Error) {
    if (!this.receipt) this._state.sentAt = undefined;
    this.emit('error', error);
  }

  toJSON() {
    const state: TransactionState = {
      confirmations: this.confirmations,
      createdAt: this.createdAt,
      data: this.data,
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

  async estimate(): Promise<Gas> {
    return this._lh.adapter.estimate(this.rawTransaction);
  }

  async send(): Promise<TransactionReceipt> {
    this._checkNotSent('send transaction');

    if (this.gas == null) this.gas = await this.estimate();
    if (this.gasPrice == null)
      this.gasPrice = await this._lh.adapter.getGasPrice();
    if (this.nonce == null)
      this.nonce = await this._lh.adapter.getNonce(this.from);
    if (this.chainId == null)
      this.chainId = await this._lh.adapter.getCurrentNetwork();

    return this._send();
  }

  async _send() {
    const sendTransaction = await this._lh.adapter.getSendTransaction(
      this.rawTransaction,
    );
    return new Promise((resolve, reject) => {
      sendTransaction()
        .on('transactionHash', hash => this._handleTransactionHash(hash))
        .on('receipt', receipt => this._handleReceipt(receipt))
        .on('confirmation', (confirmationNumber, receipt) =>
          this._handleConfirmation(confirmationNumber, receipt),
        )
        .on('error', error => this._handleSendError(error))
        .catch(reject)
        .then(resolve);
    });
  }
}
