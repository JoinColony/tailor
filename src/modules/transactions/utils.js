/* @flow */

import BigNumber from 'bn.js';

// eslint-disable-next-line import/prefer-default-export
export function isOptions(input: any) {
  return (
    typeof input === 'object' &&
    ['value', 'gas', 'gasLimit'].some(
      option =>
        BigNumber.isBN(input[option]) || typeof input[option] === 'number',
    )
  );
}
