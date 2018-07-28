/* eslint-env jest */

import createSandbox from 'jest-sandbox';

import {
  convertInput,
  convertOutput,
  findMatchingFunctionSignatures,
} from '../index';
import PARAM_TYPES from '../../paramTypes';

describe('Parameter conversion', () => {
  const sandbox = createSandbox();

  beforeEach(() => {
    sandbox.clear();
  });

  test('Converting input values (no values)', () => {
    expect(convertInput(undefined, { itDoesntMatter: 'abc' })).toEqual([]);
    expect(convertInput(undefined)).toEqual([]);
    expect(convertInput([], { itDoesntMatter: 'abc' })).toEqual([]);
    expect(convertInput([])).toEqual([]);
  });

  test('Converting input values (one value)', () => {
    const spec = [
      {
        name: 'id',
        type: PARAM_TYPES.INTEGER,
      },
    ];

    const validateNumber = sandbox.spyOn(spec[0].type, 'validate');

    const expectation = [3];
    expect(convertInput(spec, { id: 3 })).toEqual(expectation);
    expect(convertInput(spec, 3)).toEqual(expectation);
    expect(validateNumber).toHaveBeenCalledWith(3);
  });

  test('Converting input values (one object value)', () => {
    const spec = [
      {
        name: 'myObject',
        type: {
          validate: sandbox.fn().mockReturnValue(true),
          convertInput: sandbox.fn().mockImplementation(input => input.abc),
        },
      },
    ];

    const validateObj = sandbox.spyOn(spec[0].type, 'validate');

    const expectation = [123];
    const obj = { abc: 123 };

    expect(convertInput(spec, { myObject: obj })).toEqual(expectation);
    expect(validateObj).toHaveBeenCalledWith(obj);
    validateObj.mockClear();

    expect(convertInput(spec, obj)).toEqual(expectation);
    expect(validateObj).toHaveBeenCalledWith(obj);
  });

  test('Converting input values (multiple values)', () => {
    const spec = [
      {
        name: 'id',
        type: PARAM_TYPES.INTEGER,
      },
      {
        name: 'isTrue',
        type: PARAM_TYPES.BOOLEAN,
      },
    ];

    const validateNumber = sandbox.spyOn(spec[0].type, 'validate');
    const validateBoolean = sandbox.spyOn(spec[1].type, 'validate');

    const expectation = [3, true];

    expect(convertInput(spec, { id: 3, isTrue: true })).toEqual(expectation);
    expect(validateNumber).toHaveBeenCalledWith(3);
    expect(validateBoolean).toHaveBeenCalledWith(true);

    validateNumber.mockClear();
    validateBoolean.mockClear();

    expect(convertInput(spec, 3, true)).toEqual(expectation);
    expect(validateNumber).toHaveBeenCalledWith(3);
    expect(validateBoolean).toHaveBeenCalledWith(true);
  });

  test('Converting input values (multiple object values)', () => {
    const objType = {
      validate: sandbox.fn().mockReturnValue(true),
      convertInput: sandbox.fn().mockImplementation(input => input.abc),
    };
    const spec = [
      {
        name: 'myObj1',
        type: objType,
      },
      {
        name: 'myObj2',
        type: objType,
      },
    ];

    const expectation = [123, 234];
    const myObj1 = { abc: 123 };
    const myObj2 = { abc: 234 };

    expect(convertInput(spec, { myObj1, myObj2 })).toEqual(expectation);
    expect(objType.validate).toHaveBeenCalledWith(myObj1);
    expect(objType.validate).toHaveBeenCalledWith(myObj2);
    objType.validate.mockClear();

    expect(convertInput(spec, myObj1, myObj2)).toEqual(expectation);
    expect(objType.validate).toHaveBeenCalledWith(myObj1);
    expect(objType.validate).toHaveBeenCalledWith(myObj2);
  });

  test('Converting input values (default value)', () => {
    const spec = [
      {
        name: 'name',
        type: PARAM_TYPES.STRING,
      },
      {
        name: 'id',
        type: PARAM_TYPES.INTEGER,
        defaultValue: 5,
      },
    ];

    const validateString = sandbox.spyOn(spec[0].type, 'validate');
    const convertStringInput = sandbox.spyOn(spec[0].type, 'convertInput');
    const validateNumber = sandbox.spyOn(spec[1].type, 'validate');

    const expectation = ['0x6a616d6573', 5];

    expect(convertInput(spec, { name: 'james' })).toEqual(expectation);
    expect(validateString).toHaveBeenCalledWith('james');
    expect(validateNumber).toHaveBeenCalledWith(5);
    expect(convertStringInput).toHaveBeenCalledWith('james');

    validateNumber.mockClear();
    validateString.mockClear();
    convertStringInput.mockClear();

    expect(convertInput(spec, 'james')).toEqual(expectation);
    expect(validateString).toHaveBeenCalledWith('james');
    expect(validateNumber).toHaveBeenCalledWith(5);
    expect(convertStringInput).toHaveBeenCalledWith('james');
  });

  test('Converting input values (missing/invalid values)', () => {
    const spec = [
      {
        name: 'name',
        type: PARAM_TYPES.STRING,
      },
      {
        name: 'isTrue',
        type: PARAM_TYPES.BOOLEAN,
      },
    ];

    const validateString = sandbox.spyOn(spec[0].type, 'validate');
    const validateBoolean = sandbox.spyOn(spec[1].type, 'validate');
    const convertStringInput = sandbox.spyOn(spec[0].type, 'convertInput');

    const error = 'Validation for field "isTrue" failed: Must be a boolean';

    const clearMocks = () => {
      validateString.mockClear();
      convertStringInput.mockClear();
      validateBoolean.mockClear();
    };

    expect(() => {
      convertInput(spec, { name: 'james' });
    }).toThrow(error);
    expect(validateString).toHaveBeenCalledWith('james');
    expect(convertStringInput).not.toHaveBeenCalled();
    expect(validateBoolean).toHaveBeenCalledWith(undefined);

    clearMocks();

    expect(() => {
      convertInput(spec, 'james');
    }).toThrow(error);
    expect(validateString).toHaveBeenCalledWith('james');
    expect(validateBoolean).toHaveBeenCalledWith(undefined);
    expect(convertStringInput).not.toHaveBeenCalled();

    clearMocks();

    expect(() => {
      convertInput(spec, { name: 'james', isTrue: 'true' });
    }).toThrow(error);
    expect(validateString).toHaveBeenCalledWith('james');
    expect(validateBoolean).toHaveBeenCalledWith('true');
    expect(convertStringInput).not.toHaveBeenCalled();

    clearMocks();

    expect(() => {
      convertInput(spec, 'james', 'true');
    }).toThrow(error);
    expect(validateString).toHaveBeenCalledWith('james');
    expect(validateBoolean).toHaveBeenCalledWith('true');
    expect(convertStringInput).not.toHaveBeenCalled();

    clearMocks();
  });

  test('Converting output values (no values)', () => {
    const spec = [];

    const expectation = {};
    expect(convertOutput(undefined)).toEqual(expectation);
    expect(convertOutput(spec)).toEqual(expectation);

    // Theoretically we shouldn't receive values we don't expect in the spec
    expect(convertOutput(spec, 'itDoesntMatter')).toEqual(expectation);
  });

  test('Converting output values (one value)', () => {
    const spec = [
      {
        name: 'id',
        type: PARAM_TYPES.INTEGER,
      },
    ];

    const expectation = { id: 3 };
    expect(convertOutput(spec, 3)).toEqual(expectation);
  });

  test('Converting output values (multiple values)', () => {
    const spec = [
      {
        name: 'id',
        type: PARAM_TYPES.INTEGER,
      },
      {
        name: 'isTrue',
        type: PARAM_TYPES.BOOLEAN,
      },
      {
        name: 'name',
        type: Object.assign({}, PARAM_TYPES.STRING, {
          convertOutput: sandbox.fn().mockImplementation(value => value),
        }),
      },
    ];

    const id = 3;
    const name = 'james';
    const isTrue = false;
    expect(convertOutput(spec, id, isTrue, name)).toEqual({ id, isTrue, name });
    expect(spec[2].type.convertOutput).toHaveBeenCalledWith(name);
  });

  test('Finding matching specs (for overloading)', () => {
    const functionParams = {
      'myConstant(uint)': [
        {
          name: 'a',
          type: PARAM_TYPES.INTEGER,
        },
      ],
      'myConstant(bool)': [
        {
          name: 'a',
          type: PARAM_TYPES.BOOLEAN,
        },
      ],
      'myConstant(uint,bool)': [
        {
          name: 'a',
          type: PARAM_TYPES.INTEGER,
        },
        {
          name: 'b',
          type: PARAM_TYPES.BOOLEAN,
        },
      ],
      'myConstant(uint,uint)': [
        {
          name: 'a',
          type: PARAM_TYPES.INTEGER,
        },
        {
          name: 'b',
          type: PARAM_TYPES.INTEGER,
        },
      ],
    };

    // No signatures
    expect(findMatchingFunctionSignatures({})).toEqual([]);

    // No input; fall back to the longest
    expect(findMatchingFunctionSignatures(functionParams)).toEqual(
      expect.arrayContaining([
        'myConstant(uint,bool)',
        'myConstant(uint,uint)',
      ]),
    );

    // Sequential arguments
    expect(findMatchingFunctionSignatures(functionParams, 3)).toEqual(
      expect.arrayContaining(['myConstant(uint)', 'myConstant(bool)']),
    );
    expect(findMatchingFunctionSignatures(functionParams, true)).toEqual(
      expect.arrayContaining(['myConstant(uint)', 'myConstant(bool)']),
    );
    expect(findMatchingFunctionSignatures(functionParams, 3, true)).toEqual(
      expect.arrayContaining([
        'myConstant(uint,bool)',
        'myConstant(uint,uint)',
      ]),
    );
    expect(findMatchingFunctionSignatures(functionParams, 3, 3)).toEqual(
      expect.arrayContaining([
        'myConstant(uint,bool)',
        'myConstant(uint,uint)',
      ]),
    );

    // Object argument
    expect(findMatchingFunctionSignatures(functionParams, { a: 3 })).toEqual(
      expect.arrayContaining(['myConstant(uint)', 'myConstant(bool)']),
    );
    expect(findMatchingFunctionSignatures(functionParams, { a: true })).toEqual(
      expect.arrayContaining(['myConstant(uint)', 'myConstant(bool)']),
    );
    expect(
      findMatchingFunctionSignatures(functionParams, { a: 3, b: true }),
    ).toEqual(
      expect.arrayContaining([
        'myConstant(uint,bool)',
        'myConstant(uint,uint)',
      ]),
    );
    expect(
      findMatchingFunctionSignatures(functionParams, { a: 3, b: 3 }),
    ).toEqual(
      expect.arrayContaining([
        'myConstant(uint,bool)',
        'myConstant(uint,uint)',
      ]),
    );
  });
});
