/* @flow */

export type Query = {
  contractAddress?: string,
  contractName?: string,
  routerAddress?: string,
  routerName?: string,
  version?: string,
  network?: string,
};

export type ContractData = {
  address?: string,
  abi?: Array<*>,
  bytecode?: string,
};

export type RequiredContractDataProps = {
  address?: boolean,
  abi?: boolean,
  bytecode?: boolean,
};

export interface Loader {
  loadContractData(
    query: Query,
    props?: RequiredContractDataProps,
  ): Promise<Object>;
  load(query: Query, props?: RequiredContractDataProps): Promise<ContractData>;
}
