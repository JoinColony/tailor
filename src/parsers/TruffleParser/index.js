/* @flow */

import ABIParser from '../ABIParser';

/*
 * XXX For now, we are only using the `abi` property of the Truffle Artifact,
 * which is the same as the data the ABIParser expects; simply extend the
 * class with no modifications. Later, we can use other data provided here.
 */
export default class TruffleParser extends ABIParser {
  static get name() {
    return 'truffle';
  }
}
