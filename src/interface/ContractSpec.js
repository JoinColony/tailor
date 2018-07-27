/* @flow */

import type { ParamsSpec } from './Params';

export type MethodSpec = {
  inputs: Array<ParamsSpec>,
  isPayable: boolean,
  name: string,
  output: ParamsSpec,
};

export type EventSpec = {
  name: string,
  outputs: Array<ParamsSpec>,
};

export type ConstantSpec = {
  name: string,
  inputs: Array<ParamsSpec>,
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
  inputs?: Array<ParamsSpec>,
  isPayable?: boolean,
  name?: string,
  output?: ParamsSpec,
};

export type PartialEventSpec = {
  name?: string,
  outputs?: Array<ParamsSpec>,
};

export type PartialConstantSpec = {
  name?: string,
  inputs?: Array<ParamsSpec>,
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
