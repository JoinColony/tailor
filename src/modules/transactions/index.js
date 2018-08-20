/* @flow */

import Transaction from './Transaction';
import Adapter from '../../adapters/Adapter';

import type { TransactionSpec } from './flowtypes';
import { TRANSACTION_NAME_MAP, DEFAULT_TRANSACTION } from './constants';

const assert = require('assert');

// eslint doesn't recognise Flow's Class
// eslint-disable-next-line no-undef
type GetTransactionReturn = { class: Class<Transaction>, options?: any };

export function getTransactionFromName(name: string) {
  assert(
    Object.hasOwnProperty.call(TRANSACTION_NAME_MAP, name),
    `Transaction type with name "${name}" not found`,
  );

  return TRANSACTION_NAME_MAP[name];
}

export function isTransactionClass(F: any) {
  try {
    const instance = new F(new Adapter(), {});
    if (instance instanceof Transaction) return true;
  } catch (error) {
    //
  }
  return false;
}

export function getTransaction(
  spec: TransactionSpec = DEFAULT_TRANSACTION,
): GetTransactionReturn {
  // $FlowFixMe we've checked it's a Transaction class
  if (isTransactionClass(spec)) return { class: spec };

  if (typeof spec === 'string') return { class: getTransactionFromName(spec) };

  if (spec.name) {
    return {
      class: getTransactionFromName(spec.name),
      options: spec.options || undefined,
    };
  }

  if (spec.class) {
    return {
      // $FlowFixMe
      class: spec.class,
      options: spec.options || undefined,
    };
  }

  throw Error('Invalid Transaction specification.');
}
