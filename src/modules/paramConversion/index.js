/* @flow */

import type { ParamsSpec } from '../../interface/Params';
import type { FunctionParams } from '../../interface/ContractSpec';
import type { FunctionSignature } from '../../interface/Adapter';

/*
 * Given a specification for parameters and input values, use the spec to
 * collect matching input values, validating them and converting them as needed.
 * Can throw validation errors.
 */
export function convertInput(spec: ParamsSpec = [], ...input: any): Array<any> {
  return (
    spec
      // Get the input value (or default value)
      .map(({ name, defaultValue, type }, index) => {
        // Support either objects with named parameters or sequential parameters
        const inputValue =
          typeof input[0] === 'object' &&
          Object.hasOwnProperty.call(input[0], name)
            ? input[0][name]
            : input[index];
        const value =
          typeof inputValue !== 'undefined' ? inputValue : defaultValue;
        return {
          name,
          type,
          value,
        };
      })
      // Validate the value against the type (can throw validation errors)
      .filter(({ name, type, value }) => {
        try {
          type.validate(value);
        } catch (error) {
          throw new Error(
            `Validation for field "${name}" failed: ${error.message}`,
          );
        }
        return true;
      })
      // Convert the input value for the type (if necessary)
      .map(
        ({ type, value }) =>
          type.convertInput ? type.convertInput(value) : value,
      )
  );
}

export function convertResultObj(
  length: number,
  resultObj: {
    [paramIndexOrName: number | string]: *,
  },
): Array<*> {
  const output = [];
  for (let i = 0; i < length; i += 1) {
    output[i] = resultObj[i];
  }
  return output;
}

/*
 * Given a specification for parameters and output values, use the spec
 * to collect the matching output values, converting them if necessary.
 */
export function convertOutput(spec: ParamsSpec = [], ...output: Array<any>) {
  return spec.reduce((acc, { name, type }, index) => {
    const value = output[index];
    acc[name] = type.convertOutput ? type.convertOutput(value) : value;
    return acc;
  }, {});
}

/*
 * Given a set of function params and input values, try and find function
 * signatures with the same number of params as the input; failing that,
 * fall back to the signatures with the most params.
 */
export function findMatchingFunctionSignatures(
  functionParams: FunctionParams,
  ...input: any
): Array<FunctionSignature> {
  const functionSignatures = Object.keys(functionParams);

  // Get the length of the input (object or array of values)
  const inputLength =
    (typeof input[0] === 'object' && Object.keys(input[0]).length) ||
    input.length;

  // Try and find signatures with the same number of params as the input
  const sigsOfExactSize = functionSignatures.filter(
    signature => functionParams[signature].length === inputLength,
  );
  if (sigsOfExactSize.length) return sigsOfExactSize;

  // Fall back to the signatures with the most params
  const sorted = functionSignatures.sort(
    (a, b) => functionParams[b].length - functionParams[a].length,
  );
  return sorted.filter(
    (sig, i, [first]) =>
      functionParams[sig].length === functionParams[first].length,
  );
}
