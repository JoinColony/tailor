import path from 'path';
import createSandbox from 'jest-sandbox';
import Web3 from 'web3';

import TestWallet from './utils/TestWallet';
import Lighthouse from '../src';

const directory = path.resolve(
  'integration-testing',
  'truffle-project',
  'build',
  'contracts',
);

jest.setTimeout(60000);

describe('Integration testing', () => {
  const sandbox = createSandbox();

  beforeEach(() => {
    sandbox.clear();
  });

  let client;

  const walletAddresses = Object.keys(global.ganacheAccounts.accounts);
  const [walletAddress] = walletAddresses;
  const {
    secretKey: { data: privateKeyData },
  } = global.ganacheAccounts.accounts[walletAddress];
  const privateKey = Buffer.from(privateKeyData);

  const wallet = new TestWallet(walletAddress, privateKey);

  test('Creating a client', async () => {
    const web3 = new Web3('ws://localhost:8545');
    client = await Lighthouse.create({
      adapter: {
        name: 'web3',
        options: { web3 },
      },
      query: { contractName: 'MetaCoin' },
      parser: 'truffle',
      loader: {
        name: 'truffle',
        options: {
          directory,
        },
      },
      wallet,
    });

    expect(client).toHaveProperty('constants', {
      getBalance: expect.any(Function),
      getBalanceInEth: expect.any(Function),
      lastSender: expect.any(Function),
      overloaded: expect.any(Function),
    });

    // It hasn't crashed yet? Good enough for now.
  });

  test('Calling an overloaded constant', async () => {
    const { overloaded } = client.constants;
    expect(await overloaded(2, 2, 2)).toEqual({ sum: 6 });
    expect(await overloaded(2, 2)).toEqual({ sum: 4 });
    expect(await overloaded(2, true)).toEqual({ sum: 2 });
    expect(await overloaded(true, true)).toEqual({
      sum: 0,
    });
  });

  test('Calling a method', async () => {
    const tx = client.methods.emitOverloadedEvents();

    const receiptListener = sandbox.fn();
    const errorListener = sandbox.fn();
    const hashListener = sandbox.fn();
    tx.addListener('receipt', receiptListener);
    tx.addListener('error', errorListener);
    tx.addListener('transactionHash', hashListener);

    await tx.send();

    expect(tx).toHaveProperty('receipt', expect.any(Object));
    expect(tx).toHaveProperty('hash', expect.any(String));

    expect(receiptListener).toHaveBeenCalledTimes(1);
    expect(receiptListener).toHaveBeenCalledWith(expect.any(Object));

    expect(hashListener).toHaveBeenCalledTimes(1);
    expect(hashListener).toHaveBeenCalledWith(expect.any(String));

    expect(errorListener).not.toHaveBeenCalled();

    expect(tx).toHaveProperty('events', {
      'OverloadedEvent()': {},
      'OverloadedEvent(uint256)': { a: 2 },
      'OverloadedEvent(uint256,uint256)': { a: 2, b: 2 },
      'OverloadedEvent(bool,bool)': { a: true, b: true },
    });
  });

  // TODO in #51
  test.skip('Listening to overloaded events', async () => {
    const handlerFunction = sandbox.fn();
    client.events.OverloadedEvent.addListener(handlerFunction);

    const tx1 = client.methods.emitOverloadedEvents();
    await tx1.send();

    expect(handlerFunction).toHaveBeenCalledTimes(4);

    expect(handlerFunction).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({ signature: 'OverloadedEvent()', data: {} }),
    );
    expect(handlerFunction).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        signature: 'OverloadedEvent(uint256)',
        data: { a: 2 },
      }),
    );
    expect(handlerFunction).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        signature: 'OverloadedEvent(uint256,uint256)',
        data: { a: 2, b: 2 },
      }),
    );
    expect(handlerFunction).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        signature: 'OverloadedEvent(bool,bool)',
        data: {
          a: true,
          b: true,
        },
      }),
    );
    handlerFunction.mockReset();

    client.events.OverloadedEvent.removeListener(handlerFunction);

    const tx2 = client.methods.emitOverloadedEvents();
    await tx2.send();

    expect(handlerFunction).not.toHaveBeenCalled();
  });

  // TODO add tests for:
  // JoinColony/lighthouse#9
  // JoinColony/lighthouse#16
  // JoinColony/lighthouse#17
  // JoinColony/lighthouse#19
  // JoinColony/lighthouse#21
  // JoinColony/lighthouse#25
});
