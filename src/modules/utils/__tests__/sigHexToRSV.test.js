/* eslint-env jest */

import { hexToBytes, bytesToHex } from 'web3-utils';

import sigHexToRSV from '../sigHexToRSV';

jest.mock('web3-utils');

describe('sigHexToRSV util', () => {
  test('Invalid sig', () => {
    const invalidSig = '0xinvalidsig';
    hexToBytes.mockReturnValue(['invalid']);

    expect(() => sigHexToRSV(invalidSig)).toThrow('Invalid signature length');
    expect(hexToBytes).toHaveBeenCalledWith(invalidSig);
    expect(bytesToHex).not.toHaveBeenCalled();
  });

  test('Valid sig, v = 0', () => {
    const byteArray = new Array(65);
    byteArray[64] = 0;
    const validSig = '0xvalidsig';
    hexToBytes.mockReturnValue(byteArray);
    bytesToHex.mockReturnValueOnce('0xr').mockReturnValueOnce('0xs');

    const rsv = sigHexToRSV(validSig);
    expect(rsv).toEqual({
      v: 27,
      r: '0xr',
      s: '0xs',
    });
  });

  test('Valid sig, v = 27', () => {
    const byteArray = new Array(65);
    byteArray[64] = 27;
    const validSig = '0xvalidsig';
    hexToBytes.mockReturnValue(byteArray);
    bytesToHex.mockReturnValueOnce('0xr').mockReturnValueOnce('0xs');

    const rsv = sigHexToRSV(validSig);
    expect(rsv).toEqual({
      v: 27,
      r: '0xr',
      s: '0xs',
    });
  });
});
