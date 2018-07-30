/* @flow */

import type { FunctionCall, FunctionSignature } from '../../interface/Adapter';
import type {
  ConstantSpec,
  FunctionParams,
} from '../../interface/ContractSpec';
import {
  convertInput,
  convertOutput,
  findMatchingFunctionSignatures,
} from '../paramConversion';

/*
 * Given function parameters, a function signature and input,
 * simply return a function call.
 */
function getSingleFunctionCall(
  functionParams: FunctionParams,
  functionSignature: FunctionSignature,
  ...inputParams: any
): FunctionCall {
  const paramsSpec = functionParams[functionSignature];
  return {
    args: convertInput(paramsSpec, ...inputParams),
    functionSignature,
  };
}

/*
 * Given function parameters and input, find matching function signatures for
 * those values, and attempt to get a valid function call for each signature
 * in turn; return once a valid signature is identified.
 * Failing that, errors for each attempted function signature are reported.
 */
function getOverloadedFunctionCall(
  functionParams: FunctionParams,
  ...inputParams: any
): FunctionCall {
  let args;
  let functionSignature;
  const errors = [];

  findMatchingFunctionSignatures(functionParams, ...inputParams).forEach(
    signature => {
      if (args && functionSignature) return;

      const paramsSpec = functionParams[signature];
      try {
        args = convertInput(paramsSpec, ...inputParams);
        functionSignature = signature;
      } catch (error) {
        errors.push(`For signature "${signature}": ${error.message}`);
      }
    },
  );

  if (args && functionSignature) return { args, functionSignature };

  throw new Error(
    `Errors creating overloaded function call:\n${errors.join('\n')}`,
  );
}

/*
 * Given function parameters and input values, return a function call, based on
 * either a single function signature, or finding the appropriate overloaded
 * function signature for that input.
 */
function getFunctionCall(
  functionParams: FunctionParams,
  ...inputParams: any
): FunctionCall {
  const functionSignatures = Object.keys(functionParams);

  return functionSignatures.length === 1
    ? getSingleFunctionCall(
        functionParams,
        functionSignatures[0],
        ...inputParams,
      )
    : getOverloadedFunctionCall(functionParams, ...inputParams);
}

function getConstantFn(lighthouse: *, functionParams: FunctionParams, output) {
  return async function constant(...inputParams: any) {
    const fnCall = getFunctionCall(functionParams, ...inputParams);
    const callResult = await lighthouse.adapter.call(fnCall);
    return convertOutput(output, ...callResult);
  };
}

/*
 * Given a specification for a constant function, eeturn an async function
 * which can be called with any valid input.
 */
export default function constantFactory(
  lighthouse: *,
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
