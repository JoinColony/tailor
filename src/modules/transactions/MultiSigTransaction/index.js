/* @flow */

import Transaction from '../Transaction';

export default class MultiSigTransaction extends Transaction {
  static get name() {
    return 'multisig';
  }
}
