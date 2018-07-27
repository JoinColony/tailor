/* @flow */

import type { ParamsSpec } from '../../interface/Params';

export function convertInput(spec: ParamsSpec, ...input: any): Array<any> {
  return (
    spec
      // Get the input value (or default value)
      .map(({ name, defaultValue, type }, index) => {
        // Support either objects with named parameters or sequential parameters
        const inputValue =
          (typeof input[0] === 'object' && input[0][name]) || input[index];
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

export function convertOutput(spec: ParamsSpec, ...output: Array<any>): Object {
  return spec.reduce((acc, { name, type }, index) => {
    const value = output[index];
    acc[name] = type.convertOutput ? type.convertOutput(value) : value;
    return acc;
  }, {});
}

export function findMatchingSpecs(
  specs: Array<ParamsSpec>,
  ...input: any
): Array<ParamsSpec> {
  // Get the length of the input (object or array of values)
  const inputLength =
    (typeof input[0] === 'object' && Object.keys(input[0]).length) ||
    input.length;

  // Try and find specs of the same size as the input
  const specsOfExactSize = specs.filter(spec => spec.length === inputLength);
  if (specsOfExactSize.length) return specsOfExactSize;

  // Fall back to the longest specs
  return specs
    .sort((a, b) => b.length - a.length)
    .filter((spec, i, [longest]) => spec.length === longest.length);
}
