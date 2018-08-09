/* @flow */

import BigNumber from 'bn.js';

export default function parseBigNumber(input: any) {
  return BigNumber.isBN(input) ||
    typeof input === 'number' ||
    typeof input === 'string'
    ? new BigNumber(input)
    : null;
}
