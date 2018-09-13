/* eslint-env jest */
/* eslint-disable no-underscore-dangle */

import createSandbox from 'jest-sandbox';
import BigNumber from 'bn.js';

import methodFactory from '../index';
import PARAM_TYPES from '../../paramTypes';
import Transaction from '../../transactions/ContractTransaction';

describe('Methods', () => {
  const sandbox = createSandbox();

  const result = { z: 3 };

  const mockTailor = {
    adapter: {
      wallet: {
        address: 'wallet address',
      },
      call: sandbox.fn().mockResolvedValue([result.z]),
      encodeFunctionCall: sandbox
        .fn()
        .mockReturnValue('encoded function call data'),
    },
  };

  beforeEach(() => {
    sandbox.clear();
  });

  const inputs = {
    'myMethod(uint)': [
      {
        name: 'a',
        type: PARAM_TYPES.INTEGER,
      },
    ],
    'myMethod(bool)': [
      {
        name: 'a',
        type: PARAM_TYPES.BOOLEAN,
      },
    ],
    'myMethod(uint,bool)': [
      {
        name: 'a',
        type: PARAM_TYPES.INTEGER,
      },
      {
        name: 'b',
        type: PARAM_TYPES.BOOLEAN,
      },
    ],
    'myMethod(uint,uint)': [
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

  test('Creating a method function (no input)', async () => {
    const spec = {
      name: 'myMethod',
    };

    const method = methodFactory(mockTailor, spec);
    expect(method).toEqual(expect.any(Function));

    const tx = method();
    expect(tx).toBeInstanceOf(Transaction);
    expect(tx._tailor).toBe(mockTailor);
    expect(tx.gas).toBe(null);

    const txWithOptions = method({ gas: 1000 });
    expect(txWithOptions.gas.toNumber()).toBe(1000);
  });

  test('Creating a method function (with input)', async () => {
    const spec = {
      name: 'myMethod',
      input: {
        'myMethod(uint)': inputs['myMethod(uint)'],
      },
    };

    const method = methodFactory(mockTailor, spec);
    expect(method).toEqual(expect.any(Function));
    expect(method['myMethod(uint)']).toEqual(expect.any(Function));

    const tx = method(1);
    expect(tx).toBeInstanceOf(Transaction);
    expect(tx._tailor).toBe(mockTailor);
    expect(tx.gas).toBe(null);

    const txWithOptions = method(1, { gas: new BigNumber(1000) });
    expect(txWithOptions.gas.toNumber()).toEqual(1000);
  });

  test('Creating a method function (payable)', async () => {
    const spec = {
      name: 'myMethod',
      input: {
        'myMethod(uint)': inputs['myMethod(uint)'],
      },
      isPayable: true,
    };

    const payableMethod = methodFactory(mockTailor, spec);
    expect(payableMethod).toEqual(expect.any(Function));

    const tx = payableMethod(1);
    expect(tx).toBeInstanceOf(Transaction);
    expect(tx._tailor).toBe(mockTailor);
    expect(tx.gas).toBe(null);
    expect(tx.value).toEqual(new BigNumber(0));

    const txWithOptions = payableMethod(1, { value: 1000 });
    expect(txWithOptions.value.toNumber()).toEqual(1000);

    const nonPayableMethod = methodFactory(
      mockTailor,
      Object.assign({}, spec, { isPayable: false }),
    );
    expect(() => {
      nonPayableMethod(1, { value: 1000 });
    }).toThrow('Cannot send a value to a non-payable function');
  });

  test('Creating an overloaded method function', async () => {
    const spec = {
      name: 'myMethod',
      input: inputs,
    };

    const method = methodFactory(mockTailor, spec);
    expect(method).toEqual(expect.any(Function));
    expect(method['myMethod(uint)']).toEqual(expect.any(Function));
    expect(method['myMethod(bool)']).toEqual(expect.any(Function));
    expect(method['myMethod(uint,bool)']).toEqual(expect.any(Function));
    expect(method['myMethod(uint,uint)']).toEqual(expect.any(Function));

    // All valid
    expect(() => {
      method(1);
      method(true);
      method(1, true);
      method(1, 1);

      method['myMethod(uint)'](1);
      method['myMethod(bool)'](true);
      method['myMethod(uint,bool)'](1, true);
      method['myMethod(uint,uint)'](1, 1);
    }).not.toThrow();

    const overloadedError = 'Errors creating overloaded function call';
    expect(() => {
      method();
    }).toThrow(overloadedError);
    expect(() => {
      method(1, 'bad input');
    }).toThrow(overloadedError);
    expect(() => {
      method(true, true);
    }).toThrow(overloadedError);

    expect(() => {
      method['myMethod(bool)'](1);
    }).toThrow('Validation for field "a" failed: Must be a boolean');
  });
});
