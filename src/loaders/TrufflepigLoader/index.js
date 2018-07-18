/* @flow */

import type { HttpLoaderArgs } from '../flowtypes';
import HttpLoader from '../HttpLoader';
import transformTruffleArtifact from '../transforms/transformTruffleArtifact';

const DEFAULT_HOST = 'http://127.0.0.1:3030';
// eslint-disable-next-line max-len
const DEFAULT_ENDPOINT = `${DEFAULT_HOST}/contracts?name=%%NAME%%&address=%%ADDRESS%%&version=%%VERSION%%`;

export default class TrufflepigLoader extends HttpLoader {
  static get name() {
    return 'trufflepig';
  }

  constructor({
    endpoint = DEFAULT_ENDPOINT,
    transform = transformTruffleArtifact,
    ...args
  }: HttpLoaderArgs = {}) {
    super({ endpoint, transform, ...args });
  }
}
