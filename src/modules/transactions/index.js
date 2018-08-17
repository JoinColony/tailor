/* @flow */

import Transaction from './Transaction';
// eslint-disable-next-line import/no-cycle
import ContractTransaction from './ContractTransaction';
import DeployTransaction from './DeployTransaction';
import MultiSigTransaction from './MultiSigTransaction';

import type { TransactionSpec } from './flowtypes';

const assert = require('assert');

export const DEFAULT_TRANSACTION = ContractTransaction.name;

export const TRANSACTION_NAME_MAP: {
  [transactionName: string]: Transaction.constructor,
} = {
  [Transaction.name]: Transaction,
  [ContractTransaction.name]: ContractTransaction,
  [DeployTransaction.name]: DeployTransaction,
  [MultiSigTransaction.name]: MultiSigTransaction,
};

export function getTransactionFromName(name: string) {
  assert(
    Object.hasOwnProperty.call(TRANSACTION_NAME_MAP, name),
    `Transaction type with name "${name}" not found`,
  );

  return TRANSACTION_NAME_MAP[name];
}

export function getTransaction(spec: TransactionSpec = DEFAULT_TRANSACTION) {
  if (spec instanceof Transaction) return spec;

  if (typeof spec === 'string') return getTransactionFromName(spec);

  throw Error('Invalid Transaction specification.');
}
