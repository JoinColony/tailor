/* @flow */

import {
  LOADER_NAME_MAP,
  PARSER_NAME_MAP,
  ADAPTER_NAME_MAP,
  WALLET_NAME_MAP,
} from './constants';
import {
  DEFAULT_LOADER,
  DEFAULT_PARSER,
  DEFAULT_ADAPTER,
  DEFAULT_WALLET,
} from './defaults';
import Adapter from '../adapters/Adapter';
import Loader from '../loaders/Loader';
import Parser from '../parsers/Parser';
import Wallet from '../wallets/Wallet';

import type {
  AdapterName,
  AdapterSpec,
  IAdapter,
  ILoader,
  IParser,
  IWallet,
  LoaderName,
  LoaderSpec,
  ParserName,
  ParserSpec,
  WalletName,
  WalletSpec,
} from './flowtypes';

const assert = require('assert');

// TODO JoinColony/lighthouse/issues/16
export function getAdapter(
  // TODO default adapter options doesn't include a web3 instance...
  input: IAdapter | AdapterSpec | AdapterName = DEFAULT_ADAPTER,
): IAdapter {
  if (!input) throw new Error('Expected an adapter option');

  if (input instanceof Adapter) return input;

  let name: AdapterName = '';
  let options = {};
  if (typeof input === 'string') {
    name = input;
  } else {
    const spec: AdapterSpec = input;
    ({ name = '', options } = spec);
  }

  assert(
    Object.hasOwnProperty.call(ADAPTER_NAME_MAP, name),
    `Adapter with name "${name}" not found`,
  );

  return new ADAPTER_NAME_MAP[name](options);
}

// TODO JoinColony/lighthouse/issues/16
export function getLoader(
  input: ILoader<*> | LoaderSpec | LoaderName = DEFAULT_LOADER,
): ILoader<*> {
  if (!input) throw new Error('Expected a loader option');

  if (input instanceof Loader) return input;

  let name: LoaderName = '';
  let options;
  if (typeof input === 'string') {
    name = input;
  } else {
    const spec: LoaderSpec = input;
    ({ name = '', options } = spec);
  }

  assert(
    Object.hasOwnProperty.call(LOADER_NAME_MAP, name),
    `Loader with name "${name}" not found`,
  );
  return new LOADER_NAME_MAP[name](options);
}

// TODO JoinColony/lighthouse/issues/16
export function getParser(
  input: IParser | ParserSpec | ParserName = DEFAULT_PARSER,
): IParser {
  if (!input) throw new Error('Expected a parser option');

  if (input instanceof Parser) return input;

  let name: ParserName = '';
  let options;
  if (typeof input === 'string') {
    name = input;
  } else {
    const spec: ParserSpec = input;
    ({ name = '', options } = spec);
  }

  assert(
    Object.hasOwnProperty.call(PARSER_NAME_MAP, name),
    `Parser with name "${name}" not found`,
  );
  return new PARSER_NAME_MAP[name](options);
}

// TODO JoinColony/lighthouse/issues/16
export async function getWallet(
  input: IWallet | WalletSpec | WalletName = DEFAULT_WALLET,
): Promise<IWallet> {
  if (!input) throw new Error('Expected a wallet option');

  if (input instanceof Wallet) return Promise.resolve(input);

  let name: WalletName = '';
  let options;
  if (typeof input === 'string') {
    name = input;
  } else {
    const spec: WalletSpec = input;
    ({ name = '', options } = spec);
  }

  assert(
    Object.hasOwnProperty.call(WALLET_NAME_MAP, name),
    `Wallet with name "${name}" not found`,
  );
  return WALLET_NAME_MAP[name].open(options);
}
