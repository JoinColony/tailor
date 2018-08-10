/* @flow */

import type { MethodSpec, FunctionParams } from '../../interface/ContractSpec';
import getFunctionCall from '../getFunctionCall';
// eslint-disable-next-line import/no-cycle
import Transaction from '../Transaction';
// eslint-disable-next-line import/no-cycle
import Lighthouse from '../../Lighthouse';

function isOptions(input: any) {
  return (
    typeof input === 'object' &&
    (typeof input.gas === 'number' || typeof input.value === 'number')
  );
}

function getMethodFn(
  lighthouse: Lighthouse,
  functionParams: FunctionParams,
  isPayable,
) {
  return function method(...inputParams: any) {
    const options = isOptions(inputParams[inputParams.length - 1])
      ? inputParams.pop()
      : {};
    if (!isPayable && options.value)
      throw new Error('Cannot send a value to a non-payable function');

    const functionCall = getFunctionCall(functionParams, ...inputParams);
    return new Transaction(lighthouse, {
      functionCall,
      ...options,
    });
  };
}

/*
 * Given a specification for a method function, eeturn an async function
 * which can be called with any valid input.
 */
export default function methodFactory(
  lighthouse: *,
  { name, input = {}, isPayable }: MethodSpec,
) {
  const functionSignatures = Object.keys(input);

  // If input wasn't provided, use the method name (presumed to be the
  // function signature) to produce the function parameters we need.
  const functionParams =
    functionSignatures.length === 0 ? { [name]: [] } : input;

  const fn = getMethodFn(lighthouse, functionParams, isPayable);

  // Allow each function signature to be called specifically by adding
  // properties to the method function
  functionSignatures.forEach(functionSignature => {
    fn[functionSignature] = getMethodFn(
      lighthouse,
      { [functionSignature]: functionParams[functionSignature] },
      isPayable,
    );
  });

  return fn;
}
