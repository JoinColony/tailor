/* @flow */

import { isAddress } from 'web3-utils';

import type { Validator, Schema } from './flowtypes';

export const VALIDATORS: { [name: string]: Validator } = {
  ADDRESS: [isAddress, 'must be a valid address'],
  STRING: [
    (value: string) => Boolean(typeof value === 'string' && value.length),
    'must be a non-empty string',
  ],
  BYTECODE: [
    // Pretty basic validation, but it should suffice for our purposes
    (value: string) =>
      Boolean(typeof value === 'string' && value.slice(0, 2) === '0x'),
    'must be valid bytecode',
  ],
  ABI: [
    (value: Array<*>) => Boolean(Array.isArray(value) && value.length),
    'must be valid ABI',
  ],
};

export const QUERY_SCHEMA: Schema = {
  contractAddress: VALIDATORS.ADDRESS,
  contractName: VALIDATORS.STRING,
  routerAddress: VALIDATORS.ADDRESS,
  routerName: VALIDATORS.STRING,
};

export const DATA_SCHEMA: Schema = {
  abi: VALIDATORS.ABI,
  address: VALIDATORS.ADDRESS,
  bytecode: VALIDATORS.BYTECODE,
};
