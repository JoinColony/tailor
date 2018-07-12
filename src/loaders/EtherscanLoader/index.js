/* @flow */

import type { HttpLoaderArgs } from '../flowtypes';
import HttpLoader from '../HttpLoader';
// eslint-disable-next-line max-len
import transformEtherscanResponse from '../transforms/transformEtherscanResponse';

const DEFAULT_ENDPOINT =
  'https://api.etherscan.io/api?module=contract&action=getabi&address=%%ADDRESS%%'; // eslint-disable-line max-len

export default class EtherscanLoader extends HttpLoader {
  constructor({
    endpoint = DEFAULT_ENDPOINT,
    transform = transformEtherscanResponse,
    ...args
  }: HttpLoaderArgs = {}) {
    super({ endpoint, transform, ...args });
  }
}
