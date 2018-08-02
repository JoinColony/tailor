/* @flow */

import deepmerge from 'deepmerge';

import Transaction from '../modules/Transaction';
import constantFactory from '../modules/constantFactory';
import methodFactory from '../modules/methodFactory';
import Event from '../modules/Event';

import { getAdapter, getLoader, getParser, getWallet } from './factory';

import type {
  ConstantSpecs,
  ContractData,
  ContractSpec,
  EventSpecs,
  IAdapter,
  IParser,
  IWallet,
  LighthouseArgs,
  LighthouseCreateArgs,
  MethodSpecs,
  PartialConstantSpecs,
  PartialEventSpecs,
  PartialMethodSpecs,
  WalletSpec,
} from './flowtypes';

export default class Lighthouse {
  adapter: IAdapter;

  parser: IParser;

  wallet: IWallet;

  constants: {
    [constantName: string]: (...params: any) => Promise<Object>,
  };

  events: {
    [eventName: string]: Event,
  };

  methods: {
    [methodName: string]: (...params: any) => Promise<Transaction>,
  };

  contractAddress: string;

  _overrides: {
    constants: PartialConstantSpecs,
    events: PartialEventSpecs,
    methods: PartialMethodSpecs,
  };

  static async create(args: LighthouseCreateArgs = {}): Promise<this> {
    if (!(args.contractData || args.loader))
      throw new Error('Expected either contractData or loader');

    const contractData =
      args.contractData ||
      (await getLoader(args.loader).load(Object.assign({}, args.query)));

    const adapter = getAdapter(args.adapter);
    const parser = getParser(args.parser);
    const wallet = await getWallet(args.wallet);

    await adapter.initialize(contractData);

    return new this({
      adapter,
      parser,
      wallet,
      constants: args.constants,
      events: args.events,
      methods: args.methods,
      contractData,
    });
  }

  constructor({
    adapter,
    parser,
    wallet,
    constants = {},
    events = {},
    methods = {},
    contractData,
  }: LighthouseArgs) {
    this.adapter = adapter;
    this.parser = parser;
    this.wallet = wallet;
    this._overrides = { constants, events, methods };
    this._defineContractInterface(contractData);
  }

  async setWallet(wallet: IWallet | WalletSpec): Promise<IWallet> {
    this.wallet = await getWallet(wallet);
    return this.wallet;
  }

  _getContractSpec(contractData: ContractData): ContractSpec {
    const initialSpecs = this.parser.parse(contractData);
    return deepmerge(initialSpecs, this._overrides, {
      // Arrays should overwrite rather than concatenate
      arrayMerge: (destination, source) => source,
    });
  }

  _defineConstants(specs: ConstantSpecs) {
    const constants = {};
    Object.keys(specs).forEach(name => {
      constants[name] = constantFactory(this, specs[name]);
    });
    Object.assign(this, { constants });
  }

  _defineMethods(specs: MethodSpecs) {
    const methods = {};
    Object.keys(specs).forEach(name => {
      methods[name] = methodFactory(this, specs[name]);
    });
    Object.assign(this, { methods });
  }

  _defineEvents(specs: EventSpecs) {
    const events = {};
    Object.keys(specs).forEach(name => {
      events[name] = new Event(this.adapter, specs[name]);
    });
    Object.assign(this, { events });
  }

  _defineContractInterface(contractData: ContractData) {
    this.contractAddress = contractData.address;

    const spec = this._getContractSpec(contractData);
    this._defineConstants(spec.constants);
    this._defineEvents(spec.events);
    this._defineMethods(spec.methods);

    return spec;
  }
}
