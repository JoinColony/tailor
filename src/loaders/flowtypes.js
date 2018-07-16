/* @flow */

import type {
  ContractData,
  Loader as ILoader,
  Query,
  RequiredContractDataProps,
} from '../interface/Loader';

export type Validator = [(value: *) => boolean, string];

export type { ContractData, ILoader, Query, RequiredContractDataProps };

export type Schema = {
  [fieldName: string]: Validator,
};

export type Transform = (jsonObj: Object, query: Query) => ContractData;

export type LoaderArgs = { transform: Transform };

export type HttpLoaderArgs = LoaderArgs & { endpoint: string };

export type FSLoaderArgs = LoaderArgs & { directory: string };

export type EtherscanResponse = {
  status: '0' | '1',
  result: Array<*>, // The ABI
};

export type TruffleArtifact = {
  abi: Array<{}>,
  bytecode: string,
  networks: {
    [network: string | number]: {
      address: string,
    },
  },
};
