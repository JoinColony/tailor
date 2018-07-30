// @flow
import type BigNumber from 'bn.js';
import type PromiEvent from 'web3-core-promievent';
import type EventEmitter from 'eventemitter3';

import type { ContractData } from './Loader';

export type Address = string;

export type FunctionSignature = string; // myFunction(uint256,bool)

export type FunctionArguments = Array<*>;

export type FunctionCall = {
  functionSignature: FunctionSignature,
  args: FunctionArguments,
};

export type TransactionData = string;

export type EstimateOptions = {
  from?: Address,
  to?: Address,
  data?: TransactionData,
  gas?: number,
  value?: number,
};

export type GasEstimate = number;

export type SignedTransaction = string;

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
  args: {
    [paramIndexOrName: number | string]: *,
    length: number,
  },
  event: string, // 'MyEvent'
  eventSignature: EventSignature,
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

export type FunctionCallResult = Array<*>;

export type SubscriptionOptions = {
  address?: Address, // defaults to _address
  event?: EventSignature, // all events if omitted
};

export interface IAdapter {
  initialize(contractData: ContractData): void;

  encodeDeploy(args: FunctionArguments): TransactionData;
  encodeFunctionCall(functionCall: FunctionCall): TransactionData;
  decodeFunctionCallData(functionCallData: TransactionData): FunctionCall;

  estimate(options: EstimateOptions): Promise<GasEstimate>;
  sendSignedTransaction(
    transaction: SignedTransaction,
  ): PromiEvent<TransactionReceipt>;

  call(functionCall: FunctionCall): Promise<FunctionCallResult>;

  subscribe(options: SubscriptionOptions): Promise<EventEmitter>;

  getCurrentNetwork(): Promise<number>;
}
