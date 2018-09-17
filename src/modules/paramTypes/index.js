/* @flow */

import BigNumber from 'bn.js';
import { isAddress, isHexStrict, utf8ToHex } from 'web3-utils';
import { isEmptyHexString } from '../utils';

import type { ParamType } from '../../interface/Params';

const assert = require('assert');

export const ADDRESS_TYPE: ParamType = {
  name: 'address',
  validate(value: *) {
    assert(
      isEmptyHexString(value) || isAddress(value),
      'Must be a valid address',
    );
    return true;
  },
  convertInput(value: string) {
    // Expand `0x0` to a full-length address
    return value.padEnd(42, '0');
  },
  convertOutput(value: any) {
    // Expand `0x0` to a full-length address (for a valid address)
    return isAddress(value) || isEmptyHexString(value)
      ? value.padEnd(42, '0')
      : null;
  },
};

export const INTEGER_TYPE: ParamType = {
  name: 'integer',
  validate(value: *) {
    assert(
      Number.isInteger(value) || BigNumber.isBN(value),
      'Must be a valid integer or BigNumber',
    );
    return true;
  },
  convertOutput(value: string) {
    return parseInt(value, 10);
  },
};

export const BOOLEAN_TYPE: ParamType = {
  name: 'boolean',
  validate(value: *) {
    assert(typeof value === 'boolean', 'Must be a boolean');
    return true;
  },
};

// TODO validate size?
export const BYTES_TYPE: ParamType = {
  name: 'bytes',
  validate(value: *) {
    assert(isHexStrict(value), 'Must be a hex string');
    return true;
  },
};

// TODO validate size?
export const STRING_TYPE: ParamType = {
  name: 'string',
  validate(value: *) {
    assert(typeof value === 'string', 'Must be a string');
    return true;
  },
  // TODO test if this is even necessary...
  convertInput(value: string) {
    return isHexStrict(value) ? value : utf8ToHex(value);
  },
};

const PARAM_TYPES: { [paramTypeName: string]: ParamType } = {
  ADDRESS: ADDRESS_TYPE,
  BOOLEAN: BOOLEAN_TYPE,
  BYTES: BYTES_TYPE,
  INTEGER: INTEGER_TYPE,
  STRING: STRING_TYPE,
};

export default PARAM_TYPES;
