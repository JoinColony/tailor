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
    expect(
      ADDRESS_TYPE.validate('0x7da82c7ab4771ff031b66538d2fb9b0b047f6cf9'),
    ).toBe(true);
    expect(() => ADDRESS_TYPE.validate('abc')).toThrow('address');
  });
  test('Boolean', () => {
    expect(BOOLEAN_TYPE.validate()).toBe(true);
    expect(BOOLEAN_TYPE.validate(false)).toBe(true);
    expect(BOOLEAN_TYPE.validate(true)).toBe(true);
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
