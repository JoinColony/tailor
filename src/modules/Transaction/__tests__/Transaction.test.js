/* eslint-env jest */
/* eslint-disable no-underscore-dangle */

import createSandbox from 'jest-sandbox';
import BigNumber from 'bn.js';

import Transaction from '../index';

jest.mock('bn.js');

describe('Transaction', () => {
  const sandbox = createSandbox();

  const functionCall = {
    functionSignature: 'myFunction(unit8)',
    args: [255],
  };
  const encodedFunctionCall = 'encoded function call';
  const gasEstimate = 31415926535;

  const mockEncodeFunctionCall = sandbox
    .fn()
    .mockImplementation(() => encodedFunctionCall);
  const mockLighthouse = {
    adapter: {
      estimate: sandbox.fn().mockResolvedValue(gasEstimate),
      encodeFunctionCall: mockEncodeFunctionCall,
      sendSignedTransaction: sandbox.fn(),
    },
    wallet: {
      address: '0x123',
    },
    contractAddress: '0x456',
  };

  beforeEach(() => {
    sandbox.clear();
  });

  test('Estimate', async () => {
    const tx = new Transaction(mockLighthouse, { functionCall });

    const estimate = await tx.estimate();

    expect(estimate).toBe(gasEstimate);
    expect(mockLighthouse.adapter.encodeFunctionCall).toHaveBeenCalledWith(
      functionCall,
    );
    expect(mockLighthouse.adapter.estimate).toHaveBeenCalledWith({
      from: mockLighthouse.wallet.address,
      to: mockLighthouse.contractAddress,
      data: encodedFunctionCall,
      value: 0,
    });
  });

  test('Sign', async () => {
    const tx = new Transaction(mockLighthouse, { functionCall });

    await expect(tx.sign()).rejects.toEqual(new Error('Not yet implemented'));
  });

  test('Send', async () => {
    const signed = 'signed';

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
    mockLighthouse.adapter.sendSignedTransaction.mockImplementation(
      () => eventEmitter,
    );

    const tx = new Transaction(mockLighthouse, { functionCall });

    // not pre signed and fails
    sandbox.spyOn(tx, 'sign').mockImplementation(() => null);

    await expect(tx.send()).rejects.toEqual(
      new Error('Cannot send an unsigned transaction'),
    );

    // not pre signed
    sandbox.spyOn(tx, 'sign').mockImplementation(() => {
      tx._signed = 'signed';
    });

    await tx.send();

    expect(tx.sign).toHaveBeenCalled();

    // pre signed
    tx.sign.mockReset();
    tx._signed = signed;

    await tx.send();

    expect(tx.sign).not.toHaveBeenCalled();

    expect(mockLighthouse.adapter.sendSignedTransaction).toHaveBeenCalledWith(
      signed,
    );

    sandbox.spyOn(tx, 'emit').mockImplementation(() => null);

    // transaction hash
    expect(mockOn).toHaveBeenCalledWith('transactionHash', expect.anything());
    callbacks[0]('hash');
    expect(tx.emit).toHaveBeenCalledWith('transactionHash', 'hash');

    // receipt
    expect(mockOn).toHaveBeenCalledWith('receipt', expect.anything());
    callbacks[1]('receipt');
    expect(tx.emit).toHaveBeenCalledWith('receipt', 'receipt');

    // confirmation
    expect(mockOn).toHaveBeenCalledWith('confirmation', expect.anything());
    callbacks[2]('confirmationNumber', 'receipt');
    expect(tx.emit).toHaveBeenCalledWith(
      'confirmation',
      'confirmationNumber',
      'receipt',
    );

    // error
    expect(mockOn).toHaveBeenCalledWith('error', expect.anything());
    callbacks[3]('error');
    expect(tx.emit).toHaveBeenCalledWith('error', 'error');
  });

  test('To JSON', () => {
    const value = 999;
    const signed = 'signed transaction';
    const receipt = 'receipt';

    const tx = new Transaction(mockLighthouse, { functionCall });

    // bare minimum
    let json = tx.toJSON();

    expect(json).toEqual({
      functionCall,
      gas: null,
      value: 0,
    });

    // everything
    tx._gas = gasEstimate;
    tx._value = value;
    tx._signed = signed;
    tx._receipt = receipt;

    json = tx.toJSON();

    expect(json).toEqual({
      functionCall,
      gas: gasEstimate,
      value,
      signed,
      receipt,
    });
  });

  test('Get function call', () => {
    const tx = new Transaction(mockLighthouse, { functionCall });

    expect(tx.functionCall).toBe(functionCall);
  });

  test('Get gas', () => {
    const tx = new Transaction(mockLighthouse, { functionCall });

    // unspecified
    expect(tx.gas).toBe(null);

    // specified
    tx._gas = 123456;
    expect(tx.gas).toBe(123456);
  });

  test('Set gas', () => {
    BigNumber.isBN
      .mockImplementationOnce(() => false)
      .mockImplementationOnce(() => true)
      .mockImplementationOnce(() => false);

    const tx = new Transaction(mockLighthouse, { functionCall });

    // set with number
    tx.gas = 123456;
    expect(BigNumber).toHaveBeenCalledWith(123456);

    // set with bn
    const bn = { big: 'number' };
    tx.gas = bn;
    expect(BigNumber).toHaveBeenCalledWith(bn);

    // set with not valid
    tx.gas = 'not valid';
    expect(tx._gas).toBe(null);

    // set already signed
    tx._signed = 'signed';
    expect(() => {
      tx.gas = 123456;
    }).toThrow('already signed');
  });

  test('Get value', () => {
    const tx = new Transaction(mockLighthouse, { functionCall });

    // not set
    expect(tx.value).toBe(0);

    // set
    tx._value = 123456;
    expect(tx.value).toBe(123456);
  });

  test('Set value', () => {
    BigNumber.isBN
      .mockImplementationOnce(() => false)
      .mockImplementationOnce(() => true)
      .mockImplementationOnce(() => false);

    const tx = new Transaction(mockLighthouse, { functionCall });

    // set with number
    tx.value = 123456;
    expect(BigNumber).toHaveBeenCalledWith(123456);

    // set with bn
    const bn = { big: 'number' };
    tx.value = bn;
    expect(BigNumber).toHaveBeenCalledWith(bn);

    // set with not valid
    tx.value = 'not valid';
    expect(tx._value).toBe(null);

    // set already signed
    tx._signed = 'signed';
    expect(() => {
      tx.value = 123456;
    }).toThrow('already signed');
  });

  test('Get signed transaction', () => {
    const tx = new Transaction(mockLighthouse, { functionCall });

    // not set
    expect(tx.signed).toBe(null);

    // set
    tx._signed = 'signed';
    expect(tx.signed).toBe('signed');
  });

  test('Get receipt', () => {
    const tx = new Transaction(mockLighthouse, { functionCall });

    // not set
    expect(tx.receipt).toBe(null);

    // set
    tx._receipt = { receipt: true };
    expect(tx.receipt).toEqual({ receipt: true });
  });
});
