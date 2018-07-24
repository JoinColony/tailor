/* @flow */

import type { ILoader, ContractData, Query } from '../interface/Loader';
import type { IParser } from '../interface/Parser';
import type {
  ConstantSpec,
  ConstantSpecs,
  ContractSpec,
  EventSpecs,
  MethodSpecs,
  PartialConstantSpecs,
  PartialEventSpecs,
  PartialMethodSpecs,
} from '../interface/ContractSpec';

import { LOADER_NAME_MAP, PARSER_NAME_MAP } from './constants';

export type { IAdapter } from '../interface/Adapter';

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
  contractData?: ContractData,
  constants?: PartialConstantSpecs,
  events?: PartialEventSpecs,
  loader?: ILoader | LoaderSpec,
  methods?: PartialMethodSpecs,
  parser?: IParser | ParserSpec,
  query: Query,
};

export type {
  ConstantSpec,
  ConstantSpecs,
  ContractData,
  ContractSpec,
  EventSpecs,
  ILoader,
  IParser,
  MethodSpecs,
  PartialConstantSpecs,
  PartialEventSpecs,
  PartialMethodSpecs,
  Query,
};
