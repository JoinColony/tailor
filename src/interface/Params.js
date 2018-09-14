/* @flow */

export type ParamTypeName = string;

export type ParamType = {
  name: ParamTypeName,
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
