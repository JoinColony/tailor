/* @flow */

import type { ConstructorArgs } from './flowtypes';
import { JSON_TRANSFORM } from './defaults';
import HttpLoader from './HttpLoader';

export {
  HttpLoader,
};

export default function createHttpLoader({
  endpoint,
  transform = JSON_TRANSFORM,
}: ConstructorArgs = {}) {
  return new HttpLoader({ endpoint, transform });
}
