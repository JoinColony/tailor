/* eslint-env jest */
/* eslint-disable no-underscore-dangle */

import createSandbox from 'jest-sandbox';
import { sha3 } from 'web3-utils';

import PromiEvent from 'web3-core-promievent';
import Web3Adapter from '../index';

jest.mock('web3-core-promievent');

describe('Web3Adapter', () => {
  const sandbox = createSandbox();

  const mockWeb3 = {
    eth: {
      abi: {
        decodeParameters: sandbox.fn(),
      },
      net: {
        getId: sandbox.fn(),
      },
      Contract: sandbox.fn(),
      estimateGas: sandbox.fn(),
      sendTransaction: sandbox.fn(),
      sendSignedTransaction: sandbox.fn(),
      getGasPrice: sandbox.fn(),
      getTransactionCount: sandbox.fn(),
    },
  };

  const mockWallet = {
    address: 'wallet address',
  };

  const contractData = {
    abi: [{ name: 'myMethod' }],
    address: '0x123',
  };
  const args = ['first', 'second'];

  beforeEach(() => {
    sandbox.clear();
  });

  test('Name', () => {
    expect(Web3Adapter.name).toEqual('web3');
  });

  test('Initialize without arguments', () => {
    expect(() => new Web3Adapter()).toThrow();
  });

  test('Initialize', () => {
    const adapter = new Web3Adapter({ web3: mockWeb3, wallet: mockWallet });
    expect(adapter).toHaveProperty('_web3', mockWeb3);
    expect(adapter).toHaveProperty('wallet', mockWallet);

    adapter.initialize(contractData);

    expect(mockWeb3.eth.Contract).toHaveBeenCalledWith(
      contractData.abi,
      contractData.address,
    );
  });

  test('Encode deploy', () => {
    const mockEncodeABI = sandbox.fn();
    const mockDeploy = sandbox.fn().mockImplementation(() => ({
      encodeABI: mockEncodeABI,
    }));
    mockWeb3.eth.Contract.mockImplementation(() => ({
      deploy: mockDeploy,
    }));

    const adapter = new Web3Adapter({ web3: mockWeb3 });
    adapter.initialize(contractData);

    adapter.encodeDeploy(args);

    expect(mockDeploy).toHaveBeenCalledWith({ arguments: args });
    expect(mockEncodeABI).toHaveBeenCalled();
  });

  test('Encode function call', () => {
    const functionCall = {
      functionSignature: 'myMethod()',
      args,
    };
    const badFunctionCall = {
      functionSignature: 'badMethod()',
      args,
    };
    const encodedFunctionCall = 'encoded function call';

    const mockEncodeABI = sandbox
      .fn()
      .mockImplementation(() => encodedFunctionCall);
    const mockMethod = sandbox.fn().mockImplementation(() => ({
      encodeABI: mockEncodeABI,
    }));
    mockWeb3.eth.Contract.mockImplementation(() => ({
      methods: { 'myMethod()': mockMethod },
    }));

    const adapter = new Web3Adapter({ web3: mockWeb3 });
    adapter.initialize(contractData);

    // existing function
    const result = adapter.encodeFunctionCall(functionCall);

    expect(result).toBe(encodedFunctionCall);
    expect(mockMethod).toHaveBeenCalledWith(...functionCall.args);
    expect(mockEncodeABI).toHaveBeenCalled();

    // non-existing function
    expect(() => adapter.encodeFunctionCall(badFunctionCall)).toThrow(
      badFunctionCall.method,
    );
  });

  test('Decode function call data', () => {
    const methodName = 'myMethod()';
    const badMethodName = 'myBadMethod()';
    const methodSig = sha3(methodName).slice(0, 10);
    const badMethodSig = sha3(badMethodName).slice(0, 10);
    const functionArgs = '9999999999999999';
    const functionCallData = methodSig + functionArgs;
    const badFunctionCallData = badMethodSig + functionArgs;
    const jsonInterface = [
      {
        name: methodName,
        signature: methodSig,
        inputs: [
          {
            type: 'type',
          },
          {
            type: 'another type',
          },
        ],
      },
    ];
    mockWeb3.eth.Contract.mockImplementation(() => ({
      _jsonInterface: jsonInterface,
    }));
    mockWeb3.eth.abi.decodeParameters.mockImplementation(() => ({
      '0': 'first',
      '1': 'second',
      myFirst: 'first',
      length: 4,
    }));

    const adapter = new Web3Adapter({ web3: mockWeb3 });
    adapter.initialize(contractData);

    // valid data
    const validResult = adapter.decodeFunctionCallData(functionCallData);

    expect(mockWeb3.eth.abi.decodeParameters).toHaveBeenCalledWith(
      ['type', 'another type'],
      `0x${functionArgs}`,
    );
    expect(validResult).toEqual({
      functionSignature: methodSig,
      args: ['first', 'second'],
    });

    // non-existing methodSig
    expect(() => adapter.decodeFunctionCallData(badFunctionCallData)).toThrow(
      badMethodSig,
    );
  });

  test('Estimate', async () => {
    const estimatedGas = 123456;
    const transactionData = 'transaction data';
    const contractAddress = 'contract address';

    mockWeb3.eth.estimateGas.mockImplementation(() => estimatedGas);
    mockWeb3.eth.Contract.mockImplementation(() => ({
      options: {
        address: contractAddress,
      },
    }));

    const adapter = new Web3Adapter({ web3: mockWeb3 });
    adapter.initialize(contractData);

    const result = await adapter.estimate({ data: transactionData });

    expect(result).toBe(estimatedGas);
    expect(mockWeb3.eth.estimateGas).toHaveBeenCalledWith({
      to: contractAddress,
      data: transactionData,
    });
  });

  test('Decode receipt', () => {
    const receipt = {
      logs: ['first log', 'second log', 'third log', 'fourth log'],
    };
    const events = [
      {
        event: 'MyEvent',
        args: {
          '0': 'called',
          '1': 'once',
          length: 2,
        },
      },
      {
        event: 'MyEvent',
        args: {
          '0': 'called',
          '1': 'again',
          length: 2,
        },
      },
      {
        event: 'MyEvent',
        args: {
          '0': 'called',
          '1': 'once more',
          length: 2,
        },
      },
      {
        args: {
          '0': 'anonymous',
          '1': 'event',
          named0: 'anonymous',
          named1: 'event',
          length: 2,
        },
      },
    ];
    const mockDecodeEventABI = sandbox
      .fn()
      .mockReturnValueOnce(events[0])
      .mockReturnValueOnce(events[1])
      .mockReturnValueOnce(events[2])
      .mockReturnValueOnce(events[3]);
    mockWeb3.eth.Contract.mockImplementation(() => ({
      _decodeEventABI: mockDecodeEventABI,
      options: {
        jsonInterface: 'json interface',
      },
    }));

    const adapter = new Web3Adapter({ web3: mockWeb3 });
    adapter.initialize(contractData);

    // with logs
    const decoded = adapter._decodeReceipt(receipt);

    expect(mockDecodeEventABI).toHaveBeenCalledWith(
      expect.anything(),
      receipt.logs[0],
    );
    expect(mockDecodeEventABI).toHaveBeenCalledWith(
      expect.anything(),
      receipt.logs[1],
    );
    expect(mockDecodeEventABI).toHaveBeenCalledWith(
      expect.anything(),
      receipt.logs[2],
    );
    expect(mockDecodeEventABI).toHaveBeenCalledWith(
      expect.anything(),
      receipt.logs[3],
    );
    expect(mockDecodeEventABI).toHaveBeenCalledTimes(4);

    expect(decoded).toEqual(
      Object.assign(receipt, {
        events: {
          '0': events[3],
          MyEvent: [events[0], events[1], events[2]],
        },
      }),
    );

    // no logs
    const noLogs = {};
    const noLogsResult = adapter._decodeReceipt(noLogs);
    expect(noLogsResult).toBe(noLogs);
  });

  test('Send signed transaction', () => {
    const transaction = 'signed transaction';
    const callbacks = [];

    const mockOn = sandbox.fn().mockImplementation((event, cb) => {
      callbacks.push(cb);
    });
    const mockThen = sandbox.fn().mockImplementation(cb => {
      callbacks.push(cb);
    });
    const eventEmitter = {
      on: mockOn,
      catch: () => {},
      then: mockThen,
    };
    mockWeb3.eth.sendSignedTransaction.mockImplementation(() => eventEmitter);

    const mockEmit = sandbox.fn();
    PromiEvent.mockImplementation(() => ({
      eventEmitter: {
        emit: mockEmit,
      },
      resolve: sandbox.fn(),
    }));

    const adapter = new Web3Adapter({ web3: mockWeb3 });
    adapter.initialize(contractData);

    const decodeSpy = sandbox
      .spyOn(adapter, '_decodeReceipt')
      .mockImplementation(value => value);

    adapter.sendSignedTransaction(transaction);

    // transactionHash
    expect(mockOn).toHaveBeenCalledWith('transactionHash', expect.anything());
    callbacks[0]('hash');
    expect(mockEmit).toHaveBeenCalledWith('transactionHash', 'hash');

    // receipt
    expect(mockOn).toHaveBeenCalledWith('receipt', expect.anything());
    callbacks[1]('receipt');
    expect(decodeSpy).toHaveBeenCalledWith('receipt');
    decodeSpy.mockClear();
    expect(mockEmit).toHaveBeenCalledWith('receipt', 'receipt');

    // confirmation
    expect(mockOn).toHaveBeenCalledWith('confirmation', expect.anything());
    callbacks[2]('confirmationNumber', 'receipt');
    expect(decodeSpy).toHaveBeenCalledWith('receipt');
    expect(mockEmit).toHaveBeenCalledWith(
      'confirmation',
      'confirmationNumber',
      'receipt',
    );

    // error
    expect(mockOn).toHaveBeenCalledWith('error', expect.anything());
    callbacks[3]('error');
    expect(mockEmit).toHaveBeenCalledWith('error', 'error');

    // then
    expect(mockThen).toHaveBeenCalledTimes(1);
    callbacks[4]();

    // receipt with decode error
    decodeSpy.mockImplementationOnce(() => {
      throw new Error('fake error');
    });
    callbacks[1]('receipt');
    expect(mockEmit).toHaveBeenCalledWith('error', new Error('fake error'));
    mockEmit.mockClear();

    // confirmation with decode error
    decodeSpy.mockImplementationOnce(() => {
      throw new Error('fake error');
    });
    callbacks[2]('confirmationNumber', 'receipt');
    expect(mockEmit).toHaveBeenCalledWith('error', new Error('fake error'));
    mockEmit.mockClear();

    // then with decode error
    decodeSpy.mockImplementationOnce(() => {
      throw new Error('fake error');
    });
    callbacks[4]('receipt');
    expect(mockEmit).toHaveBeenCalledWith('error', new Error('fake error'));
  });

  test('Call', async () => {
    const functionCall = {
      functionSignature: 'myMethod()',
      args,
    };
    const badFunctionCall = {
      functionSignature: 'badMethod()',
      args,
    };
    const callResult = {
      '0': 'first',
      '1': 'second',
      myFirst: 'first',
      mySecond: 'second',
      length: 2,
    };

    const mockCall = sandbox.fn().mockImplementation(() => callResult);
    const mockMethod = sandbox.fn().mockImplementation(() => ({
      call: mockCall,
    }));
    mockWeb3.eth.Contract.mockImplementation(() => ({
      methods: { 'myMethod()': mockMethod },
    }));

    const adapter = new Web3Adapter({ web3: mockWeb3 });
    adapter.initialize(contractData);

    // existing function
    const result = await adapter.call(functionCall);

    expect(result).toEqual(['first', 'second']);
    expect(mockMethod).toHaveBeenCalledWith(...functionCall.args);
    expect(mockCall).toHaveBeenCalled();

    // non-existing function
    await expect(adapter.call(badFunctionCall)).rejects.toEqual(
      new Error(
        `Function with signature "${
          badFunctionCall.functionSignature
        }" not defined on this contract`,
      ),
    );
  });

  test('Subscribe', () => {
    const options = {
      address: 'after address',
      event: 'MyEvent()',
    };
    const badOptions = {
      event: 'BadEvent()',
    };
    const singleEventSub = 'single event sub';
    const allEventsSub = 'all events sub';

    const mockEvent = sandbox.fn().mockImplementation(() => singleEventSub);
    const mockAllEvents = sandbox.fn().mockImplementation(() => allEventsSub);
    const mockContract = {
      options: {
        address: 'before address',
      },
      events: {
        'MyEvent()': mockEvent,
        allEvents: mockAllEvents,
      },
    };
    mockWeb3.eth.Contract.mockImplementation(() => ({
      clone: () => mockContract,
    }));

    const adapter = new Web3Adapter({ web3: mockWeb3 });
    adapter.initialize(contractData);

    // existing event
    const result = adapter.subscribe(options);

    // TODO: expect contract.options.address to have changed
    expect(mockEvent).toHaveBeenCalled();
    expect(result).toBe(singleEventSub);

    // non-existing event
    expect(() => {
      adapter.subscribe(badOptions);
    }).toThrow(`Event "${badOptions.event}" not defined on this contract`);

    // all events
    const allResult = adapter.subscribe();

    expect(mockAllEvents).toHaveBeenCalled();
    expect(allResult).toBe(allEventsSub);
  });

  test('Get current network', async () => {
    // no init required for getCurrentNetwork
    const adapter = new Web3Adapter({ web3: mockWeb3 });

    await adapter.getCurrentNetwork();

    expect(mockWeb3.eth.net.getId).toHaveBeenCalled();
  });

  test('Get gas price', async () => {
    // no init required for getGasPrice
    const adapter = new Web3Adapter({ web3: mockWeb3 });

    await adapter.getGasPrice();

    expect(mockWeb3.eth.getGasPrice).toHaveBeenCalled();
  });

  test('Get contract instance', async () => {
    const adapter = new Web3Adapter({ web3: mockWeb3 });

    expect(() => adapter.contract).toThrow(
      'Adapter not initialized! Call `.initialize()` first.',
    );

    adapter._contract = 'the contract';

    expect(adapter.contract).toBe(adapter._contract);
  });

  test('Get nonce', async () => {
    const adapter = new Web3Adapter({ web3: mockWeb3, wallet: mockWallet });

    mockWeb3.eth.getTransactionCount.mockImplementationOnce(async () => 4);
    expect(await adapter.getNonce()).toEqual(4);
    expect(mockWeb3.eth.getTransactionCount).toHaveBeenCalledWith(
      adapter.wallet.address,
    );
    mockWeb3.eth.getTransactionCount.mockReset();

    mockWeb3.eth.getTransactionCount.mockImplementationOnce(async () => 0);
    expect(await adapter.getNonce('other address')).toEqual(0);
    expect(mockWeb3.eth.getTransactionCount).toHaveBeenCalledWith(
      'other address',
    );
    mockWeb3.eth.getTransactionCount.mockReset();
  });

  test('Get sendTransaction method', async () => {
    const adapter = new Web3Adapter({ web3: mockWeb3, wallet: mockWallet });
    const tx = 'unsigned transaction';

    const promiEvent = { promiEvent: true };
    mockWeb3.eth.sendTransaction.mockImplementation(async () => promiEvent);
    sandbox
      .spyOn(adapter, 'sendSignedTransaction')
      .mockImplementation(async () => promiEvent);

    // Without a sign method on the wallet
    const sendTx1 = await adapter.getSendTransaction(tx);
    expect(sendTx1).toEqual(expect.any(Function));

    await sendTx1();
    expect(adapter.sendSignedTransaction).not.toHaveBeenCalled();
    expect(adapter._web3.eth.sendTransaction).toHaveBeenCalledWith(tx);
    adapter.sendSignedTransaction.mockReset();
    mockWeb3.eth.sendTransaction.mockReset();

    // With a sign method on the wallet
    const signedTx = 'signed transaction';
    const fancyWallet = {
      sign: sandbox.fn().mockImplementation(async () => signedTx),
    };
    adapter.wallet = fancyWallet;

    const sendTx2 = await adapter.getSendTransaction(tx);
    expect(sendTx2).toEqual(expect.any(Function));

    await sendTx2();
    expect(fancyWallet.sign).toHaveBeenCalledWith(tx);
    expect(adapter.sendSignedTransaction).toHaveBeenCalledWith(signedTx);
    expect(mockWeb3.eth.sendTransaction).not.toHaveBeenCalled();
    expect(adapter.sendSignedTransaction).toHaveBeenCalledWith(signedTx);
    adapter.sendSignedTransaction.mockReset();
    mockWeb3.eth.sendTransaction.mockReset();
  });
});
