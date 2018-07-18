/* @flow */

import type { FSLoaderArgs } from '../flowtypes';
import FSLoader from '../FSLoader';
import transformTruffleArtifact from '../transforms/transformTruffleArtifact';

const DEFAULT_DIRECTORY = './build/contracts';

export default class TruffleLoader extends FSLoader {
  static get name() {
    return 'truffle';
  }

  constructor({
    directory = DEFAULT_DIRECTORY,
    transform = transformTruffleArtifact,
  }: FSLoaderArgs = {}) {
    super({ directory, transform });
  }
}
