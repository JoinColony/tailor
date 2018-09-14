/* @flow */

import type { ParamsSpec } from './Params';
import type { TransactionSpec } from '../modules/transactions/flowtypes';

export type ParamsSpecWithSignatures = {
  [signature: string]: ParamsSpec,
};

export type ParamsSpecWithOptionalSignatures =
  | ParamsSpec
  | ParamsSpecWithSignatures;

export type MethodSpec = {
  input: ParamsSpecWithSignatures,
  isPayable: boolean,
  name: string,
  output: ParamsSpec,
  type: TransactionSpec,
};

export type EventSpec = {
  name: string,
  output: ParamsSpecWithSignatures,
};

export type ConstantSpec = {
  input: ParamsSpecWithSignatures,
  name: string,
  output: ParamsSpec,
};

export type EventSpecs = {
  [eventName: string]: EventSpec,
};

export type MethodSpecs = {
  [methodName: string]: MethodSpec,
};

export type ConstantSpecs = {
  [constantName: string]: ConstantSpec,
};

export type ContractSpec = {
  address: string,
  events: EventSpecs,
  methods: MethodSpecs,
  constants: ConstantSpecs,
};
