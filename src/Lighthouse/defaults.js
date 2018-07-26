/* @flow */

import type { LoaderName, ParserName, AdapterName } from './flowtypes';

import TruffleLoader from '../loaders/TruffleLoader';
import TruffleParser from '../parsers/TruffleParser';
import Web3Adapter from '../adapters/Web3Adapter';

// TODO later: JoinColony/lighthouse/issues/16
export const DEFAULT_LOADER: LoaderName = TruffleParser.name;

// TODO later: JoinColony/lighthouse/issues/16
export const DEFAULT_PARSER: ParserName = TruffleLoader.name;

// TODO later: JoinColony/lighthouse/issues/16
export const DEFAULT_ADAPTER: AdapterName = Web3Adapter.name;
