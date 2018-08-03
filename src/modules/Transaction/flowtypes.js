/* @flow */

import type {
  FunctionCall,
  SignedTransaction,
  TransactionData,
  TransactionReceipt,
  Wei,
} from '../../interface/Adapter';
import type { Gas, Address } from '../../interface/flowtypes';

type TransactionState = {
  from?: Address,
  functionCall: FunctionCall,
  gas?: Gas,
  gasPrice?: Wei,
  receipt?: TransactionReceipt,
  signed?: SignedTransaction,
  to?: Address,
  value?: Wei,
};

export type {
  Address,
  FunctionCall,
  Gas,
  SignedTransaction,
  TransactionData,
  TransactionReceipt,
  TransactionState,
  Wei,
};
