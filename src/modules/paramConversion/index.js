/* @flow */

import isPlainObject from 'lodash.isplainobject';

import type { ParamsSpec } from '../../interface/Params';

export function convertInput(spec: ParamsSpec, ...input: any): Array<any> {
  // Determine whether the input is an object with named parameters (as opposed
  // to sequential values) by examining the first item
  const isObject = input.length === 1 && isPlainObject(input[0]);

  return (
    spec
      // Get the input value (or default value)
      .map(({ name, defaultValue, type }, index) => {
        const inputValue = isObject ? input[0][name] : input[index];
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
