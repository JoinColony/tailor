/* @flow */

import type { ContractData } from './Loader';

import type { ContractSpec } from './ContractSpec';

export interface IParser {
  parse(contractData: ContractData): ContractSpec;
}
