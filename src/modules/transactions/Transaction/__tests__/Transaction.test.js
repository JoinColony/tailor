/* eslint-env jest */
/* eslint-disable no-underscore-dangle */

import createSandbox from 'jest-sandbox';
import BigNumber from 'bn.js';

import Transaction from '../index';

describe('Transaction', () => {
  const sandbox = createSandbox();

  const gasEstimate = 31415926535;
  const gasPrice = 4;
  const nonce = 0;
  const chainId = 1;
  const signedTransaction = 'signed tx';
  const to = '0x123';

  const wallet = {
    address: 'wallet address',
    sign: sandbox.fn().mockResolvedValue(signedTransaction),
  };
  const mockAdapter = {
    estimate: sandbox.fn().mockResolvedValue(gasEstimate),
    sendSignedTransaction: sandbox.fn(),
    getGasPrice: sandbox.fn().mockReturnValue(gasPrice),
    getNonce: sandbox.fn().mockReturnValue(nonce),
    getCurrentNetwork: sandbox.fn().mockReturnValue(chainId),
    wallet,
  };

  beforeEach(() => {
    sandbox.clear();
  });

  test('Estimate', async () => {
    const tx = new Transaction(mockAdapter, { to });

    const estimate = await tx.estimate();

    expect(estimate).toBe(gasEstimate);
    expect(mockAdapter.estimate).toHaveBeenCalledWith({
      from: mockAdapter.wallet.address,
      to,
      value: expect.any(BigNumber),
    });
  });

  test('Preparing to send', async () => {
    const tx = new Transaction(mockAdapter, { to });

    sandbox.spyOn(tx, 'estimate').mockImplementation(async () => gasEstimate);
    sandbox.spyOn(tx, '_checkNotSent');
    sandbox.spyOn(tx, '_send').mockImplementation(() => {});

    await tx.send();

    // The gas/gasPrice/nonce/chainId should have been set
    expect(tx._checkNotSent).toHaveBeenCalled();
    expect(tx.estimate).toHaveBeenCalled();
    expect(mockAdapter.getGasPrice).toHaveBeenCalled();
    expect(mockAdapter.getNonce).toHaveBeenCalledWith(tx.from);
    expect(mockAdapter.getCurrentNetwork).toHaveBeenCalled();
    expect(tx).toHaveProperty('gas', new BigNumber(gasEstimate));
    expect(tx).toHaveProperty('gasPrice', new BigNumber(gasPrice));
    expect(tx).toHaveProperty('nonce', new BigNumber(nonce));
    expect(tx).toHaveProperty('chainId', chainId);

    // The tx should have been sent...
    expect(tx._send).toHaveBeenCalled();
  });

  test('Sending', async () => {
    const callbacks = [];
    const eventEmitter = {};
    const mockOn = sandbox.fn().mockImplementation((event, cb) => {
      callbacks.push(cb);
      return eventEmitter;
    });
    const mockCatch = sandbox.fn().mockImplementation(() => eventEmitter);
    const mockThen = sandbox.fn().mockImplementation(cb => {
      cb();
      return eventEmitter;
    });
    eventEmitter.on = mockOn;
    eventEmitter.catch = mockCatch;
    eventEmitter.then = mockThen;
    const mockSendTransaction = () => eventEmitter;
    mockAdapter.getSendTransaction = sandbox
      .fn()
      .mockImplementation(() => mockSendTransaction);

    const tx = new Transaction(mockAdapter, { to });
    tx.gas = gasEstimate;
    tx.gasPrice = gasPrice;
    tx.nonce = nonce;
    tx.chainId = chainId;

    sandbox.spyOn(tx, 'emit').mockImplementation(() => null);

    const sent = await tx._send();
    expect(sent).toBe(tx);

    // transaction hash
    expect(mockOn).toHaveBeenCalledWith('transactionHash', expect.anything());
    callbacks[0]('hash');
    expect(tx.emit).toHaveBeenCalledWith('transactionHash', 'hash');

    // confirmation
    expect(mockOn).toHaveBeenCalledWith('confirmation', expect.anything());
    callbacks[1]('confirmationNumber', 'receipt');
    expect(tx.emit).toHaveBeenCalledWith(
      'confirmation',
      'confirmationNumber',
      'receipt',
    );

    // error
    expect(mockOn).toHaveBeenCalledWith('error', expect.anything());
    callbacks[2]('error');
    expect(tx.emit).toHaveBeenCalledWith('error', 'error');

    // decode receipt fails
    tx._state.sentAt = undefined;
    mockAdapter.getSendTransaction.mockImplementationOnce(() => () => {
      throw new Error('fake error');
    });
    await expect(tx.send()).rejects.toEqual(new Error('fake error'));

    // error after receipt
    tx._state.receipt = 'receipt';
    callbacks[2]('error');
    expect(tx.emit).toHaveBeenCalledWith('error', 'error');
    expect(tx.sentAt).toBe(undefined);

    // error with hooks
    const tx2 = new Transaction(mockAdapter, { to });
    sandbox
      .spyOn(tx2.hooks, 'getHookedValue')
      .mockImplementationOnce(async value => value)
      .mockImplementationOnce(() => {
        throw new Error('Hooks failed');
      });
    await expect(tx2.send()).rejects.toThrow('Hooks failed');
  });

  test('To JSON', () => {
    const confirmations = ['confirmation'];
    const value = new BigNumber(999);
    const receipt = 'receipt';
    const from = 'wallet address';

    const tx = new Transaction(mockAdapter, { to });

    // bare minimum
    let json = JSON.parse(tx.toJSON());

    expect(json).toEqual({
      confirmations: [],
      createdAt: expect.any(String),
      from,
      to,
      value: '0',
    });

    // everything
    tx.chainId = 1;
    tx.gas = gasEstimate;
    tx.gasPrice = 4;
    tx.value = value;
    tx._state.confirmations = confirmations;
    tx._state.confirmedAt = new Date();
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
      from,
      gas: `${gasEstimate}`,
      gasPrice: '4',
      hash: 'transaction hash',
      receipt,
      sentAt: expect.any(String),
      to,
      value: '999',
    });
  });

  test('Numeric properties', () => {
    const tx = new Transaction(mockAdapter, { to });

    ['gas', 'gasPrice', 'value'].forEach(propName => {
      // set with number
      tx[propName] = 123456;
      expect(tx[propName]).toEqual(new BigNumber(123456));

      // set with string
      tx[propName] = '234567';
      expect(tx[propName]).toEqual(new BigNumber(234567));

      // set with bn
      const bn = new BigNumber(345678);
      tx[propName] = bn;
      expect(tx[propName]).toEqual(bn);

      // set with not valid
      tx[propName] = 'not a valid input';
      expect(tx[propName]).toBe(null);

      // set when already sent
      tx._state.sentAt = new Date();
      expect(() => {
        tx[propName] = 123456;
      }).toThrow('Unable to set');
      tx._state.sentAt = undefined;
    });
  });

  test('Get receipt', () => {
    const tx = new Transaction(mockAdapter, { to });

    // not set
    expect(tx.receipt).toBe(undefined);

    // set
    tx._state.receipt = { receipt: true };
    expect(tx.receipt).toEqual({ receipt: true });
  });

  test('Checking not sent', () => {
    const tx = new Transaction(mockAdapter, { to });

    expect(() => tx._checkNotSent()).not.toThrow();

    tx._state.sentAt = new Date();
    expect(() => tx._checkNotSent()).toThrow('Unable to perform action');
    expect(() =>
      tx._checkNotSent('do an action with a custom message'),
    ).toThrow('Unable to do an action with a custom message');
  });

  test('Handling confirmations', () => {
    const tx = new Transaction(mockAdapter, { to });
    expect(tx).toHaveProperty('confirmedAt', undefined);

    const receipt0 = { receipt0: true };
    const receipt1 = { receipt1: true };
    sandbox.spyOn(tx, 'emit');

    tx._handleConfirmation(0, receipt0);

    expect(tx.emit).toHaveBeenCalledWith('confirmation', 0, receipt0);
    expect(tx).toHaveProperty('confirmedAt', expect.any(Date));
    expect(tx).toHaveProperty('confirmations', [receipt0]);
    tx.emit.mockReset();

    // Further confirmations should add a confirmation and not change the date
    const confirmedAt = new Date(tx.confirmedAt);
    tx._handleConfirmation(1, receipt1);

    expect(tx.emit).toHaveBeenCalledWith('confirmation', 1, receipt1);
    expect(tx).toHaveProperty('confirmations', [receipt0, receipt1]);
    expect(tx).toHaveProperty('confirmedAt', confirmedAt);
  });

  test('Handling errors while sending', () => {
    const tx = new Transaction(mockAdapter, { to });

    tx._state.sentAt = new Date();
    sandbox.spyOn(tx, 'emit');

    const error = new Error('some error while sending');
    tx._handleSendError(error);

    expect(tx.emit).toHaveBeenCalledWith('error', error);
    expect(tx.sentAt).toBe(undefined);
  });

  test('Handling receipts', () => {
    const tx = new Transaction(mockAdapter, { to });
    sandbox.spyOn(tx, 'emit');

    const receipt = {};

    tx._handleReceipt(receipt);

    expect(tx.emit).toHaveBeenCalledWith('receipt', receipt);
    expect(tx).toHaveProperty('receipt', receipt);
  });
});
