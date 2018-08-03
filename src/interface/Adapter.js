// @flow
import type BigNumber from 'bn.js';
import type { PromiEventEmitter } from 'web3-core-promievent';
import type EventEmitter from 'eventemitter3';

import type { ContractData } from './Loader';
import type { Address, Gas } from './flowtypes';

export type FunctionSignature = string; // myFunction(uint256,bool)

export type FunctionArguments = Array<*>;
export type Wei = BigNumber;
export type TransactionData = string;
export type SignedTransaction = string;
export type FunctionCallResult = Array<*>;

export type FunctionCall = {
  functionSignature: FunctionSignature,
  args: FunctionArguments,
};

export type EstimateOptions = {
  from?: Address,
  to?: Address,
  data?: TransactionData,
  gas?: Gas,
  value?: Wei,
};

export type EventSignature = string; // 'MyEvent(uint8)'

export type Event = {
  blockNumber: number,
  blockHash: string,
  transactionIndex: number,
  address: Address, // contract address
  data: string,
  topics: Array<string>, // topic hashes
  transactionHash: string,
  logIndex: number,
  returnValues: {
    [paramIndexOrName: number | string]: *,
    length: number,
  },
  event: string, // 'MyEvent'
  signature: string, // hashed event signature
};

export type TransactionReceipt = {
  blockHash: string,
  blockNumber: number,
  contractAddress: Address | null,
  cumulativeGasUsed: BigNumber,
  gasUsed: BigNumber,
  hash: string,
  log: Array<*>,
  logsBloom: string,
  root: string,
  status: number, // 0 => failure, 1 => success
  transactionHash: string,
  transactionIndex: number,
  events: { [String]: Event },
};

export type SubscriptionOptions = {
  address?: Address, // defaults to _address
  event?: EventSignature, // all events if omitted
};

export interface IAdapter {
  initialize(contractData: ContractData): void;

  encodeDeploy(args: FunctionArguments): TransactionData;
  encodeFunctionCall(functionCall: FunctionCall): TransactionData;
  decodeFunctionCallData(functionCallData: TransactionData): FunctionCall;

  estimate(options: EstimateOptions): Promise<Gas>;
  sendSignedTransaction(
    transaction: SignedTransaction,
  ): PromiEventEmitter<TransactionReceipt>;

  call(functionCall: FunctionCall): Promise<FunctionCallResult>;

  subscribe(options: SubscriptionOptions): EventEmitter;

  getCurrentNetwork(): Promise<number>;
  getGasPrice(): Promise<Gas>;
}
