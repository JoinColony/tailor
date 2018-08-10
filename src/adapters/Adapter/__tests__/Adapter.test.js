/* eslint-env jest */

import Adapter from '../index';

describe('Adapter', () => {
  test('provides a name', () => {
    expect(Adapter.name).toEqual('adapter');
  });

  test('has no implemented methods', () => {
    const adapter = new Adapter();
    expect(() => adapter.initialize()).toThrow('initialize');
    expect(() => adapter.encodeDeploy()).toThrow('encodeDeploy');
    expect(() => adapter.encodeFunctionCall()).toThrow('encodeFunctionCall');
    expect(() => adapter.decodeFunctionCallData()).toThrow(
      'decodeFunctionCallData',
    );
    expect(() => adapter.estimate()).toThrow('estimate');
    expect(() => adapter.sendSignedTransaction()).toThrow(
      'sendSignedTransaction',
    );
    expect(() => adapter.call()).toThrow('call');
    expect(() => adapter.subscribe()).toThrow('subscribe');
    expect(() => adapter.getCurrentNetwork()).toThrow('getCurrentNetwork');
    expect(() => adapter.getGasPrice()).toThrow('getGasPrice');
    expect(() => adapter.getNonce()).toThrow('getNonce');
    expect(() => adapter.getSendTransaction()).toThrow('getSendTransaction');
  });
});
