/* @flow */

import Adapter from '../adapters/Adapter';
import Web3Adapter from '../adapters/Web3Adapter';
import Loader from '../loaders/Loader';
import TrufflepigLoader from '../loaders/TrufflepigLoader';
import ABIParser from '../parsers/ABIParser';
import HttpLoader from '../loaders/HttpLoader';
import TruffleLoader from '../loaders/TruffleLoader';
import EtherscanLoader from '../loaders/EtherscanLoader';
import FSLoader from '../loaders/FSLoader';
import TruffleParser from '../parsers/TruffleParser';
import Wallet from '../wallets/Wallet';
import Web3Wallet from '../wallets/Web3Wallet';

export const ADAPTER_NAME_MAP: {
  [adapterName: string]: Adapter.constructor,
} = {
  [Web3Adapter.name]: Web3Adapter,
};

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

export const WALLET_NAME_MAP: {
  [walletName: string]: Wallet.constructor,
} = {
  [Web3Wallet.name]: Web3Wallet,
};
