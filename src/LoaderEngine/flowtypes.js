/* @flow */

export type Validator = [(value: *) => boolean, string];

export type Schema = {
  [fieldName: string]: Validator,
};
