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

export const BIG_INTEGER_PATTERN = /^u?int([0-9]*)?(\[([0-9]*)])*$/;

export const STRING_PATTERN = /^string(\[([0-9]*)])*$/;

export const ID_PATTERN = /^((?:id|count)|(?:(?:[a-z])+(?:Id|Count)))$/;
export const DATE_PATTERN = /^((?:id|count)|(?:(?:[a-z])+(?:Id|Count)))$/;

/*
 * This map is used to resolve the likely parameter type to use for variable
 * from a contract ABI.
 *
 * It maps a regex for a Solidity type (e.g. `uint256`) to an object that
 * represents the param type for that Solidity type (e.g.
 * `{ type: BIG_INTEGER_TYPE }`, and optionally a map of regexes for variable
 * names and param types (e.g. `{ nameMap: new Map([...]) }`).
 *
 * The expectation is that we will first map a variable to a type by firstly
 * its Solidity type, and then its name (if necessary).
 */
export const TYPE_PATTERN_MAP: Map<
  RegExp,
  { type: ParamType, nameMap?: Map<RegExp, { type: ParamType }> },
> = new Map([
  [ADDRESS_PATTERN, { type: ADDRESS_TYPE }],
  [
    BIG_INTEGER_PATTERN,
    {
      type: BIG_INTEGER_TYPE,
      nameMap: new Map([
        [ID_PATTERN, { type: INTEGER_TYPE }],
        [DATE_PATTERN, { type: DATE_TYPE }],
      ]),
    },
  ],
  [BOOLEAN_PATTERN, { type: BOOLEAN_TYPE }],
  [BYTES_PATTERN, { type: BYTES_TYPE }],
  [STRING_PATTERN, { type: STRING_TYPE }],
]);

export const SPEC_TYPES = {
  CONSTANTS: 'constants',
  EVENTS: 'events',
  METHODS: 'methods',
};
