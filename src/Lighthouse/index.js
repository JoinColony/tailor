/* @flow */

import deepmerge from 'deepmerge';

// eslint-disable-next-line import/no-cycle
import constantFactory from '../modules/constantFactory';
import Event from '../modules/Event';
// eslint-disable-next-line import/no-cycle
import methodFactory from '../modules/methodFactory';
// eslint-disable-next-line import/no-cycle
import DeployTransaction from '../modules/transactions/DeployTransaction';
import { getAdapter, getLoader, getParser, getWallet } from './factory';

import type Transaction from '../modules/transactions/Transaction';
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
  }: LighthouseCreateArgs = {}): Promise<LighthouseArgs> {
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
    };
  }

  static async create(args: LighthouseCreateArgs = {}): Promise<this> {
    return new this(await this.getConstructorArgs(args));
  }

  static async deploy(
    args: LighthouseCreateArgs & {
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
