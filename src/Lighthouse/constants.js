/* @flow */

import Loader from '../loaders/Loader';
import TrufflepigLoader from '../loaders/TrufflepigLoader';
import ABIParser from '../parsers/ABIParser';
import HttpLoader from '../loaders/HttpLoader';
import TruffleLoader from '../loaders/TruffleLoader';
import EtherscanLoader from '../loaders/EtherscanLoader';
import FSLoader from '../loaders/FSLoader';
import TruffleParser from '../parsers/TruffleParser';

export const LOADER_NAME_MAP: { [loaderName: string]: Loader.constructor } = {
  [TruffleLoader.name]: TruffleLoader,
  [TrufflepigLoader.name]: TrufflepigLoader,
  [EtherscanLoader.name]: EtherscanLoader,
  [FSLoader.name]: FSLoader,
  [HttpLoader.name]: HttpLoader,
};

export const PARSER_NAME_MAP: {
  [parserName: string]: ABIParser.constructor,
} = {
  [ABIParser.name]: ABIParser,
  [TruffleParser.name]: TruffleParser,
};
