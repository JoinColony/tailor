/* @flow */

import type {
  ContractData,
  ILoader,
  LoaderArgs,
  Query,
  Transform,
} from '../flowtypes';

import transformJson from '../transforms/transformJson';

const assert = require('assert');

export default class Loader implements ILoader {
  _transform: Transform;

  constructor({ transform = transformJson }: LoaderArgs = {}) {
    assert(
      typeof transform === 'function',
      'A "transform" option must be provided',
    );
    this._transform = transform;
  }

  transform(input: *, query: Query): ContractData {
    return this._transform(input, query);
  }

  // eslint-disable-next-line
  async load(query: Query) {
    throw new Error('Expected "load()" to be defined in a derived class');
  }
}
