/* @flow */

import ContractTransaction from '../ContractTransaction';
import type Lighthouse from '../../../Lighthouse';

export default class MultiSigTransaction extends ContractTransaction {
  static get name() {
    return 'multisig';
  }

  static async restore() {
    //
  }

  constructor(lh: Lighthouse, { ...state }: Object) {
    super(lh, { ...state });
    // TODO: set multisig info
  }

  // eslint-disable-next-line class-methods-use-this
  async start() {
    //
  }

  // eslint-disable-next-line class-methods-use-this
  async sign() {
    //
  }

  async send(): Promise<this> {
    // TODO: check is signed by all
    return super.send();
  }
}
