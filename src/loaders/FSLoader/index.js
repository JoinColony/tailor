/* @flow */
/* eslint-disable import/no-extraneous-dependencies,global-require */

import type { FSLoaderArgs, Query } from '../flowtypes';
import Loader from '../Loader';

const assert = require('assert');
const path = require('path');

let jsonfile;
try {
  jsonfile = require('jsonfile');
} catch (error) {
  throw new Error(
    'FSLoader requires "jsonfile" as a dependency. ' +
      'Please add this package to your project to use FSLoader.',
  );
}

export default class FSLoader extends Loader {
  _directory: string;

  static get name() {
    return 'fs';
  }

  constructor({ directory, transform }: FSLoaderArgs = {}) {
    super({ transform });
    assert(
      typeof directory === 'string' && directory,
      'A "directory" option must be provided',
    );
    this._directory = directory;
  }

  async loadContractData(query: Query) {
    const { contractName = '' } = query;

    assert(!!contractName, 'A "contractName" property must be provided');

    const file = path.resolve(this._directory, `${contractName}.json`);
    const jsonObj = await new Promise((resolve, reject) => {
      jsonfile.readFile(file, (error, contents) => {
        if (error) return reject(error);
        return resolve(contents);
      });
    });
    return this.transform(jsonObj, query);
  }
}
