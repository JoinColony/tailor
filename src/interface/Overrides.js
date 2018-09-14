/* @flow */

import type { TransactionSpec } from '../modules/transactions/flowtypes';
import type { ParamType, ParamTypeName } from './Params';

export type HooksSpec = {
  // TODO better hooks typing, and move this
  [hookName: string]: Array<Function> | Function,
};

export type ParamOverride = {
  defaultValue?: *,
  type?: ParamType | ParamTypeName,
};

export type ParamOverrides = Array<ParamOverride>;

export type ParamOverridesWithSignatures = {
  [signature: string]: ParamOverrides,
};

export type ParamOverridesWithOptionalSignatures =
  | ParamOverrides
  | ParamOverridesWithSignatures;

export type MethodOverride = {
  hooks?: HooksSpec, // todo restrict to only method hooks?
  input?: ParamOverridesWithOptionalSignatures,
  isPayable?: boolean,
  output?: ParamOverrides,
  type?: TransactionSpec,
};

export type EventOverride = {
  hooks?: HooksSpec, // todo restrict to only event hooks?
  output?: ParamOverridesWithOptionalSignatures,
};

export type ConstantOverride = {
  hooks?: HooksSpec, // todo restrict to only constant hooks?
  input?: ParamOverridesWithOptionalSignatures,
  output?: ParamOverrides,
};

export type EventOverrides = {
  [eventName: string]: EventOverride,
};

export type MethodOverrides = {
  [methodName: string]: MethodOverride,
};

export type ConstantOverrides = {
  [constantName: string]: ConstantOverride,
};

export type Overrides = {
  constants?: ConstantOverrides,
  events?: EventOverrides,
  hooks?: HooksSpec,
  methods?: MethodOverrides,
};
