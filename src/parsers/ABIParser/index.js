/* @flow */
/* eslint-disable no-restricted-syntax */

import { isAddress } from 'web3-utils';

import type {
  ABI,
  ABIEntry,
  ABIParam,
  ConstantSpec,
  EntryGroupsByType,
  EventSpec,
  MethodSpec,
  ParamsSpec,
  ParamType,
  SpecType,
} from '../flowtypes';

import { TYPE_PATTERN_MAP, SPEC_TYPES } from './constants';
import Parser from '../Parser';

const assert = require('assert');

export default class ABIParser extends Parser {
  static get name() {
    return 'abi';
  }

  static parseFieldName(name: ?string, index: number) {
    return (
      // Remove initial `_` from the given name
      (typeof name === 'string' && name.length && name.replace(/^_/, '')) ||
      // Use a generic name if none was supplied
      `field_${index}`
    );
  }

  /*
   * Given tuple components from an ABI entry, parse them to get a
   * custom ParamType.
   */
  static parseTupleType(components: Array<ABIParam>): ParamType {
    const tupleTypes = components.map(({ name, type }, index) => [
      this.parseFieldName(name, index),
      this.parseType(type, name),
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
      name: 'tuple',
      convertInput: convert.bind(this, 'convertInput'),
      convertOutput: convert.bind(this, 'convertOutput'),
      validate(value: *) {
        assert(typeof value === 'object', 'Must be an object');
        return tupleTypes.every(([name, type]) => type.validate(value[name]));
      },
    };
  }

  /*
   * Given a solidity type (including tuples), parse it to get the ParamType.
   */
  static parseType(
    solidityType: string,
    fieldName?: string,
    components?: Array<ABIParam>,
  ): ParamType {
    if (solidityType === 'tuple' && components && components.length)
      return this.parseTupleType(components);

    // Firstly find a type from the Solidity type
    for (const [pattern, { type, nameMap }] of TYPE_PATTERN_MAP) {
      if (solidityType.match(pattern)) {
        // If available, find a type from the field name
        if (fieldName && nameMap) {
          for (const [namePattern, { type: typeFromName }] of nameMap) {
            if (fieldName.match(namePattern)) return typeFromName;
          }
        }
        // Otherwise, return the type we found from the Solidity type
        return type;
      }
    }

    throw new Error(`Type "${solidityType}" could not be matched`);
  }

  /*
   * Given an array of ABI parameters (inputs or outputs), parse the parameters
   * to get a ParamsSpec
   */
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
        type: this.parseType(type, name, components),
      };
    });
  }

  static parseFunctionParams(entries: Array<ABIEntry>) {
    const [{ name }] = entries;
    return entries.reduce((acc, { inputs = [] }) => {
      const signature = `${name}(${inputs.map(({ type }) => type).join(',')})`;
      acc[signature] = this.parseParams(inputs, name);
      return acc;
    }, {});
  }

  /*
   * Given ABI entries for a method (presumed to be of the same name,
   * i.e. for overloading), parse the spec.
   */
  static parseMethodSpec(entries: Array<ABIEntry>): MethodSpec {
    const { name, payable, outputs = [] } = entries[0];
    return {
      input: this.parseFunctionParams(entries),
      isPayable: Boolean(payable),
      name,
      output: this.parseParams(outputs, name),
      type: 'contract',
    };
  }

  /*
   * Given ABI entries for an event (presumed to be of the same name,
   * i.e. for overloading), parse the spec.
   */
  static parseEventSpec(entries: Array<ABIEntry>): EventSpec {
    const { name } = entries[0];
    return {
      name,
      output: this.parseFunctionParams(entries),
    };
  }

  /*
   * Given ABI entries for a constant (presumed to be of the same name,
   * i.e. for overloading), parse the spec.
   */
  static parseConstantSpec(entries: Array<ABIEntry>): ConstantSpec {
    const { name, outputs = [], inputs: firstInputs = [] } = entries[0];
    return {
      input: this.parseFunctionParams(entries),
      name,
      // For public variables: if there are no inputs, and only one (unnamed)
      // output, use the function name as the output name.
      output: this.parseParams(
        firstInputs.length === 0 && outputs.length === 1
          ? outputs.map(output => ({ ...output, name: output.name || name }))
          : outputs,
        name,
      ),
    };
  }

  /*
   * Given an ABI entry, get its type.
   */
  static getSpecType(entry: ABIEntry): SpecType {
    if (entry.type === 'event') return SPEC_TYPES.EVENTS;

    if (entry.stateMutability === 'view' || entry.stateMutability === 'pure')
      return SPEC_TYPES.CONSTANTS;

    return SPEC_TYPES.METHODS;
  }

  /*
   * Given a type and ABI entries, parse the entries to return a spec
   * for the type in question.
   */
  static parseSpecForType(specType: SpecType, entries: Array<ABIEntry>) {
    if (specType === SPEC_TYPES.CONSTANTS)
      return this.parseConstantSpec(entries);

    if (specType === SPEC_TYPES.EVENTS) return this.parseEventSpec(entries);

    return this.parseMethodSpec(entries);
  }

  /*
   * Given ABI entries, filter out the unsupported types, group by type,
   * then group by entry name.
   */
  static groupABIEntries(abi: ABI) {
    return (
      abi
        // Filter out unsupported types
        .filter(({ type }) => type !== 'constructor')
        // Group by type, then name
        .reduce(
          (acc, entry) => {
            const type = ABIParser.getSpecType(entry);
            acc[type][entry.name] = Array.isArray(acc[type][entry.name])
              ? acc[type][entry.name].concat(entry)
              : [entry];
            return acc;
          },
          {
            constants: {},
            events: {},
            methods: {},
          },
        )
    );
  }

  /*
   * Given ABI entries grouped by type, parse each group to get the
   * correct spec for that type.
   */
  static parseSpecsForGroups(groups: EntryGroupsByType) {
    return Object.keys(groups).reduce(
      (acc, type) => {
        Object.keys(groups[type]).forEach(name => {
          acc[type][name] = this.parseSpecForType(type, groups[type][name]);
        });
        return acc;
      },
      {
        constants: {},
        events: {},
        methods: {},
      },
    );
  }

  static parseABI(abi: ABI) {
    return this.parseSpecsForGroups(this.groupABIEntries(abi));
  }

  parse(contractData: *) {
    assert(Array.isArray(contractData.abi), 'Expected an "abi" property');
    assert(isAddress(contractData.address), 'Expected an "address" property');
    return Object.assign(
      {},
      { address: contractData.address },
      this.constructor.parseABI(contractData.abi),
    );
  }
}
