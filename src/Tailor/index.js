/* @flow */

import constantFactory from '../modules/constantFactory';
import Event from '../modules/Event';
import methodFactory from '../modules/methodFactory';
import DeployTransaction from '../modules/transactions/DeployTransaction';
import { mergeOverrides, mergeSpec } from '../modules/utils';
import { getAdapter, getLoader, getParser, getWallet } from './factory';
import { PARAM_TYPE_NAME_MAP } from '../modules/paramTypes';

import type Transaction from '../modules/transactions/Transaction';
import type {
  ConstantSpecs,
  ContractData,
  ContractSpec,
  EventSpecs,
  IAdapter,
  IParser,
  IWallet,
  TailorArgs,
  TailorCreateArgs,
  MethodSpecs,
  PartialConstantSpecs,
  PartialEventSpecs,
  PartialMethodSpecs,
  WalletSpec,
} from './flowtypes';

export default class Tailor {
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

  _contractData: ContractData;

  _overrides: {
    constants: PartialConstantSpecs,
    events: PartialEventSpecs,
    methods: PartialMethodSpecs,
  };

  static async getConstructorArgs({
    contractData: providedContractData,
    loader,
    adapter: providedAdapter,
    parser: providedParser,
    wallet: providedWallet,
    constants,
    events,
    methods,
    query,
    ...helpers
  }: TailorCreateArgs = {}): Promise<TailorArgs> {
    if (!(providedContractData || loader))
      throw new Error('Expected either contractData or loader');

    const contractData =
      providedContractData ||
      (await getLoader(loader).load(Object.assign({}, query)));

    const parser = getParser(providedParser);
    const wallet = await getWallet(providedWallet);
    const adapter = getAdapter(providedAdapter, wallet);

    await adapter.initialize(contractData);

    return {
      adapter,
      parser,
      wallet,
      constants,
      events,
      methods,
      contractData,
      helpers,
    };
  }

  static async load(args: TailorCreateArgs = {}): Promise<this> {
    return new this(await this.getConstructorArgs(args));
  }

  static async deploy(
    args: TailorCreateArgs & {
      deployArgs?: Array<any>,
    } & Object = {},
  ): Promise<this> {
    const constructorArgs = await this.getConstructorArgs(args);
    const tx = new DeployTransaction(constructorArgs.adapter, args);
    await tx.send();

    if (!(tx.receipt && tx.receipt.contractAddress))
      throw new Error('Unable to deploy contract');

    // set contract address, reinitialize adapter
    constructorArgs.contractData.address = tx.receipt.contractAddress;
    await constructorArgs.adapter.initialize(constructorArgs.contractData);

    return new this(constructorArgs);
  }

  constructor({
    adapter,
    parser,
    wallet,
    constants = {},
    events = {},
    methods = {},
    contractData,
    helpers,
  }: TailorArgs) {
    this.adapter = adapter;
    this.parser = parser;
    this.wallet = wallet;
    this._overrides = { constants, events, methods };
    this._contractData = contractData;
    this._defineContractInterface();
    this._defineHelpers(helpers);
  }

  async setWallet(wallet: IWallet | WalletSpec): Promise<IWallet> {
    this.wallet = await getWallet(wallet);
    return this.wallet;
  }

  extend({ constants = {}, events = {}, methods = {}, ...helpers }: Object) {
    this._overrides = mergeOverrides(this._overrides, {
      constants,
      events,
      methods,
    });
    this._defineContractInterface();
    this._defineHelpers(helpers);
  }

  _getContractSpec(contractData: ContractData): ContractSpec {
    const initialSpecs = this.parser.parse(contractData);
    return mergeSpec(initialSpecs, this._overrides);
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

  _defineContractInterface() {
    this.contractAddress = this._contractData.address;

    const spec = this._getContractSpec(this._contractData);
    this._defineConstants(spec.constants);
    this._defineEvents(spec.events);
    this._defineMethods(spec.methods);

    return spec;
  }

  _defineHelpers(helpers: Object = {}) {
    const boundHelpers = Object.keys(helpers).reduce((acc, helper) => {
      if (typeof helpers[helper] !== 'function') return acc;
      if (Reflect.has(this, helper)) {
        // eslint-disable-next-line no-console
        console.warn(`Cannot set helper, "${helper}" is reserved`);
      } else {
        acc[helper] = helpers[helper];
      }
      return acc;
    }, {});
    Object.assign(this, boundHelpers);
  }
}
