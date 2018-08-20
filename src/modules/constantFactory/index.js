/* @flow */

import type {
  ConstantSpec,
  FunctionParams,
} from '../../interface/ContractSpec';
import getFunctionCall from '../getFunctionCall';
import { convertOutput } from '../paramConversion';

import type Lighthouse from '../../Lighthouse';
import HookManager from '../HookManager';

function getConstantFn(
  lighthouse: Lighthouse,
  functionParams: FunctionParams,
  output,
) {
  const hooks = new HookManager();
  const fn = async function constant(...inputParams: any) {
    // TODO: do we want to hook inputParams?
    const fnCall = getFunctionCall(functionParams, ...inputParams);
    const hookedFnCall = await hooks.getHookedValue('call', fnCall);
    const callResult = await lighthouse.adapter.call(hookedFnCall);
    const result = convertOutput(output, ...callResult);
    return hooks.getHookedValue('result', result);
  };
  fn.hooks = hooks.createHooks();
  return fn;
}

/*
 * Given a specification for a constant function, eeturn an async function
 * which can be called with any valid input.
 */
export default function constantFactory(
  lighthouse: Lighthouse,
  { name, input = {}, output = [] }: ConstantSpec,
) {
  const functionSignatures = Object.keys(input);

  // If input wasn't provided, use the constant name (presumed to be the
  // function signature) to produce the function parameters we need.
  const functionParams =
    functionSignatures.length === 0 ? { [name]: [] } : input;

  const fn = getConstantFn(lighthouse, functionParams, output);

  // Allow each function signature to be called specifically by adding
  // properties to the constant function
  functionSignatures.forEach(functionSignature => {
    fn[functionSignature] = getConstantFn(
      lighthouse,
      { [functionSignature]: functionParams[functionSignature] },
      output,
    );
  });

  return fn;
}
