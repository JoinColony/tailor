/* @flow */

import type BigNumber from 'bn.js';

export type Address = string;

export type Gas = BigNumber;

export type Nonce = BigNumber;

export type SignedTransaction = string;

export type TransactionData = string;

export type Wei = BigNumber;

export type FunctionSignature = string; // myFunction(uint256,bool)

export type FunctionArguments = Array<*>;

export type FunctionCallResult = Array<*>;

export type FunctionCall = {
  functionSignature: FunctionSignature,
  args: FunctionArguments,
};

export type UnsignedTransaction = {
  data?: TransactionData,
  from?: Address,
  gas?: Gas,
  gasPrice?: number,
  chainId?: number,
  nonce?: Nonce,
  to?: Address,
  value?: Wei,
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
  events: { [string]: Array<Event> },
};

export type SubscriptionOptions = {
  address?: Address, // defaults to _address
  event?: EventSignature, // all events if omitted
};

export type TypedEvent = {
  signature: EventSignature,
  event: Event,
  data: Object,
  name: string,
};

export type TypedEvents = Array<TypedEvent>;
