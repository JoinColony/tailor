/* @flow */

import type { ConstructorArgs } from '../HttpLoader/flowtypes';
import createHttpLoader from '../HttpLoader';
import transformEtherscanResponse from './transformEtherscanResponse';

const DEFAULT_ENDPOINT =
  'https://api.etherscan.io/api?module=contract&action=getabi&address=%%ADDRESS%%'; // eslint-disable-line max-len

export default function createEtherscanLoader({
  endpoint = DEFAULT_ENDPOINT,
  transform = transformEtherscanResponse,
}: ConstructorArgs = {}) {
  return createHttpLoader({ endpoint, transform });
}
