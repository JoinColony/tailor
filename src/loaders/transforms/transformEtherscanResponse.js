/* @flow */

import type { EtherscanResponse } from '../flowtypes';

export default function etherscanTransform(
  response: EtherscanResponse,
  query: * = {},
) {
  if (
    typeof response !== 'object' ||
    !Object.hasOwnProperty.call(response, 'status')
  ) {
    throw new Error('Malformed response from Etherscan');
  }

  const { result, status } = response;

  if (status !== '1')
    throw new Error(`Erroneous response from Etherscan (status: ${status})`);

  let abi;
  try {
    abi = JSON.parse(result);
  } catch (error) {
    throw new Error(`Error parsing result from Etherscan: ${error.toString()}`);
  }

  const parsed = {
    abi,
    address: query.contractAddress,
    bytecode: '',
  };

  // Etherscan's API does not return a bytecode property, so we will employ a
  // custom getter (which throws an error) in order to make this clear.
  // $FlowFixMe: we don't want to assign a value
  Object.defineProperty(parsed, 'bytecode', {
    enumerable: false,
    configurable: false,
    get() {
      throw new Error('Etherscan does not currently provide contract bytecode');
    },
  });

  return parsed;
}
