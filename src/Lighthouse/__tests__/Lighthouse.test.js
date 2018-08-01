/* eslint-env jest */
/* eslint-disable no-underscore-dangle */

import createSandbox from 'jest-sandbox';
import Web3 from 'web3';
import Lighthouse from '../index';
import Adapter from '../../adapters/Adapter';
import ABIParser from '../../parsers/ABIParser';
import Wallet from '../../wallets/Wallet';
import PARAM_TYPES from '../../modules/paramTypes';

import { getAdapter, getLoader, getParser, getWallet } from '../factory';

jest.mock('web3', () => () => ({
  eth: {
    Contract: jest.fn(),
  },
}));

jest.mock('../factory', () => ({
  getAdapter: jest.fn(),
  getLoader: jest.fn(),
  getParser: jest.fn(),
  getWallet: jest.fn(),
}));

describe('Lighthouse', () => {
  const sandbox = createSandbox();

  beforeEach(() => {
    sandbox.clear();
  });

  test('Creating a Lighthouse', async () => {
    const web3 = new Web3();
    const args = {
      adapter: {
        name: 'web3',
        options: { web3 },
      },
      parser: 'abi',
      wallet: {
        name: 'web3',
        options: { web3 },
      },
    };
    const dataArgs = Object.assign({}, args, {
      contractData: 'contract data',
    });
    const loaderArgs = Object.assign({}, args, {
      loader: 'loader',
      query: { contractName: 'MyContract' },
    });

    sandbox
      .spyOn(Lighthouse.prototype, '_defineContractInterface')
      .mockImplementation(() => {});

    const mockAdapterInit = sandbox.fn();
    const mockLoaderLoad = sandbox.fn();
    getAdapter.mockReturnValue({ initialize: mockAdapterInit });
    getLoader.mockReturnValue({ load: mockLoaderLoad });

    // no args
    await expect(Lighthouse.create()).rejects.toThrow('contractData or loader');

    // contractData
    await Lighthouse.create(dataArgs);
    expect(mockLoaderLoad).not.toHaveBeenCalled();

    // loader
    await Lighthouse.create(loaderArgs);
    expect(mockLoaderLoad).toHaveBeenCalled();

    expect(getAdapter).toHaveBeenCalledWith(args.adapter);
    expect(getParser).toHaveBeenCalledWith(args.parser);
    expect(getWallet).toHaveBeenCalledWith(args.wallet);
    expect(mockAdapterInit).toHaveBeenCalled();
  });

  test('Instantiating a Lighthouse', () => {
    sandbox
      .spyOn(Lighthouse.prototype, '_defineContractInterface')
      .mockImplementation(() => {});

    const args = {
      adapter: new Adapter(),
      parser: new ABIParser(),
      wallet: new Wallet(),
      methods: {
        getTask: { convertOutput: sandbox.fn() },
      },
      contractData: 'contract data',
    };
    const lh1 = new Lighthouse(args);

    expect(lh1).toBeInstanceOf(Lighthouse);
    expect(lh1).toHaveProperty('adapter', expect.any(Adapter));
    expect(lh1).toHaveProperty('parser', expect.any(ABIParser));
    expect(lh1).toHaveProperty('wallet', expect.any(Wallet));
    expect(lh1).toHaveProperty('_overrides', {
      constants: {},
      methods: args.methods,
      events: {},
    });
    expect(Lighthouse.prototype._defineContractInterface).toHaveBeenCalledWith(
      args.contractData,
    );

    // With contract data
    const contractData = 'some contract data';
    const lh2 = new Lighthouse(Object.assign({}, args, { contractData }));
    expect(Lighthouse.prototype._defineContractInterface).toHaveBeenCalledWith(
      contractData,
    );
    expect(lh2).toBeInstanceOf(Lighthouse);
    Lighthouse.prototype._defineContractInterface.mockRestore();
  });

  test('Defining the contract interface', () => {
    const contractData = 'some contract data';
    const customRoleType = {};
    const initialSpecs = {
      methods: {
        myMethod: {
          input: {
            'myMethod(uint,bool)': [
              {
                name: 'id',
                type: PARAM_TYPES.INTEGER,
              },
              {
                name: 'isProbablyTrue',
                type: PARAM_TYPES.BOOLEAN,
              },
            ],
          },
        },
      },
      events: {
        MyEvent: {
          output: {
            'MyEvent()': [],
            'MyEvent(uint256,uint256)': [
              {
                name: 'a',
                type: PARAM_TYPES.INTEGER,
              },
              {
                name: 'b',
                type: PARAM_TYPES.INTEGER,
              },
            ],
            'MyEvent(bool,bool)': [
              {
                name: 'a',
                type: PARAM_TYPES.BOOLEAN,
              },
              {
                name: 'b',
                type: PARAM_TYPES.BOOLEAN,
              },
            ],
          },
        },
      },
      constants: {
        getTaskRole: {
          input: {
            'getTaskRole(uint,uint)': [
              {
                name: 'id',
                type: PARAM_TYPES.INTEGER,
              },
              {
                name: 'role',
                type: PARAM_TYPES.INTEGER,
              },
            ],
          },
          // TODO in lighthouse#25 (hooks)
          convertInput: sandbox.fn(),
          // there would be other things here, like `output`,
          // but we don't need them for this test
        },
      },
    };
    const args = {
      parser: {
        parse: sandbox.fn().mockImplementation(() => initialSpecs),
      },
      constants: {
        getTaskRole: {
          input: {
            'getTaskRole(uint,uint)': [
              {
                name: 'id',
                type: PARAM_TYPES.INTEGER,
              },
              {
                name: 'role',
                type: customRoleType,
              },
            ],
          },
          // TODO in lighthouse#25 (hooks)
          convertOutput: sandbox.fn(),
        },
      },
      events: {
        MyEvent: {
          output: {
            'MyEvent()': [],
            'MyEvent(uint256,uint256)': [
              {
                name: 'a',
                type: PARAM_TYPES.INTEGER,
              },
              {
                name: 'b',
                type: PARAM_TYPES.INTEGER,
              },
            ],
            'MyEvent(bool,bool)': [
              {
                name: 'a',
                type: PARAM_TYPES.BOOLEAN,
              },
              {
                name: 'b',
                type: PARAM_TYPES.BOOLEAN,
              },
            ],
          },
        },
      },
      methods: {
        myMethod: {
          input: {
            'myMethod(uint,bool)': [
              {
                name: 'id',
                type: PARAM_TYPES.INTEGER,
              },
              {
                name: 'isTotallyTrue',
                type: PARAM_TYPES.BOOLEAN,
              },
            ],
          },
        },
      },
    };

    jest
      .spyOn(Lighthouse.prototype, '_defineContractInterface')
      .mockImplementationOnce(() => {});
    const lh = new Lighthouse(args);

    const iface = lh._defineContractInterface(contractData);
    expect(lh.parser.parse).toHaveBeenCalledWith(contractData);
    expect(iface).toEqual({
      methods: {
        myMethod: {
          // Set in initial specs and overrides; should be from overrides
          input: args.methods.myMethod.input,
        },
      },
      events: {
        MyEvent: initialSpecs.events.MyEvent,
      },
      constants: {
        getTaskRole: {
          // Only set in initial specs; should be from initial specs
          convertInput: initialSpecs.constants.getTaskRole.convertInput,

          // Only set in overrides; should be from overrides
          convertOutput: args.constants.getTaskRole.convertOutput,

          // Set in initial specs and overrides; should be from overrides
          input: args.constants.getTaskRole.input,
        },
      },
    });
  });
});
