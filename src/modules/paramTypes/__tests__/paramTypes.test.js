/* eslint-env jest */

import BigNumber from 'bn.js';

import {
  ADDRESS_TYPE,
  BIG_INTEGER_TYPE,
  BOOLEAN_TYPE,
  BYTES_TYPE,
  DATE_TYPE,
  HEX_STRING_TYPE,
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
    // Validation
    expect(INTEGER_TYPE.validate(1)).toBe(true);
    expect(INTEGER_TYPE.validate(new BigNumber(1))).toBe(true);
    expect(() => INTEGER_TYPE.validate(1.1)).toThrow('integer');
    expect(() => INTEGER_TYPE.validate('abc')).toThrow('integer');

    // Converting output
    expect(INTEGER_TYPE.convertOutput(new BigNumber(1))).toBe(1);
    expect(INTEGER_TYPE.convertOutput(1)).toBe(1);
  });
  test('Date', () => {
    const date = new Date(2018, 10, 13, 6, 30, 2, 137);
    const timeWithMs = new Date(2018, 10, 13, 6, 30, 2, 137).setMilliseconds(0);
    const timeWithoutMs = parseInt(timeWithMs / 1000, 10);

    // Sanity check
    expect(String(timeWithMs).length).toBe(13);
    expect(String(timeWithoutMs).length).toBe(10);

    // Validation
    expect(DATE_TYPE.validate(date)).toBe(true);
    expect(DATE_TYPE.validate(new Date(0))).toBe(true);
    expect(DATE_TYPE.validate(0)).toBe(false);
    expect(DATE_TYPE.validate(null)).toBe(false);

    // Converting output values
    const bnDate = new BigNumber(timeWithoutMs);
    const outputFromBn = DATE_TYPE.convertOutput(bnDate);
    expect(outputFromBn).toBeInstanceOf(Date);
    expect(outputFromBn.getTime()).toEqual(timeWithMs);

    const outputFromNumber = DATE_TYPE.convertOutput(timeWithoutMs);
    expect(outputFromNumber).toBeInstanceOf(Date);
    expect(outputFromNumber.getTime()).toEqual(timeWithMs);

    expect(DATE_TYPE.convertOutput(0)).toEqual(null);

    // Converting input values
    expect(DATE_TYPE.convertInput(date)).toBe(timeWithoutMs);
  });
  test('Hex string', () => {
    // Validation
    expect(HEX_STRING_TYPE.validate('0x1')).toBe(true);
    expect(HEX_STRING_TYPE.validate('a')).toBe(false);
    expect(HEX_STRING_TYPE.validate(1)).toBe(false);

    // Converting output values
    expect(HEX_STRING_TYPE.convertOutput(5)).toBe('0x5');
    expect(HEX_STRING_TYPE.convertOutput('foo')).toBe('0x666f6f');
    expect(HEX_STRING_TYPE.convertOutput('0xdeadbeef')).toBe('0xdeadbeef');
    expect(HEX_STRING_TYPE.convertOutput(null)).toBe(null);
  });
  test('Big Integer', () => {
    expect(BIG_INTEGER_TYPE.validate(1)).toBe(true);
    expect(BIG_INTEGER_TYPE.validate(new BigNumber(1))).toBe(true);
    expect(() => BIG_INTEGER_TYPE.validate(1.1)).toThrow('integer');
    expect(() => BIG_INTEGER_TYPE.validate('abc')).toThrow('integer');

    // Converting input
    expect(BIG_INTEGER_TYPE.convertInput(new BigNumber(1))).toEqual(
      new BigNumber(1),
    );
    expect(BIG_INTEGER_TYPE.convertInput(1)).toEqual(new BigNumber(1));

    // Converting output
    expect(BIG_INTEGER_TYPE.convertOutput(new BigNumber(1))).toEqual(
      new BigNumber(1),
    );
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
