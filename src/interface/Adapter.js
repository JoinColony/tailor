/* @flow */

import type { PromiEventEmitter } from 'web3-core-promievent';
import type EventEmitter from 'eventemitter3';

import type { ContractData } from './Loader';
import type {
  Address,
  EstimateOptions,
  FunctionArguments,
  FunctionCall,
  FunctionCallResult,
  Gas,
  Nonce,
  SubscriptionOptions,
  TransactionData,
  TransactionReceipt,
  UnsignedTransaction,
} from './flowtypes';
import type { IWallet } from './Wallet';

export interface IAdapter {
  wallet: IWallet;

  initialize(contractData: ContractData): void;

  encodeDeploy(args: FunctionArguments): TransactionData;
  encodeFunctionCall(functionCall: FunctionCall): TransactionData;
  decodeFunctionCallData(functionCallData: TransactionData): FunctionCall;

  estimate(options: EstimateOptions): Promise<Gas>;

  getNonce(address?: Address): Promise<Nonce>;

  getSendTransaction(
    unsignedTransaction: UnsignedTransaction,
  ): Promise<() => PromiEventEmitter<TransactionReceipt>>;

  call(functionCall: FunctionCall): Promise<FunctionCallResult>;

  subscribe(options: SubscriptionOptions): EventEmitter;

  getCurrentNetwork(): Promise<number>;
  getGasPrice(): Promise<Gas>;
}
