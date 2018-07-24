/* @flow */

import BigNumber from 'bn.js';
import { isAddress, isHexStrict, utf8ToHex } from 'web3-utils';

import type { ParamType } from '../../interface/Params';

const assert = require('assert');

export const ADDRESS_TYPE: ParamType = {
  validate(value: *) {
    assert(isAddress(value), 'Must be a valid address');
    return true;
  },
};

export const INTEGER_TYPE: ParamType = {
  validate(value: *) {
    assert(
      Number.isInteger(value) || BigNumber.isBN(value),
      'Must be a valid integer or BigNumber',
    );
    return true;
  },
};

export const BOOLEAN_TYPE: ParamType = {
  validate(value: *) {
    assert(typeof value === 'boolean', 'Must be a boolean');
    return true;
  },
};

// TODO validate size?
export const BYTES_TYPE: ParamType = {
  validate(value: *) {
    assert(isHexStrict(value), 'Must be a hex string');
    return true;
  },
};

// TODO validate size?
export const STRING_TYPE: ParamType = {
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
