/* eslint-env jest */
/* eslint-disable no-underscore-dangle */

import createSandbox from 'jest-sandbox';
import Web3 from 'web3';
import Tailor from '../index';
import Adapter from '../../adapters/Adapter';
import ABIParser from '../../parsers/ABIParser';
import Wallet from '../../wallets/Wallet';
import { BOOLEAN_TYPE, INTEGER_TYPE } from '../../modules/paramTypes';

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

describe('Tailor', () => {
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
    await expect(Tailor.getConstructorArgs()).rejects.toThrow(
      'contractData or loader',
    );

    // contractData
    await Tailor.getConstructorArgs(dataArgs);
    expect(mockLoaderLoad).not.toHaveBeenCalled();

    // loader
    await Tailor.getConstructorArgs(loaderArgs);
    expect(mockLoaderLoad).toHaveBeenCalled();

    expect(getAdapter).toHaveBeenCalledWith(args.adapter, args.wallet);
    expect(getParser).toHaveBeenCalledWith(args.parser);
    expect(getWallet).toHaveBeenCalledWith(args.wallet);
    expect(mockAdapterInit).toHaveBeenCalled();
  });

  test('Creating a Tailor', async () => {
    const createArgs = { create: 'args' };

    sandbox
      .spyOn(Tailor.prototype, '_defineContractInterface')
      .mockImplementation(() => ({}));
    sandbox.spyOn(Tailor, 'getConstructorArgs').mockImplementation(() => ({}));

    // no args
    await Tailor.load();
    expect(Tailor.getConstructorArgs).toHaveBeenCalledWith({});

    // with args
    await Tailor.load(createArgs);
    expect(Tailor.getConstructorArgs).toHaveBeenCalledWith(createArgs);
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
      .spyOn(Tailor.prototype, '_defineContractInterface')
      .mockImplementation(() => ({}));
    sandbox
      .spyOn(Tailor, 'getConstructorArgs')
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
    await expect(Tailor.deploy()).rejects.toThrow('Unable to deploy contract');
    expect(Tailor.getConstructorArgs).toHaveBeenCalledWith({});
    Tailor.getConstructorArgs.mockClear();

    // with args
    DeployTransaction.prototype.receipt = {
      contractAddress,
    };
    await Tailor.deploy(createArgs, deployArgs);
    expect(Tailor.getConstructorArgs).toHaveBeenCalledWith(createArgs);
    expect(DeployTransaction.prototype.send).toHaveBeenCalled();
  });

  test('Instantiating a Tailor', () => {
    sandbox
      .spyOn(Tailor.prototype, '_defineContractInterface')
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
    const tailor1 = new Tailor(args);

    expect(tailor1).toBeInstanceOf(Tailor);
    expect(tailor1).toHaveProperty('adapter', expect.any(Adapter));
    expect(tailor1).toHaveProperty('parser', expect.any(ABIParser));
    expect(tailor1).toHaveProperty('wallet', expect.any(Wallet));
    expect(tailor1).toHaveProperty('_overrides', {
      constants: {},
      methods: args.methods,
      events: {},
    });
    expect(tailor1).toHaveProperty('_contractData', args.contractData);
    expect(Tailor.prototype._defineContractInterface).toHaveBeenCalledWith();

    // With contract data
    const contractData = 'some contract data';
    const tailor2 = new Tailor(Object.assign({}, args, { contractData }));
    expect(tailor2).toHaveProperty('_contractData', contractData);
    expect(Tailor.prototype._defineContractInterface).toHaveBeenCalledWith();
    expect(tailor2).toBeInstanceOf(Tailor);
    Tailor.prototype._defineContractInterface.mockRestore();
  });

  test('Setting the wallet', async () => {
    sandbox
      .spyOn(Tailor.prototype, '_defineContractInterface')
      .mockImplementation(() => {});

    const oldWallet = new Wallet();
    const newWalletSpec = 'wallet';
    const args = {
      adapter: new Adapter(),
      parser: new ABIParser(),
      wallet: oldWallet,
      contractData: 'contract data',
    };
    const tailor = new Tailor(args);

    getWallet.mockResolvedValueOnce(new Wallet());

    const newWallet = await tailor.setWallet(newWalletSpec);

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
                type: INTEGER_TYPE,
              },
              {
                name: 'isProbablyTrue',
                type: BOOLEAN_TYPE,
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
                type: INTEGER_TYPE,
              },
              {
                name: 'b',
                type: INTEGER_TYPE,
              },
            ],
            'MyEvent(bool,bool)': [
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
        },
      },
      constants: {
        getTaskRole: {
          input: {
            'getTaskRole(uint,uint)': [
              {
                name: 'id',
                type: INTEGER_TYPE,
              },
              {
                name: 'role',
                type: INTEGER_TYPE,
              },
              {
                name: 'notOverriden',
                type: INTEGER_TYPE,
              },
            ],
          },
          // TODO in tailor#25 (hooks)
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
              null,
              {
                type: customRoleType,
              },
            ],
          },
          // TODO in tailor#25 (hooks)
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
                type: INTEGER_TYPE,
              },
              {
                name: 'b',
                type: INTEGER_TYPE,
              },
            ],
            'MyEvent(bool,bool)': [
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
        },
      },
      methods: {
        myMethod: {
          input: {
            'myMethod(uint,bool)': [
              {
                name: 'id',
                type: INTEGER_TYPE,
              },
              {
                name: 'isTotallyTrue',
                type: BOOLEAN_TYPE,
              },
            ],
          },
        },
      },
    };

    jest
      .spyOn(Tailor.prototype, '_defineContractInterface')
      .mockImplementationOnce(() => {});
    const tailor = new Tailor(args);
    tailor._contractData = contractData;

    const iface = tailor._defineContractInterface();
    expect(tailor.parser.parse).toHaveBeenCalledWith(contractData);
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

          // Set in initial specs and overrides; should be merged
          input: {
            'getTaskRole(uint,uint)': [
              {
                name: 'id',
                type: INTEGER_TYPE,
              },
              {
                name: 'role',
                type: customRoleType,
              },
              {
                name: 'notOverriden',
                type: INTEGER_TYPE,
              },
            ],
          },
        },
      },
    });
  });

  test('Defining helpers', () => {
    const myHelper = sandbox.fn();
    const helpers = { myHelper, badHelper: true, constructor: sandbox.fn() };
    sandbox.spyOn(Tailor.prototype, '_defineHelpers');
    sandbox
      .spyOn(Tailor.prototype, '_defineContractInterface')
      .mockImplementation(() => {});

    const tailor = new Tailor({ helpers });
    tailor.myHelper();

    expect(tailor._defineHelpers).toHaveBeenCalledWith(helpers);
    expect(myHelper.mock.instances[0]).toBe(tailor);
    expect(tailor).not.toHaveProperty('badHelper');
    expect(tailor.constructor).not.toBe(helpers.constructor);
  });

  test('Extending Tailor', () => {
    const myHelper = sandbox.fn();
    const constants = {
      myConstant: {
        input: [{ name: 'myOverridenInput' }, { name: 'myOtherOverride' }],
      },
    };
    const events = {
      myEvent: {
        output: {
          'myEvent(uint8)': [
            {
              name: 'myOutput',
              type: sandbox.fn(),
            },
          ],
        },
      },
    };
    const methods = {
      myMethod: {
        input: {
          'myMethod()': [
            {
              name: 'myInput',
              type: sandbox.fn(),
            },
          ],
        },
      },
    };
    const extension = {
      constants,
      events,
      myHelper,
    };
    sandbox
      .spyOn(Tailor.prototype, '_defineContractInterface')
      .mockImplementation(() => {});

    const tailor = new Tailor({
      constants: {
        myConstant: {
          input: [{ name: 'myInput', type: 'myType' }],
          output: [{ name: 'myOutput' }],
        },
      },
      methods,
    });
    tailor.extend(extension);

    expect(tailor._overrides).toEqual({
      constants: {
        myConstant: {
          input: [
            { name: 'myOverridenInput', type: 'myType' },
            { name: 'myOtherOverride' },
          ],
          output: [{ name: 'myOutput' }],
        },
      },
      events,
      methods,
    });
    expect(tailor.myHelper).toBe(myHelper);

    // with no args, should remain same
    const beforeOverrides = Object.assign({}, tailor._overrides);
    tailor.extend({});
    expect(tailor._overrides).toEqual(beforeOverrides);
  });
});
