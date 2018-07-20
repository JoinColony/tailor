/* @flow */

import type { IParser } from '../flowtypes';

// Essentially an abstract class
export default class Parser implements IParser {
  static get name() {
    return 'parser';
  }

  // eslint-disable-next-line no-unused-vars,class-methods-use-this
  parse(contractData: *) {
    throw new Error('Expected "parse()" to be defined in a derived class');
  }
}
