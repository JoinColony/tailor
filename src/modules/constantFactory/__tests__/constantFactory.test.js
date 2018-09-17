/* eslint-env jest */
/* eslint-disable no-underscore-dangle */

import createSandbox from 'jest-sandbox';

import constantFactory from '../index';
import { INTEGER_TYPE, BOOLEAN_TYPE } from '../../paramTypes';

describe('Constants', () => {
  const sandbox = createSandbox();

  const result = { z: 3 };

  const mockTailor = {
    adapter: {
      call: sandbox.fn().mockResolvedValue([result.z]),
    },
  };

  beforeEach(() => {
    sandbox.clear();
  });

  const outputSpec = [
    {
      name: 'z',
      type: INTEGER_TYPE,
    },
  ];
  const inputs = {
    'myConstant(uint)': [
      {
        name: 'a',
        type: INTEGER_TYPE,
      },
    ],
    'myConstant(bool)': [
      {
        name: 'a',
        type: BOOLEAN_TYPE,
      },
    ],
    'myConstant(uint,bool)': [
      {
        name: 'a',
        type: INTEGER_TYPE,
      },
      {
        name: 'b',
        type: BOOLEAN_TYPE,
      },
    ],
    'myConstant(uint,uint)': [
      {
        name: 'a',
        type: INTEGER_TYPE,
      },
      {
        name: 'b',
        type: INTEGER_TYPE,
      },
    ],
  };

  test('Creating a constant function (output only)', async () => {
    const spec = {
      name: 'myConstant',
      output: outputSpec,
    };

    const c = constantFactory(mockTailor, spec);
    expect(c).toEqual(expect.any(Function));

    expect(await c()).toEqual(result);
  });

  test('Creating a constant function (input and output)', async () => {
    const spec = {
      name: 'myConstant',
      output: outputSpec,
      input: {
        'myConstant(uint)': inputs['myConstant(uint)'],
      },
    };

    const c = constantFactory(mockTailor, spec);
    expect(c).toEqual(expect.any(Function));

    expect(await c(1)).toEqual(result);
    expect(await c({ a: 1 })).toEqual(result);

    let errorMessage;
    try {
      await c();
    } catch (error) {
      errorMessage = error.toString();
    }

    expect(errorMessage).toMatch('Validation for field "a" failed');
    expect(errorMessage).not.toMatch('For overloaded function');
  });

  test('Creating a constant function (overloaded, same length)', async () => {
    const spec = {
      name: 'myConstant',
      output: outputSpec,
      input: {
        'myConstant(uint)': inputs['myConstant(uint)'],
        'myConstant(bool)': inputs['myConstant(bool)'],
      },
    };

    const c = constantFactory(mockTailor, spec);
    expect(c).toEqual(expect.any(Function));

    expect(await c(1)).toEqual(result);
    expect(await c(true)).toEqual(result);
    expect(await c({ a: 1 })).toEqual(result);
    expect(await c({ a: true })).toEqual(result);

    let errorMessage;
    try {
      await c();
    } catch (error) {
      errorMessage = error.toString();
    }

    expect(errorMessage).toMatch('Errors creating overloaded function call');
    expect(errorMessage).toMatch(
      // eslint-disable-next-line max-len
      'For signature "myConstant(uint)": Validation for field "a" failed: Must be a valid integer or BigNumber',
    );
    expect(errorMessage).toMatch(
      // eslint-disable-next-line max-len
      'For signature "myConstant(bool)": Validation for field "a" failed: Must be a boolean',
    );
  });

  test('Creating a constant function (overloaded, other lengths)', async () => {
    const spec = {
      name: 'myConstant',
      output: outputSpec,
      input: {
        'myConstant(uint)': inputs['myConstant(uint)'],
        'myConstant(bool)': inputs['myConstant(bool)'],
        'myConstant(uint,bool)': inputs['myConstant(uint,bool)'],
        'myConstant(uint,uint)': inputs['myConstant(uint,uint)'],
      },
    };

    const c = constantFactory(mockTailor, spec);
    expect(c).toEqual(expect.any(Function));

    expect(await c(1)).toEqual(result);
    expect(await c(true)).toEqual(result);
    expect(await c(1, 2)).toEqual(result);
    expect(await c(1, false)).toEqual(result);
    expect(await c(1, false, 1)).toEqual(result); // third param ignored

    expect(await c({ a: 1 })).toEqual(result);
    expect(await c({ a: true })).toEqual(result);
    expect(await c({ a: 1, b: 2 })).toEqual(result);
    expect(await c({ a: 1, b: false })).toEqual(result);
    expect(await c({ a: 1, b: false, c: 1 })).toEqual(result); // `c` ignored

    await expect(c('bad input')).rejects.toThrow(
      'Validation for field "a" failed',
    );
    await expect(c('bad input', false)).rejects.toThrow(
      'Validation for field "a" failed',
    );
    await expect(c(1, 'bad input')).rejects.toThrow(
      'Validation for field "b" failed',
    );

    // Calling the constant with for specific function signature
    expect(await c['myConstant(uint,bool)'](1, false)).toEqual(result);
    await expect(c['myConstant(uint,bool)'](1, 1)).rejects.toThrow(
      'Validation for field "b" failed',
    );
  });
});
