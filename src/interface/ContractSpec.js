/* @flow */

import type { ParamsSpec } from './Params';
import type { FunctionSignature, EventSignature } from './Adapter';

export type FunctionParams = {
  [functionSig: FunctionSignature]: ParamsSpec,
};

export type EventParams = {
  [eventSig: EventSignature]: ParamsSpec,
};

export type MethodSpec = {
  input: FunctionParams,
  isPayable: boolean,
  name: string,
  output: ParamsSpec,
};

export type EventSpec = {
  name: string,
  output: EventParams,
};

export type ConstantSpec = {
  input: FunctionParams,
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

export type PartialMethodSpec = {
  input?: FunctionParams,
  isPayable?: boolean,
  name?: string,
  output?: ParamsSpec,
};

export type PartialEventSpec = {
  name?: string,
  output?: EventParams,
};

export type PartialConstantSpec = {
  name?: string,
  input?: FunctionParams,
  output?: ParamsSpec,
};

export type PartialEventSpecs = {
  [eventName: string]: Array<PartialEventSpec>,
};

export type PartialMethodSpecs = {
  [methodName: string]: Array<PartialMethodSpec>,
};

export type PartialConstantSpecs = {
  [constantName: string]: Array<PartialConstantSpec>,
};

export type ContractSpec = {
  address: string,
  events: EventSpecs,
  methods: MethodSpecs,
  constants: ConstantSpecs,
};
