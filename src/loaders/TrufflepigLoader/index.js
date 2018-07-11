/* @flow */

import type { ConstructorArgs } from '../HttpLoader/flowtypes';
import createHttpLoader from '../HttpLoader';
import transformTruffleArtifact from './transformTruffleArtifact';

const DEFAULT_HOST = 'http://127.0.0.1:3030';
const DEFAULT_ENDPOINT = `${DEFAULT_HOST}/contracts?name=%%NAME%%&address=%%ADDRESS%%&version=%%VERSION%%`;

export default function createTrufflepigLoader({
  endpoint = DEFAULT_ENDPOINT,
  transform = transformTruffleArtifact,
}: ConstructorArgs = {}) {
  return createHttpLoader({ endpoint, transform });
}
