/* @flow */

import type { Address } from '../interface/flowtypes';

import type {
  ContractData,
  GenericQuery,
  RequiredContractDataProps,
} from '../interface/Loader';

export type { ILoader } from '../interface/Loader';

export type Validator = [(value: *) => boolean, string];

export type { ContractData, GenericQuery, RequiredContractDataProps };

export type Schema = {
  [fieldName: string]: Validator,
};

export type Transform = (jsonObj: Object, query: GenericQuery) => ContractData;

export type LoaderArgs = { transform: Transform };

export type HttpLoaderArgs = LoaderArgs & { endpoint: string };

export type FSLoaderArgs = LoaderArgs & { directory: string };

export type EtherscanQuery = {
  contractAddress: Address,
};

export type EtherscanResponse = {
  status: '0' | '1',
  result: Array<*>, // The ABI
};

export type TruffleArtifact = {
  abi: Array<{}>,
  bytecode: string,
  networks: {
    [network: string | number]: {
      address: Address,
    },
  },
};
