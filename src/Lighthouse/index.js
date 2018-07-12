/* @flow */

import LoaderEngine from './LoaderEngine';
import type { ILoader } from './LoaderEngine/flowtypes';

export default class Lighthouse {
  loader: LoaderEngine;

  constructor({ loader }: { loader: ILoader } = {}) {
    this.loader = new LoaderEngine(loader);
  }
}
