/* @flow */

import type {
  FunctionCall,
  Gas,
  SignedTransaction,
  TransactionData,
  TransactionReceipt,
  Wei,
} from '../../interface/Adapter';

type TransactionState = {
  functionCall: FunctionCall,
  gas?: Gas,
  receipt?: TransactionReceipt,
  signed?: SignedTransaction,
  value?: Wei,
};

export type {
  FunctionCall,
  Gas,
  SignedTransaction,
  TransactionData,
  TransactionReceipt,
  TransactionState,
  Wei,
};
