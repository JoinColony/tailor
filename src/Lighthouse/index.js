/* @flow */

import LoaderEngine from '../LoaderEngine';
import type { Loader } from '../interface/Loader';

export default class Lighthouse {
  loader: LoaderEngine;

  constructor({ loader }: { loader: Loader } = {}) {
    this.loader = new LoaderEngine(loader);
  }
}
