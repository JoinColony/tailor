/* @flow */

import type { ILoader, ContractData, Query } from '../interface/Loader';
import type { IAdapter } from '../interface/Adapter';
import type { IParser } from '../interface/Parser';
import type {
  ConstantSpecs,
  ContractSpec,
  EventSpecs,
  MethodSpecs,
  PartialConstantSpecs,
  PartialEventSpecs,
  PartialMethodSpecs,
} from '../interface/ContractSpec';

import {
  ADAPTER_NAME_MAP,
  LOADER_NAME_MAP,
  PARSER_NAME_MAP,
} from './constants';

export type AdapterName = $Keys<typeof ADAPTER_NAME_MAP>;

export type AdapterSpec = {
  name?: AdapterName,
  options?: Object,
};

export type LoaderName = $Keys<typeof LOADER_NAME_MAP>;

export type LoaderSpec = {
  name?: LoaderName,
  options?: Object,
};

export type ParserName = $Keys<typeof PARSER_NAME_MAP>;

export type ParserSpec = {
  name?: ParserName,
  options?: Object,
};

export type LighthouseArgs = {
  adapter?: IAdapter | AdapterSpec,
  contractData?: ContractData,
  constants?: PartialConstantSpecs,
  events?: PartialEventSpecs,
  loader?: ILoader | LoaderSpec,
  methods?: PartialMethodSpecs,
  parser?: IParser | ParserSpec,
  query: Query,
};

export type {
  ConstantSpecs,
  ContractData,
  ContractSpec,
  EventSpecs,
  IAdapter,
  ILoader,
  IParser,
  MethodSpecs,
  PartialConstantSpecs,
  PartialEventSpecs,
  PartialMethodSpecs,
  Query,
};
