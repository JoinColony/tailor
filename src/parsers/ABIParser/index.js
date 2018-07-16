/* @flow */

import type {
  ABI,
  ABIEntry,
  ABIParam,
  ConstantSpec,
  EventSpec,
  IParser,
  MethodSpec,
  ParamsSpec,
  ParamType,
} from '../flowtypes';

import { TYPE_PATTERN_MAP } from './constants';

const assert = require('assert');

export default class ABIParser implements IParser {
  static parseFieldName(name?: string, index: number) {
    return (
      // Remove initial `_` from the given name
      (typeof name === 'string' && name.length && name.replace(/^_/, '')) ||
      // Use a generic name if none was supplied
      `field_${index}`
    );
  }

  static parseTupleType(components: Array<ABIParam>): ParamType {
    const tupleTypes = components.map(({ name, type }, index) => [
      this.parseFieldName(name, index),
      this.parseType(type),
    ]);
    const convert = (
      converter: 'convertInput' | 'convertOutput',
      value: Object,
    ) =>
      tupleTypes.reduce((acc, [name, type]) => {
        const fn = type[converter];
        acc[name] = typeof fn === 'function' ? fn(value[name]) : value[name];
        return acc;
      }, {});

    return {
      convertInput: convert.bind(this, 'convertInput'),
      convertOutput: convert.bind(this, 'convertOutput'),
      // TODO does this validate fn need more context? (field name)
      validate(value: *) {
        assert(typeof value === 'object', 'Must be an object');
        return tupleTypes.every(([name, type]) => type.validate(value[name]));
      },
    };
  }

  static parseType(
    solidityType: string,
    components?: Array<ABIParam>,
  ): ParamType {
    if (solidityType === 'tuple' && components && components.length)
      return this.parseTupleType(components);

    for (const [type, pattern] of TYPE_PATTERN_MAP) {
      if (solidityType.match(pattern)) return type;
    }

    throw new Error(`Type "${solidityType}" could not be matched`);
  }

  static parseParams(params: Array<ABIParam>, methodName: string): ParamsSpec {
    return params.map(({ name, type, components }, index) => {
      if (!name)
        // eslint-disable-next-line no-console
        console.warn(
          `No name supplied for field of type "${type}" ` +
            `of method "${methodName}"`,
        );

      return {
        name: this.parseFieldName(name, index),
        type: this.parseType(type, components),
      };
    });
  }

  static parseMethodSpec({
    inputs = [],
    name,
    outputs = [],
    payable,
  }: ABIEntry): MethodSpec {
    return {
      input: this.parseParams(inputs, name),
      isPayable: Boolean(payable),
      name,
      output: this.parseParams(outputs, name),
    };
  }

  static parseEventSpec({ name, inputs = [] }: ABIEntry): EventSpec {
    return {
      name,
      output: this.parseParams(inputs, name),
    };
  }

  static parseConstantSpec({
    name,
    inputs = [],
    outputs = [],
  }: ABIEntry): ConstantSpec {
    return {
      input: this.parseParams(inputs, name),
      name,
      // For public variables: if there are no inputs, and only one (unnamed)
      // output, use the function name as the output name.
      output: this.parseParams(
        inputs.length === 0 && outputs.length === 1
          ? outputs.map(output => ({ ...output, name: output.name || name }))
          : outputs,
        name,
      ),
    };
  }

  static parseABI(abi: ABI) {
    return abi.filter(({ type }) => type !== 'constructor').reduce(
      (acc, entry) => {
        if (entry.type === 'event') {
          acc.events.push(this.parseEventSpec(entry));
        } else if (
          entry.stateMutability === 'view' ||
          entry.stateMutability === 'pure'
        ) {
          acc.constants.push(this.parseConstantSpec(entry));
        } else {
          acc.methods.push(this.parseMethodSpec(entry));
        }
        return acc;
      },
      {
        constants: [],
        events: [],
        methods: [],
      },
    );
  }

  parse(contractData: *) {
    assert(Array.isArray(contractData.abi), 'Expected an "abi" property');
    return Object.create({
      contractData,
      ...this.constructor.parseABI(contractData.abi),
    });
  }
}
