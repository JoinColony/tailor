/* @flow */

import { isOptions } from '../utils';
import Transaction from '../Transaction';
import HookManager from '../../HookManager';
import getFunctionCall from '../../getFunctionCall';

import type { TransactionReceipt, TransactionState } from '../flowtypes';
import type Tailor from '../../../Tailor';
import type { FunctionParams } from '../../../interface/ContractSpec';

export default class ContractTransaction extends Transaction {
  _tailor: Tailor;

  _state: TransactionState;

  static get transactionName() {
    return 'contract';
  }

  /**
   * Returns a method factory specific to this Transaction type, to be
   * attached to the Tailor `methods` object. Also attaches hooks.
   */
  static getMethodFn({
    tailor,
    functionParams,
    isPayable,
    ...methodParams
  }: {
    tailor: Tailor,
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
      return new this(tailor, {
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
    tailor: Tailor,
    {
      functionCall,
      data = tailor.adapter.encodeFunctionCall(functionCall),
      to = tailor.contractAddress,
      events = [],
      ...state
    }: Object,
  ) {
    super(tailor.adapter, { functionCall, data, to, events, ...state });

    if (to && to.toLowerCase() !== tailor.contractAddress.toLowerCase())
      throw new Error('"to" address does not match contract address');

    this._tailor = tailor;
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
      const eventCls = this._tailor.events[eventName];
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
