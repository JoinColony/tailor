// @flow
import Transaction from '../Transaction';
// eslint-disable-next-line import/no-cycle
import Lighthouse from '../../../Lighthouse';
import type { LighthouseArgs } from '../../../Lighthouse/flowtypes';

export default class DeployTransaction extends Transaction {
  _lhArgs: LighthouseArgs;

  constructor(
    lhArgs: LighthouseArgs,
    {
      deployArgs = [],
      data = lhArgs.adapter.encodeDeploy(deployArgs),
      ...state
    }: Object,
  ) {
    super(lhArgs.adapter, { deployArgs, data, ...state });

    this._lhArgs = lhArgs;
  }

  async send() {
    const tx = await super.send();
    this._lhArgs.contractData.address = tx.receipt.contractAddress;
    await this._lhArgs.adapter.initialize(this._lhArgs.contractData);
    return new Lighthouse(this._lhArgs);
  }
}
