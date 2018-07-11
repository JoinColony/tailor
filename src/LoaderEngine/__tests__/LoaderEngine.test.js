/* eslint-env jest */

import createSandbox from 'jest-sandbox';
import LoaderEngine from '../index';

describe('LoaderEngine', () => {
  const sandbox = createSandbox();

  const mockLoader = {
    load: sandbox.fn(),
  };

  beforeEach(() => {
    sandbox.clear();
  });

  test('Validating contract data', () => {
    const data = {
      address: '0x7da82c7ab4771ff031b66538d2fb9b0b047f6cf9',
      abi: ['A mock ABI entry'],
      bytecode: `0x let's imagine this is valid bytecode`,
    };
    const props = {
      address: true,
      bytecode: true,
      abi: true,
    };

    // With required props
    expect(() => {
      LoaderEngine.runDataValidation(data, props);
    }).not.toThrow();

    // With no required props
    expect(() => {
      LoaderEngine.runDataValidation(data, {});
    }).not.toThrow();

    // With required props missing
    expect(() => {
      LoaderEngine.runDataValidation(
        { abi: data.abi, address: data.address },
        props,
      );
    }).toThrow('Invalid contract data: "bytecode" must be valid bytecode');
  });

  test('Validating contract queries', () => {
    const query1 = { contractName: 'MyContract' };
    const query2 = {
      contractAddress: '0x7da82c7ab4771ff031b66538d2fb9b0b047f6cf9',
    };
    const query3 = { routerName: 'MyRouter' };
    expect(() => {
      LoaderEngine.runQueryValidation(query1);
    }).not.toThrow();
    expect(() => {
      LoaderEngine.runQueryValidation(query2);
    }).not.toThrow();
    expect(() => {
      LoaderEngine.runQueryValidation(query3);
    }).toThrow('"contractName" or "contractAddress" required');
  });

  test('Instantiating a LoaderEngine', () => {
    const engine = new LoaderEngine(mockLoader);
    expect(engine).toHaveProperty('loader', mockLoader);

    // Without a valid loader
    expect(() => {
      new LoaderEngine();
    }).toThrow('LoaderEngine requires a valid Loader');
  });

  test('Loading contract data: no response', async () => {
    const engine = new LoaderEngine(mockLoader);
    const query = { contractName: 'MyContract' };
    const props = { address: true, abi: true };

    mockLoader.load.mockResolvedValueOnce(null);

    try {
      await engine.load(query, props);
      expect(false).toBe(true); // should be unreachable
    } catch (error) {
      expect(error.toString()).toMatch('Unable to load contract definition');
    }
    expect(mockLoader.load).toHaveBeenCalledWith(query, props);
  });

  test('Loading contract data: responses for different queries', async () => {
    const engine = new LoaderEngine(mockLoader);

    const resetSpies = () => {
      engine.constructor.runQueryValidation.mockReset();
      engine.constructor.runDataValidation.mockReset();
      mockLoader.load.mockReset();
    };

    const props = { address: true, abi: true };
    const address = '0x7da82c7ab4771ff031b66538d2fb9b0b047f6cf9';
    const data = {
      address,
      abi: ['A mock ABI entry'],
      bytecode: `0x let's imagine this is valid bytecode`,
    };

    sandbox.spyOn(engine.constructor, 'runDataValidation');
    sandbox.spyOn(engine.constructor, 'runQueryValidation');

    const nameQuery = { contractName: 'MyContract' };
    const addressQuery = { contractAddress: address };
    const routerAddressQuery = {
      contractName: 'IMyContract',
      routerAddress: address,
    };
    const routerNameQuery = {
      contractName: 'IMyContract',
      routerName: 'MyRouter',
    };

    // With contractName
    mockLoader.load.mockResolvedValue(data);
    expect(await engine.load(nameQuery, props)).toMatchObject(data);
    expect(mockLoader.load).toHaveBeenCalledWith(nameQuery, props);
    expect(mockLoader.load).toHaveBeenCalledTimes(1);
    expect(engine.constructor.runQueryValidation).toHaveBeenCalledWith(
      nameQuery,
    );
    expect(engine.constructor.runDataValidation).toHaveBeenCalledWith(
      data,
      props,
    );
    resetSpies();

    // With contractAddress
    mockLoader.load.mockResolvedValue(data);
    expect(await engine.load(addressQuery, props)).toMatchObject(data);
    expect(mockLoader.load).toHaveBeenCalledWith(addressQuery, props);
    expect(mockLoader.load).toHaveBeenCalledTimes(1);
    expect(engine.constructor.runQueryValidation).toHaveBeenCalledWith(
      addressQuery,
    );
    expect(engine.constructor.runDataValidation).toHaveBeenCalledWith(
      data,
      props,
    );
    resetSpies();

    // With routerAddress
    mockLoader.load.mockResolvedValue(data);
    expect(await engine.load(routerAddressQuery, props)).toMatchObject(data);
    expect(mockLoader.load).toHaveBeenCalledWith(
      { contractName: routerAddressQuery.contractName },
      props,
    );
    expect(mockLoader.load).toHaveBeenCalledTimes(1);
    expect(engine.constructor.runQueryValidation).toHaveBeenCalledWith(
      routerAddressQuery,
    );
    expect(engine.constructor.runDataValidation).toHaveBeenCalledWith(
      data,
      props,
    );
    resetSpies();

    // With routerName
    mockLoader.load.mockResolvedValue(data);
    expect(await engine.load(routerNameQuery, props)).toMatchObject(data);
    expect(mockLoader.load).toHaveBeenCalledWith(
      { contractName: routerNameQuery.contractName },
      props,
    );
    expect(mockLoader.load).toHaveBeenCalledWith(
      { contractName: routerNameQuery.routerName },
      props,
    );
    expect(mockLoader.load).toHaveBeenCalledTimes(2);
    expect(engine.constructor.runQueryValidation).toHaveBeenCalledWith(
      routerNameQuery,
    );
    expect(engine.constructor.runDataValidation).toHaveBeenCalledWith(
      data,
      props,
    );
    resetSpies();
  });
});
