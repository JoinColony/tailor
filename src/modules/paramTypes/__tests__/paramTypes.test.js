/* eslint-env jest */

import BigNumber from 'bn.js';

import {
  ADDRESS_TYPE,
  BOOLEAN_TYPE,
  BYTES_TYPE,
  INTEGER_TYPE,
  STRING_TYPE,
} from '../index';

describe('Param types', () => {
  test('Address', () => {
    const emptyAddress = '0x0000000000000000000000000000000000000000';

    expect(
      ADDRESS_TYPE.validate('0x7da82c7ab4771ff031b66538d2fb9b0b047f6cf9'),
    ).toBe(true);
    expect(ADDRESS_TYPE.validate(emptyAddress)).toBe(true);
    expect(() => ADDRESS_TYPE.validate('abc')).toThrow('address');

    // Expand `0x0` to a full-length address (for empty address)
    expect(ADDRESS_TYPE.convertInput('0x')).toEqual(emptyAddress);
    expect(ADDRESS_TYPE.convertOutput('0x')).toEqual(emptyAddress);

    // Filter out invalid addresses from the output
    expect(ADDRESS_TYPE.convertOutput('not a valid address')).toEqual(null);
    expect(ADDRESS_TYPE.convertOutput(null)).toEqual(null);
  });
  test('Boolean', () => {
    expect(BOOLEAN_TYPE.validate(false)).toBe(true);
    expect(BOOLEAN_TYPE.validate(true)).toBe(true);
    expect(() => BOOLEAN_TYPE.validate()).toThrow('boolean');
    expect(() => BOOLEAN_TYPE.validate(1)).toThrow('boolean');
  });
  test('Bytes', () => {
    expect(BYTES_TYPE.validate('0x00000001')).toBe(true);
    expect(() => BYTES_TYPE.validate('abc')).toThrow('hex');
  });
  test('Integer', () => {
    expect(INTEGER_TYPE.validate(1)).toBe(true);
    expect(INTEGER_TYPE.validate(new BigNumber(1))).toBe(true);
    expect(() => INTEGER_TYPE.validate(1.1)).toThrow('integer');
    expect(() => INTEGER_TYPE.validate('abc')).toThrow('integer');
  });
  test('String', () => {
    // Validation
    expect(STRING_TYPE.validate('abc')).toBe(true);
    expect(STRING_TYPE.validate('0x00000001')).toBe(true);
    expect(() => STRING_TYPE.validate()).toThrow('string');
    expect(() => STRING_TYPE.validate(1)).toThrow('string');

    // Converting input
    expect(STRING_TYPE.convertInput('abc')).toBe('0x616263');
    expect(STRING_TYPE.convertInput('0x616263')).toBe('0x616263');
  });
});
