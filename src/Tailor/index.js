/* @flow */
/* eslint-disable no-underscore-dangle */

import constantFactory from '../modules/constantFactory';
import Event from '../modules/Event';
import methodFactory from '../modules/methodFactory';
import DeployTransaction from '../modules/transactions/DeployTransaction';
import { mergeSpec } from '../modules/utils';
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
  WalletSpec,
} from './flowtypes';
import type { ParamTypeName } from '../interface/Params';
import type {
  Overrides,
  ParamOverrides,
  ParamOverridesWithSignatures,
  ParamOverridesWithOptionalSignatures,
} from '../interface/Overrides';
// eslint-disable-next-line max-len
import type { ParamsSpecWithOptionalSignatures } from '../interface/ContractSpec';

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

  bytecode: ?string;

  _contractSpec: ContractSpec;

  _overrides: Overrides;

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

  static _resolveParamTypeName(typeName: ParamTypeName) {
    const type = PARAM_TYPE_NAME_MAP[typeName];
    if (!type) throw new Error(`Custom type "${typeName}" not found`);
    return type;
  }

  static _resolveTypesForParamOverrides(paramOverrides: ParamOverrides) {
    return paramOverrides.map(
      paramOverride =>
        typeof paramOverride.type === 'string'
          ? Object.assign({}, paramOverride, {
              type: this._resolveParamTypeName(paramOverride.type),
            })
          : paramOverride,
    );
  }

  static _getParamOverridesWithSignatures(
    paramOverrides: ParamOverridesWithSignatures,
  ) {
    return Object.keys(paramOverrides).reduce((acc, key) => {
      acc[key] = this._resolveTypesForParamOverrides(paramOverrides[key]);
      return acc;
    }, {});
  }

  static _getParamOverrides(
    params: ParamsSpecWithOptionalSignatures,
    overrides: ParamOverridesWithOptionalSignatures,
  ) {
    if (Array.isArray(overrides)) {
      // For e.g. constant/method output
      if (Array.isArray(params))
        return this._resolveTypesForParamOverrides(overrides);

      const signatures = Object.keys(params);
      // TODO write error message
      if (signatures.length > 1) throw new Error('Cannot apply override');

      return {
        [signatures[0]]: this._resolveTypesForParamOverrides(overrides),
      };
    }

    return this._getParamOverridesWithSignatures(overrides);
  }

  static _getOverridesOfType(overrides: *, specs: *) {
    return Object.keys(overrides).reduce((acc, name) => {
      const override = overrides[name];
      const spec = specs[name];

      // TODO probably need this
      // if (!spec)
      //   throw new Error(`Unable to override ${name}: contract spec not found`);

      if (override.input)
        override.input = this._getParamOverrides(spec.input, override.input);
      if (override.output)
        override.output = this._getParamOverrides(spec.output, override.output);

      acc[name] = override;
      return acc;
    }, {});
  }

  constructor({
    adapter,
    constants = {},
    contractData,
    events = {},
    helpers,
    methods = {},
    parser,
    wallet,
  }: TailorArgs) {
    this.adapter = adapter;
    this.parser = parser;
    this.wallet = wallet;
    if (contractData) {
      this.contractAddress = contractData.address;
      this.bytecode = contractData.bytecode;
    }
    this._defineContractInterface(contractData, {
      constants,
      methods,
      events,
    });
    this._defineHelpers(helpers);
  }

  async setWallet(wallet: IWallet | WalletSpec): Promise<IWallet> {
    this.wallet = await getWallet(wallet);
    return this.wallet;
  }

  extend({
    constants = {},
    events = {},
    methods = {},
    ...helpers
  }: {
    helpers: Object,
  } & Overrides) {
    this._defineContractInterface(undefined, { constants, events, methods });
    this._defineHelpers(helpers);
  }

  _getOverrides({ constants, events, methods }: Overrides) {
    return {
      constants: this.constructor._getOverridesOfType(
        constants,
        this._contractSpec.constants,
      ),
      events: this.constructor._getOverridesOfType(
        events,
        this._contractSpec.events,
      ),
      methods: this.constructor._getOverridesOfType(
        methods,
        this._contractSpec.methods,
      ),
    };
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

  _defineContractInterface(contractData?: ContractData, overrides?: Overrides) {
    if (contractData && !this._contractSpec)
      this._contractSpec = this.parser.parse(contractData);

    if (overrides)
      this._contractSpec = mergeSpec(
        this._contractSpec,
        this._getOverrides(overrides),
      );

    this._defineConstants(this._contractSpec.constants);
    this._defineEvents(this._contractSpec.events);
    this._defineMethods(this._contractSpec.methods);
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
