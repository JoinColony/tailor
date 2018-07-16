/* @flow */

import type { ContractData } from './Loader';
import type { ParamsSpec } from './Params';

export type MethodSpec = {
  input: ParamsSpec,
  isPayable: boolean,
  name: string,
  output: ParamsSpec,
};

export type EventSpec = {
  name: string,
  output: ParamsSpec,
};

export type ConstantSpec = {
  name: string,
  input: ParamsSpec,
  output: ParamsSpec,
};

export type ContractSpec = {
  contractData: ContractData,
  events: Array<EventSpec>,
  methods: Array<MethodSpec>,
  constants: Array<ConstantSpec>,
};
