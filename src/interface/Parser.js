/* @flow */

import type { ContractData } from './Loader';

import type { ContractSpec } from './ContractSpec';

export interface Parser {
  parse(contractData: ContractData): ContractSpec;
}
