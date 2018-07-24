/* @flow */

import type { ConstantSpec } from '../../interface/ContractSpec';
import type { FunctionCall, FunctionCallResult } from '../../interface/Adapter';
import { convertInput, convertOutput } from '../paramConversion';

// Awaiting https://github.com/benmosher/eslint-plugin-import/pull/1126
// eslint-disable-next-line import/no-cycle
import type Lighthouse from '../../Lighthouse';

export default class Constant {
  spec: ConstantSpec;

  lighthouse: Lighthouse;

  constructor(lighthouse: Lighthouse, spec: ConstantSpec) {
    this.lighthouse = lighthouse;
    this.spec = spec;
  }

  _getFunctionCall(...params: any): FunctionCall {
    return {
      method: this.spec.name,
      parameters: convertInput(this.spec.input, ...params),
    };
  }

  _convertFunctionCallResult(result: FunctionCallResult) {
    return convertOutput(this.spec.output, ...[].concat(result));
  }

  async call(...params: any) {
    const fnCall = this._getFunctionCall(...params);
    const callResult = await this.lighthouse.adapter.call(fnCall);
    return this._convertFunctionCallResult(callResult);
  }
}
