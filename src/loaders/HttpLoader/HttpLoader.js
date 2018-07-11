/* @flow */

import 'isomorphic-fetch';
import type { ConstructorArgs, Transform } from './flowtypes';
import type { Query, Loader } from '../../interface/Loader';
import { JSON_TRANSFORM } from './defaults';

const assert = require('assert');

export default class HttpLoader implements Loader {
  _endpoint: string;

  _transform: Transform;

  constructor({ endpoint, transform = JSON_TRANSFORM }: ConstructorArgs = {}) {
    assert(
      typeof endpoint === 'string' && endpoint,
      'An "endpoint" option must be provided',
    );
    assert(
      typeof transform === 'function',
      'A "transform" option must be provided',
    );
    this._endpoint = endpoint;
    this._transform = transform;
  }

  resolveEndpointResource({ contractName, contractAddress, version }: Query) {
    return (
      this._endpoint
        .replace('%%NAME%%', contractName || '')
        .replace('%%ADDRESS%%', contractAddress || '')
        // `version` can be a string or an integer
        .replace(
          '%%VERSION%%',
          version != null &&
          (typeof version === 'string' ||
            Number(parseInt(version, 10)) === version)
            ? version.toString()
            : '',
        )
    );
  }

  async load(query: Query) {
    let error = new Error();
    let action = '';
    let response;

    try {
      response = await fetch(this.resolveEndpointResource(query));
    } catch (resourceError) {
      action = 'fetch resource';
      error = resourceError;
    }

    if (response)
      try {
        const json = response && response.json && (await response.json());
        if (json) return this._transform(json, query);
      } catch (jsonError) {
        action = 'get JSON';
        error = jsonError;
      }

    // Provide some context for errors thrown by lower-level functions
    throw new Error(
      `Unable to ${action} for contract ${query.contractName ||
        query.contractAddress ||
        ''}: ${error.message || error.toString()}`,
    );
  }
}
