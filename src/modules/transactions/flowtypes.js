/* @flow */

import { TRANSACTION_NAME_MAP } from './constants';

import type {
  Address,
  FunctionArguments,
  FunctionCall,
  Gas,
  Nonce,
  SignedTransaction,
  TransactionData,
  TransactionReceipt,
  TypedEvents,
  Wei,
} from '../../interface/flowtypes';

import type Transaction from './Transaction';

type Confirmations = Array<TransactionReceipt>;

type TransactionState = {
  createdAt: Date,
  deployArgs?: FunctionArguments,
  events?: TypedEvents,
  functionCall?: FunctionCall,
  to?: Address,
  data?: TransactionData,
  confirmations: Confirmations,
  confirmedAt?: Date,
  from?: Address,
  gas?: Gas,
  gasPrice?: Wei,
  receipt?: TransactionReceipt,
  sentAt?: Date,
  hash?: string,
  chainId?: number,
  nonce?: Nonce,
  value: Wei,
};

// eslint does not recognise the Class<T> utility
// eslint-disable-next-line no-undef
type TransactionClass = Class<Transaction>;

type TransactionName = $Values<typeof TRANSACTION_NAME_MAP>;

type TransactionSpec =
  | TransactionClass
  | TransactionName
  | {
      name?: TransactionName,
      class?: TransactionClass,
      options?: Object,
    };

export type {
  Address,
  Confirmations,
  FunctionCall,
  Gas,
  Nonce,
  SignedTransaction,
  TransactionData,
  TransactionReceipt,
  TransactionSpec,
  TransactionState,
  TypedEvents,
  Wei,
};
