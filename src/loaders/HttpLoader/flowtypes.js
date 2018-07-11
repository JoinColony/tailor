/* @flow */

import type { ContractData, Query } from '../../interface/Loader';

export type Transform = (jsonObj: Object, query: Query) => ContractData;

export type ConstructorArgs = { endpoint: string, transform: Transform };
