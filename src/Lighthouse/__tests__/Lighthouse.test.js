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
import DeployTransaction from '../../modules/transactions/DeployTransaction';

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

jest.mock('../../modules/transactions/DeployTransaction');

describe('Lighthouse', () => {
  const sandbox = createSandbox();

  const wallet = new Wallet();

  beforeEach(() => {
    sandbox.restore();
  });

  test('Getting contract args', async () => {
    const web3 = new Web3();
    const args = {
      adapter: {
        name: 'web3',
        options: { web3, wallet },
      },
      parser: 'abi',
      wallet,
    };
    const dataArgs = Object.assign({}, args, {
      contractData: 'contract data',
    });
    const loaderArgs = Object.assign({}, args, {
      loader: 'loader',
      query: { contractName: 'MyContract' },
    });

    const mockAdapterInit = sandbox.fn();
    const mockLoaderLoad = sandbox.fn();
    getAdapter.mockReturnValue({ initialize: mockAdapterInit });
    getLoader.mockReturnValue({ load: mockLoaderLoad });
    getWallet.mockReturnValue(wallet);

    // no args
    await expect(Lighthouse.getConstructorArgs()).rejects.toThrow(
      'contractData or loader',
    );

    // contractData
    await Lighthouse.getConstructorArgs(dataArgs);
    expect(mockLoaderLoad).not.toHaveBeenCalled();

    // loader
    await Lighthouse.getConstructorArgs(loaderArgs);
    expect(mockLoaderLoad).toHaveBeenCalled();

    expect(getAdapter).toHaveBeenCalledWith(args.adapter, args.wallet);
    expect(getParser).toHaveBeenCalledWith(args.parser);
    expect(getWallet).toHaveBeenCalledWith(args.wallet);
    expect(mockAdapterInit).toHaveBeenCalled();
  });

  test('Creating a Lighthouse', async () => {
    const createArgs = { create: 'args' };

    sandbox
      .spyOn(Lighthouse.prototype, '_defineContractInterface')
      .mockImplementation(() => ({}));
    sandbox
      .spyOn(Lighthouse, 'getConstructorArgs')
      .mockImplementation(() => ({}));

    // no args
    await Lighthouse.load();
    expect(Lighthouse.getConstructorArgs).toHaveBeenCalledWith({});

    // with args
    await Lighthouse.load(createArgs);
    expect(Lighthouse.getConstructorArgs).toHaveBeenCalledWith(createArgs);
  });

  test('Deploying a contract', async () => {
    const createArgs = { create: 'args' };
    const deployArgs = ['one', 'two'];
    const fromAddress = '0x123';
    const deployData = 'deploy data';
    const signed = 'signed deploy tx';
    const contractAddress = '0x987';
    const receipt = { receipt: true, contractAddress };

    const mockEncodeDeploy = sandbox.fn().mockReturnValue(deployData);
    const mockSendSignedTransaction = sandbox.fn().mockResolvedValue(receipt);
    const mockInitialize = sandbox.fn();
    const mockSign = sandbox.fn().mockResolvedValue(signed);

    sandbox
      .spyOn(Lighthouse.prototype, '_defineContractInterface')
      .mockImplementation(() => ({}));
    sandbox
      .spyOn(Lighthouse, 'getConstructorArgs')
      .mockImplementation(() => ({}))
      .mockResolvedValue({
        adapter: {
          encodeDeploy: mockEncodeDeploy,
          sendSignedTransaction: mockSendSignedTransaction,
          initialize: mockInitialize,
        },
        wallet: {
          sign: mockSign,
          address: fromAddress,
        },
        contractData: {
          abi: [],
        },
      });

    // no args
    await expect(Lighthouse.deploy()).rejects.toThrow(
      'Unable to deploy contract',
    );
    expect(Lighthouse.getConstructorArgs).toHaveBeenCalledWith({});
    Lighthouse.getConstructorArgs.mockClear();

    // with args
    DeployTransaction.prototype.receipt = {
      contractAddress,
    };
    await Lighthouse.deploy(createArgs, deployArgs);
    expect(Lighthouse.getConstructorArgs).toHaveBeenCalledWith(createArgs);
    expect(DeployTransaction.prototype.send).toHaveBeenCalled();
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

  test('Setting the wallet', async () => {
    sandbox
      .spyOn(Lighthouse.prototype, '_defineContractInterface')
      .mockImplementation(() => {});

    const oldWallet = new Wallet();
    const newWalletSpec = 'wallet';
    const args = {
      adapter: new Adapter(),
      parser: new ABIParser(),
      wallet: oldWallet,
      contractData: 'contract data',
    };
    const lh = new Lighthouse(args);

    getWallet.mockResolvedValueOnce(new Wallet());

    const newWallet = await lh.setWallet(newWalletSpec);

    expect(newWallet).not.toBe(oldWallet);
    expect(newWallet).toEqual(expect.any(Wallet));
    expect(getWallet).toHaveBeenCalledWith(newWalletSpec);
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

  test('Defining helpers', () => {
    const myHelper = sandbox.fn();
    const helpers = { myHelper, badHelper: true, constructor: sandbox.fn() };
    sandbox.spyOn(Lighthouse.prototype, '_defineHelpers');
    sandbox
      .spyOn(Lighthouse.prototype, '_defineContractInterface')
      .mockImplementation(() => {});

    const lh = new Lighthouse({ helpers });
    lh.myHelper();

    expect(lh._defineHelpers).toHaveBeenCalledWith(helpers);
    expect(myHelper.mock.instances[0]).toBe(lh);
    expect(lh).not.toHaveProperty('badHelper');
    expect(lh.constructor).not.toBe(helpers.constructor);
  });
});
