/* eslint-env jest */
/* eslint-disable no-underscore-dangle */

import createSandbox from 'jest-sandbox';
import BigNumber from 'bn.js';

import Transaction from '../index';
import Event from '../../../Event';
import { BOOLEAN_TYPE } from '../../../paramTypes';

describe('ContractTransaction', () => {
  const sandbox = createSandbox();

  const functionCall = {
    functionSignature: 'myFunction(unit8)',
    args: [255],
  };
  const encodedFunctionCall = 'encoded function call';
  const gasEstimate = 31415926535;
  const gasPrice = 4;
  const nonce = 0;
  const chainId = 1;
  const signedTransaction = 'signed tx';

  const mockEncodeFunctionCall = sandbox
    .fn()
    .mockImplementation(() => encodedFunctionCall);
  const wallet = {
    address: 'wallet address',
    sign: sandbox.fn().mockResolvedValue(signedTransaction),
  };
  const mockTailor = {
    adapter: {
      estimate: sandbox.fn().mockResolvedValue(gasEstimate),
      encodeFunctionCall: mockEncodeFunctionCall,
      sendSignedTransaction: sandbox.fn(),
      getGasPrice: sandbox.fn().mockReturnValue(gasPrice),
      getNonce: sandbox.fn().mockReturnValue(nonce),
      getCurrentNetwork: sandbox.fn().mockReturnValue(chainId),
      wallet,
    },
    wallet,
    contractAddress: 'contract address',
  };

  mockTailor.events = {
    MyEvent: new Event(mockTailor, {
      name: 'MyEvent',
      output: { 'MyEvent()': [] },
    }),
    MyOtherEvent: new Event(mockTailor, {
      name: 'MyOtherEvent',
      output: {
        'MyOtherEvent(bool)': [
          {
            name: 'someValue',
            type: BOOLEAN_TYPE,
          },
        ],
      },
    }),
  };

  beforeEach(() => {
    sandbox.clear();
  });

  test('Constructor', () => {
    expect(
      () =>
        new Transaction(mockTailor, {
          functionCall,
          to: 'not the wallet address',
        }),
    ).toThrow('"to" address does not match contract address');
  });

  test('To JSON', () => {
    const confirmations = ['confirmation'];
    const events = { MyEvent: { myValue: 1 } };
    const value = new BigNumber(999);
    const receipt = 'receipt';
    const from = 'wallet address';

    const tx = new Transaction(mockTailor, { functionCall });

    // bare minimum
    let json = JSON.parse(tx.toJSON());

    expect(json).toEqual({
      confirmations: [],
      createdAt: expect.any(String),
      data: encodedFunctionCall,
      events: [],
      from,
      functionCall,
      to: mockTailor.contractAddress,
      value: '0',
    });

    // everything
    tx.chainId = 1;
    tx.gas = gasEstimate;
    tx.gasPrice = 4;
    tx.value = value;
    tx._state.confirmations = confirmations;
    tx._state.confirmedAt = new Date();
    tx._state.events = events;
    tx._state.from = from;
    tx._state.hash = 'transaction hash';
    tx._state.receipt = receipt;
    tx._state.sentAt = new Date();

    json = JSON.parse(tx.toJSON());

    expect(json).toEqual({
      chainId: 1,
      confirmations,
      confirmedAt: expect.any(String),
      createdAt: expect.any(String),
      data: encodedFunctionCall,
      events,
      from,
      functionCall,
      gas: `${gasEstimate}`,
      gasPrice: '4',
      hash: 'transaction hash',
      receipt,
      sentAt: expect.any(String),
      to: mockTailor.contractAddress,
      value: '999',
    });
  });

  test('Get function call', () => {
    const tx = new Transaction(mockTailor, { functionCall });

    expect(tx.functionCall).toBe(functionCall);
  });

  test('Handling receipts', () => {
    const tx = new Transaction(mockTailor, { functionCall });
    sandbox.spyOn(tx, 'emit');
    sandbox.spyOn(tx, '_handleReceiptEvents');
    sandbox.spyOn(Event.prototype, 'handleEvent');

    const receipt = {
      events: {
        MyEvent: [
          {
            signature:
              // eslint-disable-next-line max-len
              '0x4dbfb68b43dddfa12b51ebe99ab8fded620f9a0ac23142879a4f192a1b7952d2',
            returnValues: {},
            event: 'MyEvent',
          },
        ],
        MyOtherEvent: [
          {
            signature:
              // eslint-disable-next-line max-len
              '0x54552747a8ff700c6bab19a89633321fa93fa8cde42a60f5d3679e146768c727',
            returnValues: {
              '0': true,
            },
            event: 'MyOtherEvent',
          },
        ],
      },
    };

    // no events
    tx._handleReceipt({});
    expect(tx._handleReceiptEvents).toHaveBeenCalledWith({});
    expect(tx).toHaveProperty('receipt', {});
    expect(tx).toHaveProperty('events', []);

    // with events
    tx._handleReceipt(receipt);

    expect(tx._handleReceiptEvents).toHaveBeenCalledWith(receipt);
    expect(tx.emit).toHaveBeenCalledWith('receipt', receipt);
    expect(tx).toHaveProperty('receipt', receipt);
    expect(tx).toHaveProperty('events', [
      {
        data: {},
        event: receipt.events.MyEvent[0],
        signature: 'MyEvent()',
        name: 'MyEvent',
      },
      {
        data: {
          someValue: true,
        },
        event: receipt.events.MyOtherEvent[0],
        signature: 'MyOtherEvent(bool)',
        name: 'MyOtherEvent',
      },
    ]);
    expect(Event.prototype.handleEvent).toHaveBeenCalledTimes(2);
    expect(Event.prototype.handleEvent).toHaveBeenCalledWith(
      receipt.events.MyEvent[0],
    );
    expect(Event.prototype.handleEvent).toHaveBeenCalledWith(
      receipt.events.MyOtherEvent[0],
    );
  });
});
