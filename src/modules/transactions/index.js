/* @flow */

import Transaction from './Transaction';

import type { TransactionSpec } from './flowtypes';
import { TRANSACTION_NAME_MAP, DEFAULT_TRANSACTION } from './constants';

const assert = require('assert');

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
