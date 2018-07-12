/* @flow */

import type { Query } from '../flowtypes';
import type { EtherscanResponse } from '../flowtypes';

export default function etherscanTransform(
  response: EtherscanResponse,
  query?: Query = {},
) {
  if (
    typeof response !== 'object' ||
    !Object.hasOwnProperty.call(response, 'status')
  ) {
    throw new Error('Malformed response from Etherscan');
  }

  const { result: abi, status } = response;

  if (status !== '1')
    throw new Error(`Erroneous response from Etherscan (status: ${status})`);

  return {
    abi,
    address: query.contractAddress,
  };
}
