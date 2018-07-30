/* eslint-env jest */
/* eslint-disable no-underscore-dangle */

import createSandbox from 'jest-sandbox';
import Web3 from 'web3';
import Lighthouse from '../index';
import Web3Adapter from '../../adapters/Web3Adapter';
import Loader from '../../loaders/Loader';
import TruffleLoader from '../../loaders/TruffleLoader';
import TrufflepigLoader from '../../loaders/TrufflepigLoader';
import ABIParser from '../../parsers/ABIParser';
import TruffleParser from '../../parsers/TruffleParser';
import PARAM_TYPES from '../../modules/paramTypes';

jest.mock('web3', () => () => ({
  eth: {
    Contract: jest.fn(),
  },
}));

describe('Lighthouse', () => {
  const sandbox = createSandbox();

  beforeEach(() => {
    sandbox.clear();
  });

  test('Getting an adapter', () => {
    expect(() => Lighthouse.getAdapter(null)).toThrow('Expected an adapter');
    expect(() => Lighthouse.getAdapter({ name: undefined })).toThrow(
      'not found',
    );
    expect(() => Lighthouse.getAdapter('schmadapter')).toThrow('not found');

    const web3 = new Web3();
    const adapterInstance = new Web3Adapter({ web3 });

    const withName = Lighthouse.getAdapter('web3');
    expect(withName).toBeInstanceOf(Web3Adapter);

    const withSpec = Lighthouse.getAdapter({
      name: 'web3',
      options: { web3 },
    });
    expect(withSpec).toBeInstanceOf(Web3Adapter);
    // TODO: check constructor arguments, see below about "ideal world"

    const withInstance = Lighthouse.getAdapter(adapterInstance);
    expect(withInstance).toBe(adapterInstance);
  });

  test('Getting a loader', () => {
    expect(() => Lighthouse.getLoader(null)).toThrow('Expected a loader');
    expect(() => Lighthouse.getLoader({ name: undefined })).toThrow(
      'not found',
    );
    expect(() => Lighthouse.getLoader('schmloader')).toThrow('not found');

    const directory = 'custom directory';
    const loaderInstance = new TruffleLoader({ directory });

    const withName = Lighthouse.getLoader('truffle');
    expect(withName).toBeInstanceOf(TruffleLoader);

    const withSpec = Lighthouse.getLoader({
      name: 'truffle',
      options: { directory },
    });
    expect(withSpec).toBeInstanceOf(TruffleLoader);
    // In an ideal world, we would test which args the mocked constructor
    // was called with, but we also need to check `instanceof`, so
    // let's just check a property of the loader we created.
    expect(withSpec).toHaveProperty('_directory', directory);

    const withInstance = Lighthouse.getLoader(loaderInstance);
    expect(withInstance).toBe(loaderInstance);
  });

  test('Getting a parser', () => {
    expect(() => Lighthouse.getParser(null)).toThrow('Expected a parser');
    expect(() => Lighthouse.getParser({ name: undefined })).toThrow(
      'not found',
    );
    expect(() => Lighthouse.getParser('schmparser')).toThrow('not found');

    const parserInstance = new TruffleParser();

    const withName = Lighthouse.getParser('truffle');
    expect(withName).toBeInstanceOf(TruffleParser);

    const withSpec = Lighthouse.getParser({
      name: 'truffle',
    });
    expect(withSpec).toBeInstanceOf(TruffleParser);

    const withInstance = Lighthouse.getParser(parserInstance);
    expect(withInstance).toBe(parserInstance);
  });

  test('Getting default arguments', () => {
    const lh = new Lighthouse();
    sandbox.spyOn(lh.constructor, 'getAdapter');
    sandbox.spyOn(lh.constructor, 'getLoader');
    sandbox.spyOn(lh.constructor, 'getParser');
    const web3 = new Web3();
    const args = {
      query: { contractName: 'MyContract' },
      adapter: {
        name: 'web3',
        options: { web3 },
      },
      loader: 'trufflepig',
      parser: 'abi',
    };
    const defaults = lh.constructor.getLighthouseDefaults(args);
    expect(lh.constructor.getAdapter).toHaveBeenCalledWith(args.adapter);
    expect(lh.constructor.getLoader).toHaveBeenCalledWith(args.loader);
    expect(lh.constructor.getParser).toHaveBeenCalledWith(args.parser);
    expect(defaults).toEqual({
      adapter: expect.any(Web3Adapter),
      constants: {},
      contractData: undefined,
      events: {},
      loader: expect.any(TrufflepigLoader),
      methods: {},
      parser: expect.any(ABIParser),
      query: args.query,
    });
  });

  test('Instantiating a Lighthouse', () => {
    sandbox.spyOn(Lighthouse, 'getLighthouseDefaults');
    sandbox
      .spyOn(Lighthouse.prototype, '_defineContractInterface')
      .mockImplementation(() => {});

    const args = {
      loader: new Loader(),
      parser: new ABIParser(),
      query: { contractName: 'MyContract' },
      methods: {
        getTask: { convertOutput: sandbox.fn() },
      },
    };
    const lh1 = new Lighthouse(args);

    expect(lh1.constructor.getLighthouseDefaults).toHaveBeenCalledWith(args);
    expect(lh1).toBeInstanceOf(Lighthouse);
    expect(lh1).toHaveProperty('loader', expect.any(Loader));
    expect(lh1).toHaveProperty('parser', expect.any(ABIParser));
    expect(lh1).toHaveProperty('_query', args.query);
    expect(lh1).toHaveProperty('_overrides', {
      constants: {},
      methods: args.methods,
      events: {},
    });
    expect(
      Lighthouse.prototype._defineContractInterface,
    ).not.toHaveBeenCalled();

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
    const overrides = {
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
          convertOutput: sandbox.fn(),
        },
      },
    };
    const lh = new Lighthouse(overrides);

    const initialSpecs = {
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
          convertInput: sandbox.fn(),
          // there would be other things here, like `output`,
          // but we don't need them for this test
        },
      },
    };
    sandbox.spyOn(lh.parser, 'parse').mockImplementation(() => initialSpecs);

    const iface = lh._defineContractInterface(contractData);
    expect(lh.parser.parse).toHaveBeenCalledWith(contractData);
    expect(iface).toEqual({
      methods: {},
      events: {},
      constants: {
        getTaskRole: {
          // Only set in initial specs; should be from initial specs
          convertInput: initialSpecs.constants.getTaskRole.convertInput,

          // Only set in overrides; should be from overrides
          convertOutput: overrides.constants.getTaskRole.convertOutput,

          // Set in initial specs and overrides; should be from overrides
          input: overrides.constants.getTaskRole.input,
        },
      },
    });
  });

  test('Initializing an instance', async () => {
    const query = {
      contractName: 'MyContract',
    };
    const contractData = {
      abi: 'the loaded abi',
      address: 'the loaded address',
    };

    const web3 = new Web3();

    const lh = new Lighthouse({
      adapter: new Web3Adapter({ web3 }),
      loader: new Loader(),
      parser: new ABIParser(),
      query,
    });

    sandbox.spyOn(lh, '_defineContractInterface').mockImplementation(() => {});
    sandbox
      .spyOn(lh.loader, 'load')
      .mockImplementation(async () => contractData);

    await lh.initialize();

    expect(lh.loader.load).toHaveBeenCalledWith(lh._query);
    expect(lh._defineContractInterface).toHaveBeenCalledWith(contractData);
  });
});
