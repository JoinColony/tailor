/* @flow */

import Transaction from './Transaction';
import ContractTransaction from './ContractTransaction';
import DeployTransaction from './DeployTransaction';
import MultiSigTransaction from './MultiSigTransaction';

export const DEFAULT_TRANSACTION = ContractTransaction.name;

export const TRANSACTION_NAME_MAP: {
  [transactionName: string]: Transaction.constructor,
} = {
  [Transaction.name]: Transaction,
  [ContractTransaction.name]: ContractTransaction,
  [DeployTransaction.name]: DeployTransaction,
  [MultiSigTransaction.name]: MultiSigTransaction,
};
