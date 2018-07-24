/* eslint-env jest */
/* eslint-disable no-underscore-dangle */

import createSandbox from 'jest-sandbox';

import Constant from '../index';

describe('Constant', () => {
  const sandbox = createSandbox();

  const mockLighthouse = {
    adapter: {
      call: sandbox.fn(),
    },
  };

  beforeEach(() => {
    sandbox.clear();
  });

  test('Instantiating a Constant', () => {
    const spec = {
      name: 'myConstant',
    };
    const c = new Constant(mockLighthouse, spec);
    expect(c).toBeInstanceOf(Constant);
    expect(c).toHaveProperty('spec', spec);
    expect(c).toHaveProperty('lighthouse', mockLighthouse);
  });

  test('Getting the function call', () => {
    const inputParam1 = {
      name: 'inputParam1',
      type: {
        validate: sandbox.fn().mockReturnValue(true),
      },
    };
    const inputParam2 = {
      name: 'inputParam2',
      type: {
        validate: sandbox.fn().mockReturnValue(true),
      },
    };

    const noInput = new Constant(mockLighthouse, {
      name: 'noInput',
    });
    expect(noInput._getFunctionCall()).toEqual({
      method: noInput.spec.name,
      parameters: [],
    });

    const oneInput = new Constant(mockLighthouse, {
      name: 'oneInput',
      input: [inputParam1],
    });
    expect(oneInput._getFunctionCall({ inputParam1: 1 })).toEqual({
      method: oneInput.spec.name,
      parameters: [1],
    });
    expect(oneInput._getFunctionCall(1)).toEqual({
      method: oneInput.spec.name,
      parameters: [1],
    });

    const twoInputs = new Constant(mockLighthouse, {
      name: 'twoInputs',
      input: [inputParam1, inputParam2],
    });
    expect(
      twoInputs._getFunctionCall({ inputParam1: 1, inputParam2: 2 }),
    ).toEqual({
      method: twoInputs.spec.name,
      parameters: [1, 2],
    });
    expect(twoInputs._getFunctionCall(1, 2)).toEqual({
      method: twoInputs.spec.name,
      parameters: [1, 2],
    });
  });

  test('Calling the constant', async () => {
    const spec = {
      name: 'myConstant',
      input: [
        {
          name: 'myInputParam',
          type: {
            validate: sandbox.fn().mockReturnValue(true),
          },
        },
      ],
      output: [
        {
          name: 'myOutputParam',
          type: {
            validate: sandbox.fn().mockReturnValue(true),
          },
        },
      ],
    };

    const output = ['xyz'];
    mockLighthouse.adapter.call.mockImplementationOnce(async () => output);

    const input = { myInputParam: 'abc' };

    const c = new Constant(mockLighthouse, spec);
    sandbox.spyOn(c, '_getFunctionCall');
    sandbox.spyOn(c, '_convertFunctionCallResult');

    const result = await c.call(input);

    expect(result).toEqual({ myOutputParam: output[0] });
    expect(c._getFunctionCall).toHaveBeenCalledWith(input);
    expect(mockLighthouse.adapter.call).toHaveBeenCalledWith({
      method: spec.name,
      parameters: [input.myInputParam],
    });
    expect(c._convertFunctionCallResult).toHaveBeenCalledWith(output);
  });
});
