/* @flow */

import type { FSLoaderArgs } from '../flowtypes';
import FSLoader from '../FSLoader';
import transformTruffleArtifact from '../transforms/transformTruffleArtifact';

export default class TruffleLoader extends FSLoader {
  constructor({
    directory,
    transform = transformTruffleArtifact,
  }: FSLoaderArgs = {}) {
    super({ directory, transform });
  }
}
