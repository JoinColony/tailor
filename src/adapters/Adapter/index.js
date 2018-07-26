/* @flow */
/* eslint-disable no-unused-vars,class-methods-use-this */

import type { IAdapter } from '../../interface/Adapter';

const notDefinedError = methodName => {
  throw new Error(`Expected "${methodName}" to be defined in a derived class`);
};

// XXX Abstract class
export default class Adapter implements IAdapter {
  static get name() {
    return 'adapter';
  }

  initialize(contractData: *) {
    return notDefinedError('initialize');
  }

  encodeDeploy(args: *) {
    return notDefinedError('encodeDeploy');
  }

  encodeFunctionCall(functionCall: *) {
    return notDefinedError('encodeFunctionCall');
  }

  decodeFunctionCallData(functionCallData: *) {
    return notDefinedError('decodeFunctionCallData');
  }

  estimate(transactionData: *) {
    return notDefinedError('estimate');
  }

  sendSignedTransaction(transaction: *) {
    return notDefinedError('sendSignedTransaction');
  }

  call(functionCall: *) {
    return notDefinedError('call');
  }

  subscribe(options: *) {
    return notDefinedError('subscribe');
  }

  getCurrentNetwork() {
    return notDefinedError('getCurrentNetwork');
  }

  getGasPrice() {
    return notDefinedError('getGasPrice');
  }
}
