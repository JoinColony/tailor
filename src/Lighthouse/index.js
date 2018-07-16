/* @flow */

import type { Loader as ILoader } from '../interface/Loader';

export default class Lighthouse {
  loader: ILoader;

  constructor({ loader }: { loader: ILoader } = {}) {
    this.loader = loader;
  }
}
