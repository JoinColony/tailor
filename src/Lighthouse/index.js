/* @flow */

import deepmerge from 'deepmerge';

import {
  LOADER_NAME_MAP,
  PARSER_NAME_MAP,
  ADAPTER_NAME_MAP,
} from './constants';
import { DEFAULT_LOADER, DEFAULT_PARSER, DEFAULT_ADAPTER } from './defaults';
import Adapter from '../adapters/Adapter';
import Loader from '../loaders/Loader';
import Parser from '../parsers/Parser';
import constantFactory from '../modules/constantFactory';

import type {
  AdapterName,
  AdapterSpec,
  ConstantSpecs,
  ContractData,
  IAdapter,
  ILoader,
  IParser,
  LighthouseArgs,
  LoaderName,
  LoaderSpec,
  ParserName,
  ParserSpec,
  PartialConstantSpecs,
  PartialEventSpecs,
  PartialMethodSpecs,
  Query,
} from './flowtypes';

const assert = require('assert');

export default class Lighthouse {
  adapter: IAdapter;

  loader: ILoader;

  parser: IParser;

  constants: {
    [constantName: string]: (...params: any) => Promise<Object>,
  };

  _query: Query;

  _overrides: {
    constants: PartialConstantSpecs,
    events: PartialEventSpecs,
    methods: PartialMethodSpecs,
  };

  // TODO JoinColony/lighthouse/issues/16
  static getAdapter(
    // TODO default adapter options doesn't include a web3 instance...
    input: IAdapter | AdapterSpec | AdapterName = DEFAULT_ADAPTER,
  ): IAdapter {
    if (!input) throw new Error('Expected an adapter option');

    if (input instanceof Adapter) return input;

    let name: AdapterName = '';
    let options;
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
  static getLoader(
    input: ILoader | LoaderSpec | LoaderName = DEFAULT_LOADER,
  ): ILoader {
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
  static getParser(
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

  static getLighthouseDefaults({
    adapter,
    constants = {},
    contractData,
    events = {},
    loader,
    methods = {},
    parser,
    query,
  }: LighthouseArgs = {}) {
    return {
      adapter: this.getAdapter(adapter),
      constants,
      contractData,
      events,
      loader: this.getLoader(loader),
      methods,
      parser: this.getParser(parser),
      query,
    };
  }

  constructor(args: LighthouseArgs) {
    const {
      adapter,
      constants,
      contractData,
      events,
      loader,
      methods,
      parser,
      query,
    } = this.constructor.getLighthouseDefaults(args);
    this.adapter = adapter;
    this.loader = loader;
    this.parser = parser;
    this._overrides = { constants, events, methods };
    if (contractData) this._defineContractInterface(contractData);
    this._query = query;
  }

  _getContractSpec(contractData: ContractData) {
    const initialSpecs = this.parser.parse(contractData);
    return deepmerge(initialSpecs, this._overrides, {
      // Arrays should overwrite rather than concatenate
      arrayMerge: (destination, source) => source,
    });
  }

  _defineConstants(specs: ConstantSpecs) {
    const constants = {};
    Object.keys(specs).forEach(name => {
      constants[name] = constantFactory.call(this, specs[name]);
    });
    Object.assign(this, { constants });
  }

  _defineContractInterface(contractData: ContractData) {
    const specs = this._getContractSpec(contractData);

    this._defineConstants(specs.constants);

    // TODO JoinColony/lighthouse/issues/20
    // this._defineEvents(events);

    // TODO JoinColony/lighthouse/issues/21
    // this._defineMethods(methods);

    // TODO once events and methods are also defined, do not return anything.
    // Just for testing purposes.
    return specs;
  }

  async initialize() {
    const contractData = await this.loader.load(this._query);
    this.adapter.initialize(contractData);
    this._defineContractInterface(contractData);
  }
}
