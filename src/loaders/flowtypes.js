/* @flow */

import type { Loader as ILoader, ContractData, Query } from '../interface/Loader';

export type Transform = (jsonObj: Object, query: Query) => ContractData;

export type LoaderArgs = { transform: Transform };

export type HttpLoaderArgs = LoaderArgs & { endpoint: string };

export type FSLoaderArgs = LoaderArgs & { directory: string };

export type EtherscanResponse = {
  status: '0' | '1';
  result: Array<*>; // The ABI
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

export type { ILoader, ContractData, Query };
