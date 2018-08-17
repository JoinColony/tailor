// @flow
import Transaction from '../Transaction';
import type { IAdapter } from '../../../interface/Adapter';

export default class DeployTransaction extends Transaction {
  static get name() {
    return 'deploy';
  }

  // TODO: getMethodFn

  constructor(
    adapter: IAdapter,
    {
      deployArgs = [],
      data = adapter.encodeDeploy(deployArgs),
      ...state
    }: Object,
  ) {
    super(adapter, { deployArgs, data, ...state });
  }

  get deployArgs() {
    return this._state.deployArgs;
  }
}
