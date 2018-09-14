/* @flow */

import type {
  ConstantSpec,
  ParamsSpecWithSignatures,
} from '../../interface/ContractSpec';
import getFunctionCall from '../getFunctionCall';
import { convertOutput } from '../paramConversion';

import type Tailor from '../../Tailor';
import HookManager from '../HookManager';

function getConstantFn(
  tailor: Tailor,
  functionParams: ParamsSpecWithSignatures,
  output,
) {
  const hooks = new HookManager();
  const fn = async function constant(...inputParams: any) {
    // TODO: do we want to hook inputParams?
    const fnCall = getFunctionCall(functionParams, ...inputParams);
    const hookedFnCall = await hooks.getHookedValue('call', fnCall);
    const callResult = await tailor.adapter.call(hookedFnCall);
    const result = convertOutput(output, ...callResult);
    return hooks.getHookedValue('result', result, inputParams);
  };
  fn.hooks = hooks.createHooks();
  return fn;
}

/*
 * Given a specification for a constant function, eeturn an async function
 * which can be called with any valid input.
 */
export default function constantFactory(
  tailor: Tailor,
  { name, input = {}, output = [] }: ConstantSpec,
) {
  const functionSignatures = Object.keys(input);

  // If input wasn't provided, use the constant name (presumed to be the
  // function signature) to produce the function parameters we need.
  const functionParams =
    functionSignatures.length === 0 ? { [name]: [] } : input;

  const fn = getConstantFn(tailor, functionParams, output);

  // Allow each function signature to be called specifically by adding
  // properties to the constant function
  functionSignatures.forEach(functionSignature => {
    fn[functionSignature] = getConstantFn(
      tailor,
      { [functionSignature]: functionParams[functionSignature] },
      output,
    );
  });

  return fn;
}
