/* @flow */

import type { ParamType } from '../../interface/Params';

import {
  ADDRESS_TYPE,
  BIG_INTEGER_TYPE,
  BOOLEAN_TYPE,
  BYTES_TYPE,
  DATE_TYPE,
  INTEGER_TYPE,
  STRING_TYPE,
} from '../../modules/paramTypes';

// Patterns: https://github.com/ethereum/web3.js/tree/1.0/packages/web3-eth-abi/src/types
export const ADDRESS_PATTERN = /address(\[([0-9]*)])?/;

export const BOOLEAN_PATTERN = /^bool(\[([0-9]*)])*$/;

export const BYTES_PATTERN = /^bytes(([0-9]{1,})(\[([0-9]*)])|(\[([0-9]*)]))*$/;

export const INTEGER_PATTERN = /^u?int([0-9]*)?(\[([0-9]*)])*$/;

export const STRING_PATTERN = /^string(\[([0-9]*)])*$/;

export const TYPE_PATTERN_MAP: Map<ParamType, RegExp> = new Map([
  [ADDRESS_TYPE, ADDRESS_PATTERN],
  [BOOLEAN_TYPE, BOOLEAN_PATTERN],
  [BYTES_TYPE, BYTES_PATTERN],
  [INTEGER_TYPE, INTEGER_PATTERN],
  [STRING_TYPE, STRING_PATTERN],
]);

export const SPEC_TYPES = {
  CONSTANTS: 'constants',
  EVENTS: 'events',
  METHODS: 'methods',
};
