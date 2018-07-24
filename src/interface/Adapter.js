// @flow
import type BigNumber from 'bn.js';
import type PromiEvent from 'web3-core-promievent';
import type EventEmitter from 'eventemitter3';

import type { ContractData } from './Loader';

export type Address = string;

export type FunctionCall = {
  method: string,
  parameters: Array<any>,
};

export type FunctionCallData = string;

export type GasEstimate = number;

export type SignedTransaction = string;

export type Event = {
  blockNumber: number,
  blockHash: string,
  transactionIndex: number,
  address: string, // contract address
  data: string,
  topics: Array<string>, // topic hashes
  transactionHash: string,
  logIndex: number,
  args: {
    [paramIndexOrName: number | string]: *,
    length: number,
  },
  event: string, // 'MyEvent'
  eventSignature: string, // 'MyEvent(uint8)'
};

export type TransactionReceipt = {
  blockHash: string,
  blockNumber: number,
  contractAddress: string | null,
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

export type FunctionCallResult = { [string | number]: any };

export type SubscriptionOptions = {
  address?: Address, // defaults to _address
  event?: string, // all events if omitted
};

export interface IAdapter {
  initialize(contractData: ContractData): void;

  encodeFunctionCall(functionCall: FunctionCall): FunctionCallData;
  decodeFunctionCallData(functionCallData: FunctionCallData): FunctionCall;

  estimate(functionCall: FunctionCall): Promise<GasEstimate>;
  sendSignedTransaction(
    transaction: SignedTransaction,
  ): PromiEvent<TransactionReceipt>;

  call(functionCall: FunctionCall): Promise<FunctionCallResult>;

  subscribe(options: SubscriptionOptions): Promise<EventEmitter>;
}
