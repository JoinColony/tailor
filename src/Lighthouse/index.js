/* @flow */

import deepmerge from 'deepmerge';

import { LOADER_NAME_MAP, PARSER_NAME_MAP } from './constants';
import { DEFAULT_LOADER, DEFAULT_PARSER } from './defaults';
import Loader from '../loaders/Loader';
import Parser from '../parsers/Parser';

// eslint-disable-next-line import/no-cycle
import Constant from '../modules/Constant';

import type {
  ConstantSpec,
  ConstantSpecs,
  ContractData,
  ContractSpec,
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

  _query: Query;

  _overrides: {
    constants: PartialConstantSpecs,
    events: PartialEventSpecs,
    methods: PartialMethodSpecs,
  };

  constants: {
    [constantName: string]: Constant,
  };

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
    constants = {},
    contractData,
    events = {},
    loader,
    methods = {},
    parser,
    query,
  }: LighthouseArgs = {}) {
    return {
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
      constants,
      contractData,
      events,
      loader,
      methods,
      parser,
      query,
    } = this.constructor.getLighthouseDefaults(args);
    this.loader = loader;
    this.parser = parser;
    this._overrides = { constants, events, methods };
    if (contractData) this._defineContractInterface(contractData);
    this._query = query;
  }

  _getContractSpec(contractData: ContractData): ContractSpec {
    const initialSpecs = this.parser.parse(contractData);
    return deepmerge(initialSpecs, this._overrides, {
      // Arrays should overwrite rather than concatenate
      arrayMerge: (destination, source) => source,
    });
  }

  _defineConstants(constantSpecs: ConstantSpecs): void {
    // $FlowFixMe Still ain't fixed https://github.com/facebook/flow/issues/2221
    this.constants = Object.values(constantSpecs).reduce(
      (acc, spec: ConstantSpec) => {
        acc[spec.name] = new Constant(this, spec);
        return acc;
      },
      {},
    );
  }

  _defineContractInterface(contractData: ContractData) {
    const specs = this._getContractSpec(contractData);
    this._defineConstants(specs.constants);

    // TODO JoinColony/lighthouse/issues/20
    // this._defineEvents(events);

    // TODO JoinColony/lighthouse/issues/21
    // this._defineMethods(methods);

    return specs;
  }

  async initialize(): Promise<void> {
    const contractData = await this.loader.load(this._query);
    this._defineContractInterface(contractData);
  }
}
