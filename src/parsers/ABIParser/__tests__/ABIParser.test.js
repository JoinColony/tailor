/* eslint-env jest */
/* eslint-disable no-console,camelcase */

import createSandbox from 'jest-sandbox';
import BigNumber from 'bn.js';

import ABIParser from '../index';
import MetaCoinABI from '../__fixtures__/MetaCoinABI';

import {
  ADDRESS_TYPE,
  BIG_INTEGER_TYPE,
  BOOLEAN_TYPE,
} from '../../../modules/paramTypes';

const [
  lastSenderABI,
  constructorABI,
  transferOverloadedABI,
  transferABI,
  sendCoinABI,
] = MetaCoinABI.abi;

const contractData = Object.assign(
  { address: '0x7da82c7ab4771ff031b66538d2fb9b0b047f6cf9' },
  MetaCoinABI,
);

describe('ABIParser', () => {
  const sandbox = createSandbox();

  beforeEach(() => {
    sandbox.clear();
  });

  test('It should provide a name', () => {
    expect(ABIParser.name).toEqual('abi');
  });

  test('It parses contract specs from a JSON ABI', () => {
    const parser = new ABIParser();
    sandbox.spyOn(parser.constructor, 'parseABI');
    sandbox.spyOn(parser.constructor, 'parseMethodSpec');
    sandbox.spyOn(parser.constructor, 'parseEventSpec');
    sandbox.spyOn(parser.constructor, 'parseConstantSpec');

    const result = parser.parse(contractData);

    expect(parser.constructor.parseABI).toHaveBeenCalled();

    // The constructor function should not be parsed
    expect(parser.constructor.parseMethodSpec).not.toHaveBeenCalledWith(
      constructorABI,
    );
    expect(parser.constructor.parseEventSpec).not.toHaveBeenCalledWith(
      constructorABI,
    );
    expect(parser.constructor.parseConstantSpec).not.toHaveBeenCalledWith(
      constructorABI,
    );

    expect(result).toHaveProperty('constants', {
      getBalance: expect.any(Object),
      getBalanceInEth: expect.any(Object),
      lastSender: expect.any(Object),
      overloaded: expect.any(Object),
    });
    expect(result.constants.overloaded).toEqual({
      name: 'overloaded',
      input: {
        'overloaded(uint256,uint256,uint256)': [
          {
            name: 'a',
            type: BIG_INTEGER_TYPE,
          },
          {
            name: 'b',
            type: BIG_INTEGER_TYPE,
          },
          {
            name: 'c',
            type: BIG_INTEGER_TYPE,
          },
        ],
        'overloaded(uint256,uint256)': [
          {
            name: 'a',
            type: BIG_INTEGER_TYPE,
          },
          {
            name: 'b',
            type: BIG_INTEGER_TYPE,
          },
        ],
        'overloaded(uint256,bool)': [
          {
            name: 'a',
            type: BIG_INTEGER_TYPE,
          },
          {
            name: 'b',
            type: BOOLEAN_TYPE,
          },
        ],
        'overloaded(bool,bool)': [
          {
            name: 'a',
            type: BOOLEAN_TYPE,
          },
          {
            name: 'b',
            type: BOOLEAN_TYPE,
          },
        ],
      },
      output: [
        {
          name: 'sum',
          type: BIG_INTEGER_TYPE,
        },
      ],
    });
    expect(result).toHaveProperty(
      'events',
      expect.objectContaining({ Transfer: expect.any(Object) }),
    );
    expect(result).toHaveProperty(
      'methods',
      expect.objectContaining({ sendCoin: expect.any(Object) }),
    );
    expect(result).toHaveProperty('address', contractData.address);
  });

  test('It parses method specs', () => {
    const parser = new ABIParser();
    sandbox.spyOn(parser.constructor, 'parseParams');

    expect(parser.constructor.parseMethodSpec([sendCoinABI])).toEqual({
      name: 'sendCoin',
      input: {
        'sendCoin(address,uint256)': [
          {
            name: 'receiver',
            type: ADDRESS_TYPE,
          },
          {
            name: 'amount',
            type: BIG_INTEGER_TYPE,
          },
        ],
      },
      output: [
        {
          name: 'sufficient',
          type: BOOLEAN_TYPE,
        },
      ],
      isPayable: false,
      type: 'contract',
    });
    expect(parser.constructor.parseParams).toHaveBeenCalledWith(
      sendCoinABI.inputs,
      sendCoinABI.name,
    );
    expect(parser.constructor.parseParams).toHaveBeenCalledWith(
      sendCoinABI.outputs,
      sendCoinABI.name,
    );
    parser.constructor.parseParams.mockClear();

    const noInputs = 'test without inputs or outputs';
    expect(
      parser.constructor.parseMethodSpec([
        {
          name: noInputs,
          constant: false,
          stateMutability: 'nonpayable',
          type: 'function',
        },
      ]),
    ).toEqual({
      name: noInputs,
      input: {
        [`${noInputs}()`]: [],
      },
      output: [],
      isPayable: false,
      type: 'contract',
    });
    expect(parser.constructor.parseParams).toHaveBeenCalledTimes(2);
    expect(parser.constructor.parseParams).toHaveBeenCalledWith([], noInputs);
    parser.constructor.parseParams.mockClear();
  });

  test('It parses constant specs', () => {
    const parser = new ABIParser();
    sandbox.spyOn(parser.constructor, 'parseParams');

    expect(parser.constructor.parseConstantSpec([lastSenderABI])).toEqual({
      input: {
        [`${lastSenderABI.name}()`]: [],
      },
      name: lastSenderABI.name,
      output: [
        {
          name: lastSenderABI.name,
          type: ADDRESS_TYPE,
        },
      ],
    });
    expect(parser.constructor.parseParams).toHaveBeenCalledWith(
      [],
      lastSenderABI.name,
    );
    expect(parser.constructor.parseParams).toHaveBeenCalledWith(
      [{ type: 'address', name: lastSenderABI.name }],
      lastSenderABI.name,
    );
    parser.constructor.parseParams.mockClear();

    const noInputsOrOutputsName = 'no inputs or outputs';
    expect(
      parser.constructor.parseConstantSpec([
        {
          name: noInputsOrOutputsName,
        },
      ]),
    ).toEqual({
      input: {
        [`${noInputsOrOutputsName}()`]: [],
      },
      output: [],
      name: noInputsOrOutputsName,
    });
    expect(parser.constructor.parseParams).toHaveBeenCalledTimes(2);
    expect(parser.constructor.parseParams).toHaveBeenCalledWith(
      [],
      noInputsOrOutputsName,
    );
  });

  test('It parses event specs', () => {
    const parser = new ABIParser();
    sandbox.spyOn(parser.constructor, 'parseParams');

    expect(
      parser.constructor.parseEventSpec([transferABI, transferOverloadedABI]),
    ).toEqual({
      name: transferABI.name,
      output: {
        'Transfer()': [],
        'Transfer(address,address,uint256)': [
          {
            name: 'from',
            type: ADDRESS_TYPE,
          },
          {
            name: 'to',
            type: ADDRESS_TYPE,
          },
          {
            name: 'value',
            type: BIG_INTEGER_TYPE,
          },
        ],
      },
    });
    expect(parser.constructor.parseParams).toHaveBeenCalledWith(
      transferABI.inputs,
      transferABI.name,
    );
    parser.constructor.parseParams.mockClear();

    const noInputsName = 'no inputs';
    expect(
      parser.constructor.parseEventSpec([
        {
          name: noInputsName,
        },
      ]),
    ).toEqual({
      output: {
        'no inputs()': [],
      },
      name: noInputsName,
    });
    expect(parser.constructor.parseParams).toHaveBeenCalledTimes(1);
    expect(parser.constructor.parseParams).toHaveBeenCalledWith(
      [],
      noInputsName,
    );
  });

  test('It parses ABI types', () => {
    const parser = new ABIParser();
    sandbox
      .spyOn(parser.constructor, 'parseTupleType')
      .mockImplementationOnce(() => 'parsed tuple components');

    const components = ['components'];
    expect(
      parser.constructor.parseType('tuple', 'tupleFieldName', components),
    ).toEqual('parsed tuple components');
    expect(parser.constructor.parseTupleType).toHaveBeenCalledWith(components);

    expect(parser.constructor.parseType('address')).toEqual(ADDRESS_TYPE);

    expect(parser.constructor.parseType('uint8')).toEqual(BIG_INTEGER_TYPE);

    expect(() => {
      parser.constructor.parseType('an invalid type');
    }).toThrow('Type "an invalid type" could not be matched');
  });

  test('It parses tuple types', () => {
    const parser = new ABIParser();
    sandbox.spyOn(parser.constructor, 'parseFieldName');
    sandbox.spyOn(parser.constructor, 'parseType');

    const components = [
      {
        type: 'address',
        name: 'the_address',
      },
      {
        type: 'uint8',
        name: 'id',
      },
    ];

    const tupleType = parser.constructor.parseTupleType(components);
    expect(tupleType).toEqual({
      name: 'tuple',
      convertInput: expect.any(Function),
      convertOutput: expect.any(Function),
      validate: expect.any(Function),
    });
    expect(parser.constructor.parseFieldName).toHaveBeenCalledWith(
      'the_address',
      0,
    );
    expect(parser.constructor.parseFieldName).toHaveBeenCalledWith('id', 1);
    expect(parser.constructor.parseType).toHaveBeenCalledWith(
      'address',
      'the_address',
    );
    expect(parser.constructor.parseType).toHaveBeenCalledWith('uint8', 'id');

    const the_address = '0x7da82c7ab4771ff031b66538d2fb9b0b047f6cf9';
    expect(() => tupleType.validate()).toThrow('Must be an object');
    expect(() => tupleType.validate({ the_address: 'abc', id: 123 })).toThrow(
      'Must be a valid address',
    );
    expect(tupleType.validate({ the_address, id: 123 })).toBe(true);
    expect(tupleType.convertInput({ the_address, id: 123 })).toEqual({
      the_address,
      id: 123,
    });
    expect(
      tupleType.convertOutput({ the_address, id: new BigNumber(123) }),
    ).toEqual({
      the_address,
      id: 123,
    });

    const input = { id: 1 };
    const output = { id: 'one' };
    const idType = {
      name: 'integer',
      validate: sandbox.fn(),
      convertInput: undefined, // parseTupleType should pass through the input
      convertOutput: sandbox.fn().mockReturnValue(output.id),
    };

    parser.constructor.parseType.mockReturnValueOnce(idType);
    const tupleTypeWithoutConversion = parser.constructor.parseTupleType([
      {
        type: 'uint8',
        name: 'id',
      },
    ]);

    // convertInput/convertOutput functions should have been created
    expect(tupleTypeWithoutConversion).toEqual({
      name: 'tuple',
      validate: expect.any(Function),
      convertInput: expect.any(Function),
      convertOutput: expect.any(Function),
    });

    // The validate fn for the tuple should call the validate fn for the type
    tupleTypeWithoutConversion.validate(input);
    expect(idType.validate).toHaveBeenCalledWith(1);

    // The input should pass through
    expect(tupleTypeWithoutConversion.convertInput(input)).toEqual(input);

    // The output fn for the tuple should call the output fn for the type
    expect(tupleTypeWithoutConversion.convertOutput(input)).toEqual(output);
    expect(idType.convertOutput).toHaveBeenCalledWith(1);
  });

  test('It parses params', () => {
    const parser = new ABIParser();
    sandbox.spyOn(parser.constructor, 'parseType');
    sandbox.spyOn(parser.constructor, 'parseFieldName');
    sandbox.spyOn(console, 'warn');

    expect(
      parser.constructor.parseParams(lastSenderABI.outputs, lastSenderABI.name),
    ).toEqual([
      {
        name: 'field_0',
        type: ADDRESS_TYPE,
      },
    ]);
    expect(parser.constructor.parseType).toHaveBeenCalledWith(
      lastSenderABI.outputs[0].type,
      '',
      undefined,
    );
    expect(parser.constructor.parseFieldName).toHaveBeenCalledWith('', 0);
    expect(console.warn).toHaveBeenCalledWith(
      'No name supplied for field of type "address" of method "lastSender"',
    );
  });
});
