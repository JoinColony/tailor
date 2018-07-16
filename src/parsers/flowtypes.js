/* @flow */

export type { Parser as IParser } from '../interface/Parser';

export type {
  ConstantSpec,
  MethodSpec,
  EventSpec,
  ContractSpec,
} from '../interface/ContractSpec';

export type { ParamSpec, ParamsSpec, ParamType } from '../interface/Params';

export type ABIParam = {
  name?: string,
  type: string,
  components?: Array<ABIParam>,
};

export type ABIEntryType = 'constructor' | 'function' | 'event';

export type ABIEntryStateMutability =
  | 'nonpayable'
  | 'payable'
  | 'pure'
  | 'view';

export type ABIEntry = {
  constant?: boolean,
  inputs?: Array<ABIParam>,
  name: string,
  outputs?: Array<ABIParam>,
  type?: ABIEntryType,
  stateMutability: ABIEntryStateMutability,
  payable?: boolean,
};

export type ABI = Array<ABIEntry>;
