/* @flow */

import BigNumber from 'bn.js';

export default function parseBigNumber(input: any) {
  return BigNumber.isBN(input) ||
    typeof input === 'number' ||
    (typeof input === 'string' && parseInt(input, 10).toString() === input)
    ? new BigNumber(input)
    : null;
}
