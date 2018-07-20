/* @flow */

export type ParamType = {
  convertInput?: (input: *) => *,
  convertOutput?: (output: *) => *,
  validate: (input: *) => boolean,
};

export type ParamSpec = {
  defaultValue?: *,
  name: string,
  type: ParamType,
};

export type ParamsSpec = Array<ParamSpec>;
