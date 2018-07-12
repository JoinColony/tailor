/* @flow */

export type Validator = [(value: *) => boolean, string];

export type Schema = {
  [fieldName: string]: Validator,
};

export type {
  Loader as ILoader,
  ContractData,
  RequiredContractDataProps,
  Query,
} from '../../interface/Loader';
