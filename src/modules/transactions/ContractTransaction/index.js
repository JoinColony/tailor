/* @flow */

import { isOptions } from '../utils';
import Transaction from '../Transaction';
import HookManager from '../../HookManager';
import getFunctionCall from '../../getFunctionCall';

import type { TransactionReceipt, TransactionState } from '../flowtypes';
import type Lighthouse from '../../../Lighthouse';
import type { FunctionParams } from '../../../interface/ContractSpec';

export default class ContractTransaction extends Transaction {
  _lh: Lighthouse;

  _state: TransactionState;

  static get transactionName() {
    return 'contract';
  }

  /**
   * Returns a method factory specific to this Transaction type, to be
   * attached to the Lighthouse `methods` object. Also attaches hooks.
   */
  static getMethodFn({
    lighthouse,
    functionParams,
    isPayable,
    ...methodParams
  }: {
    lighthouse: Lighthouse,
    functionParams: FunctionParams,
    isPayable?: boolean,
  }): ((...params: any) => Transaction) & Object {
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
        ...methodParams,
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

  get _JSONValues() {
    return Object.assign({}, super._JSONValues, {
      events: this.events,
      functionCall: this.functionCall,
    });
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
    super._handleReceipt(receipt);
  }
}
