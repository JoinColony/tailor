/* eslint-env jest */

import createSandbox from 'jest-sandbox';

import * as tx from '../index';
import Transaction from '../Transaction';
import ContractTransaction from '../ContractTransaction';
import MultiSigTransaction from '../MultiSigTransaction';
import DeployTransaction from '../DeployTransaction';

describe('Transactions', () => {
  const sandbox = createSandbox();

  beforeEach(() => {
    sandbox.clear();
  });

  test('Getting transaction from name', () => {
    // transaction
    expect(tx.getTransactionFromName('transaction')).toBe(Transaction);

    // contract
    expect(tx.getTransactionFromName('contract')).toBe(ContractTransaction);

    // multisig
    expect(tx.getTransactionFromName('multisig')).toBe(MultiSigTransaction);

    // deploy
    expect(tx.getTransactionFromName('deploy')).toBe(DeployTransaction);

    // invalid
    expect(() => tx.getTransactionFromName('faketx')).toThrow('not found');
  });

  test('Is transaction class', () => {
    expect(tx.isTransactionClass(Transaction)).toBe(true);
    expect(tx.isTransactionClass(MultiSigTransaction)).toBe(true);
    expect(tx.isTransactionClass({ getMethodFn: () => {} })).toBe(false);
  });

  test('Getting transaction from spec', () => {
    const Tx = 'tx';
    const name = 'txName';
    const options = { my: 'options' };

    // already Tx
    sandbox.spyOn(tx, 'isTransactionClass').mockReturnValueOnce(true);
    expect(tx.getTransaction(Tx)).toEqual({ class: Tx });

    // name only
    sandbox.spyOn(tx, 'getTransactionFromName').mockReturnValue(Tx);
    expect(tx.getTransaction(name)).toEqual({ class: Tx });

    // name object, no options
    expect(tx.getTransaction({ name })).toEqual({ class: Tx });

    // name object, options
    expect(tx.getTransaction({ name, options })).toEqual({
      class: Tx,
      options,
    });

    // class object, no options
    tx.isTransactionClass.mockReturnValueOnce(false).mockReturnValueOnce(true);
    expect(tx.getTransaction({ class: Tx })).toEqual({ class: Tx });

    // class object, options
    tx.isTransactionClass.mockReturnValueOnce(false).mockReturnValueOnce(true);
    expect(tx.getTransaction({ class: Tx, options })).toEqual({
      class: Tx,
      options,
    });

    // no args
    expect(tx.getTransaction()).toEqual({ class: Tx });
    expect(tx.getTransactionFromName).toHaveBeenCalledWith('contract');

    // invalid
    expect(() => tx.getTransaction({ bad: 'bad' })).toThrow(
      'Invalid Transaction specification',
    );
  });
});
