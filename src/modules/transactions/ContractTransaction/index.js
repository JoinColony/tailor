/* @flow */

import BigNumber from 'bn.js';

import type { TransactionReceipt, TransactionState } from '../flowtypes';
import Transaction from '../Transaction';
import HookManager from '../../HookManager';
import getFunctionCall from '../../getFunctionCall';

// eslint-disable-next-line import/no-cycle
import type Lighthouse from '../../../Lighthouse';
import type { FunctionParams } from '../../../interface/ContractSpec';

function isOptions(input: any) {
  return (
    typeof input === 'object' &&
    ['value', 'gas', 'gasLimit'].some(
      option =>
        BigNumber.isBN(input[option]) || typeof input[option] === 'number',
    )
  );
}

export default class ContractTransaction extends Transaction {
  _lh: Lighthouse;

  _state: TransactionState;

  static get name() {
    return 'contract';
  }

  // returns a function which returns an instance of this
  static getMethodFn({
    lighthouse,
    functionParams,
    isPayable,
  }: {
    lighthouse: Lighthouse,
    functionParams: FunctionParams,
    isPayable?: boolean,
  }) {
    const hooks = new HookManager();
    const fn = (...inputParams: any) => {
      const options = isOptions(inputParams[inputParams.length - 1])
        ? inputParams.pop()
        : {};
      if (!isPayable && options.value)
        throw new Error('Cannot send a value to a non-payable function');
      // TODO: do we want to hook inputParams?
      const functionCall = getFunctionCall(functionParams, ...inputParams);
      return new this(lighthouse, {
        functionCall,
        hooks,
        ...options,
      });
    };
    fn.hooks = hooks.createHooks();
    return fn;
  }

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
    this._state.events = this._handleReceiptEvents(receipt);
    // eslint-disable-next-line no-underscore-dangle
    super._handleReceipt(receipt);
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
