/* @flow */

import Transaction from './Transaction';
import ContractTransaction from './ContractTransaction';
import DeployTransaction from './DeployTransaction';
import MultiSigTransaction from './MultiSigTransaction';

export const DEFAULT_TRANSACTION = ContractTransaction.transactionName;

export const TRANSACTION_NAME_MAP: {
  [transactionName: string]: Transaction.constructor,
} = {
  [Transaction.transactionName]: Transaction,
  [ContractTransaction.transactionName]: ContractTransaction,
  [DeployTransaction.transactionName]: DeployTransaction,
  [MultiSigTransaction.transactionName]: MultiSigTransaction,
};
