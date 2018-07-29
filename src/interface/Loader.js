/* @flow */

import type { Address } from './flowtypes';

export type GenericQuery = {
  contractAddress?: Address,
  contractName?: string,
  routerAddress?: Address,
  routerName?: string,
  version?: string,
  network?: string,
};

export type ContractData = {
  address: Address,
  abi?: Array<*>,
  bytecode?: string,
};

export type RequiredContractDataProps = {
  address?: boolean,
  abi?: boolean,
  bytecode?: boolean,
};

export interface ILoader<Query: GenericQuery> {
  loadContractData(
    query: Query,
    props?: RequiredContractDataProps,
  ): Promise<Object>;
  load(query: Query, props?: RequiredContractDataProps): Promise<ContractData>;
}
