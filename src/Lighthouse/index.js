/* @flow */

import LoaderEngine from '../LoaderEngine';
import type { Loader } from '../interface/Loader';

export default class Lighthouse {
  loaderEngine: LoaderEngine;
  constructor({ loader }: { loader: Loader } = {}) {
    this.loaderEngine = new LoaderEngine(loader);
  }
}
