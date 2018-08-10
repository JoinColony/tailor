/* @flow */

import type {
  Address,
  FunctionCall,
  Gas,
  Nonce,
  SignedTransaction,
  TransactionData,
  TransactionReceipt,
  TypedEvents,
  Wei,
} from '../../interface/flowtypes';

type Confirmations = Array<TransactionReceipt>;

type TransactionState = {
  createdAt: Date,
  events: TypedEvents,
  functionCall: FunctionCall,
  to: Address,
  data: TransactionData,
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

export type {
  Address,
  Confirmations,
  FunctionCall,
  Gas,
  Nonce,
  SignedTransaction,
  TransactionData,
  TransactionReceipt,
  TransactionState,
  TypedEvents,
  Wei,
};
