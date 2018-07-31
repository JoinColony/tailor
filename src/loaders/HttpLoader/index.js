/* @flow */

import 'isomorphic-fetch';
import type { HttpLoaderArgs } from '../flowtypes';
import Loader from '../Loader';

const assert = require('assert');

export default class HttpLoader<Query: Object> extends Loader {
  _endpoint: string;

  static get name() {
    return 'http';
  }

  constructor({ endpoint, transform }: HttpLoaderArgs = {}) {
    super({ transform });
    assert(
      typeof endpoint === 'string' && endpoint,
      'An "endpoint" option must be provided',
    );
    this._endpoint = endpoint;
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

  async loadContractData(query: Query) {
    let error = new Error();
    let action = 'load contract data';
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
        if (json) return this.transform(json, query);
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
