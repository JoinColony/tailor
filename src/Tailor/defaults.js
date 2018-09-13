/* @flow */

import type {
  LoaderName,
  ParserName,
  AdapterName,
  WalletName,
} from './flowtypes';

import TruffleLoader from '../loaders/TruffleLoader';
import TruffleParser from '../parsers/TruffleParser';
import Web3Adapter from '../adapters/Web3Adapter';
import Web3Wallet from '../wallets/Web3Wallet';

// TODO later: JoinColony/tailor/issues/16
export const DEFAULT_LOADER: LoaderName = TruffleLoader.name;

// TODO later: JoinColony/tailor/issues/16
export const DEFAULT_PARSER: ParserName = TruffleParser.name;

// TODO later: JoinColony/tailor/issues/16
export const DEFAULT_ADAPTER: AdapterName = Web3Adapter.name;

// TODO later: JoinColony/tailor/issues/16
export const DEFAULT_WALLET: WalletName = Web3Wallet.name;
