/* @flow */

import type { LoaderName, ParserName } from './flowtypes';

import TruffleLoader from '../loaders/TruffleLoader';
import TruffleParser from '../parsers/TruffleParser';

// TODO later: JoinColony/lighthouse/issues/16
export const DEFAULT_LOADER: LoaderName = TruffleParser.name;

// TODO later: JoinColony/lighthouse/issues/16
export const DEFAULT_PARSER: ParserName = TruffleLoader.name;
