/* @flow */

import type {
  FunctionCall,
  SignedTransaction,
  TransactionData,
  TransactionReceipt,
  Wei,
} from '../../interface/Adapter';
import type { Gas } from '../../interface/flowtypes';

type TransactionState = {
  functionCall: FunctionCall,
  gas?: Gas,
  gasPrice?: Wei,
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
