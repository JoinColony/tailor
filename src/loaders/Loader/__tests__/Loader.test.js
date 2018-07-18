/* eslint-env jest */
/* eslint-disable no-underscore-dangle,no-new */

import createSandbox from 'jest-sandbox';
import Loader from '../index';

describe('Loader', () => {
  const sandbox = createSandbox();

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
      Loader.runDataValidation(data, props);
    }).not.toThrow();

    // With no required props
    expect(() => {
      Loader.runDataValidation(data, {});
    }).not.toThrow();

    // With required props missing
    expect(() => {
      Loader.runDataValidation({ abi: data.abi, address: data.address }, props);
    }).toThrow('Invalid contract data: "bytecode" must be valid bytecode');
  });

  test('Validating contract queries', () => {
    const query1 = { contractName: 'MyContract' };
    const query2 = {
      contractAddress: '0x7da82c7ab4771ff031b66538d2fb9b0b047f6cf9',
    };
    const query3 = { routerName: 'MyRouter' };
    expect(() => {
      Loader.runQueryValidation(query1);
    }).not.toThrow();
    expect(() => {
      Loader.runQueryValidation(query2);
    }).not.toThrow();
    expect(() => {
      Loader.runQueryValidation(query3);
    }).toThrow('"contractName" or "contractAddress" required');
  });

  test('Loading contract data: no response', async () => {
    const loader = new Loader();

    const query = { contractName: 'MyContract' };
    const props = { address: true, abi: true };

    sandbox.spyOn(loader, 'loadContractData').mockResolvedValueOnce(null);

    try {
      await loader.load(query, props);
      expect(false).toBe(true); // should be unreachable
    } catch (error) {
      expect(error.toString()).toMatch('Unable to load contract definition');
    }
    expect(loader.loadContractData).toHaveBeenCalledWith(query, props);
  });

  test('Loading contract data: responses for different queries', async () => {
    const loader = new Loader();

    const resetSpies = () => {
      loader.constructor.runQueryValidation.mockReset();
      loader.constructor.runDataValidation.mockReset();
      loader.loadContractData.mockReset();
    };

    const props = { address: true, abi: true };
    const address = '0x7da82c7ab4771ff031b66538d2fb9b0b047f6cf9';
    const data = {
      address,
      abi: ['A mock ABI entry'],
      bytecode: `0x let's imagine this is valid bytecode`,
    };

    sandbox.spyOn(loader.constructor, 'runDataValidation');
    sandbox.spyOn(loader.constructor, 'runQueryValidation');
    sandbox.spyOn(loader, 'loadContractData');

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
    loader.loadContractData.mockResolvedValue(data);
    expect(await loader.load(nameQuery, props)).toMatchObject(data);
    expect(loader.loadContractData).toHaveBeenCalledWith(nameQuery, props);
    expect(loader.loadContractData).toHaveBeenCalledTimes(1);
    expect(loader.constructor.runQueryValidation).toHaveBeenCalledWith(
      nameQuery,
    );
    expect(loader.constructor.runDataValidation).toHaveBeenCalledWith(
      data,
      props,
    );
    resetSpies();

    // With contractAddress
    loader.loadContractData.mockResolvedValue(data);
    expect(await loader.load(addressQuery, props)).toMatchObject(data);
    expect(loader.loadContractData).toHaveBeenCalledWith(addressQuery, props);
    expect(loader.loadContractData).toHaveBeenCalledTimes(1);
    expect(loader.constructor.runQueryValidation).toHaveBeenCalledWith(
      addressQuery,
    );
    expect(loader.constructor.runDataValidation).toHaveBeenCalledWith(
      data,
      props,
    );
    resetSpies();

    // With routerAddress
    loader.loadContractData.mockResolvedValue(data);
    expect(await loader.load(routerAddressQuery, props)).toMatchObject(data);
    expect(loader.loadContractData).toHaveBeenCalledWith(
      { contractName: routerAddressQuery.contractName },
      props,
    );
    expect(loader.loadContractData).toHaveBeenCalledTimes(1);
    expect(loader.constructor.runQueryValidation).toHaveBeenCalledWith(
      routerAddressQuery,
    );
    expect(loader.constructor.runDataValidation).toHaveBeenCalledWith(
      data,
      props,
    );
    resetSpies();

    // With routerName
    loader.loadContractData.mockResolvedValue(data);
    expect(await loader.load(routerNameQuery, props)).toMatchObject(data);
    expect(loader.loadContractData).toHaveBeenCalledWith(
      { contractName: routerNameQuery.contractName },
      props,
    );
    expect(loader.loadContractData).toHaveBeenCalledWith(
      { contractName: routerNameQuery.routerName },
      props,
    );
    expect(loader.loadContractData).toHaveBeenCalledTimes(2);
    expect(loader.constructor.runQueryValidation).toHaveBeenCalledWith(
      routerNameQuery,
    );
    expect(loader.constructor.runDataValidation).toHaveBeenCalledWith(
      data,
      props,
    );
    resetSpies();
  });

  test('Instantiating a Loader', () => {
    expect(() => {
      new Loader({ transform: null });
    }).toThrowError('A "transform" option must be provided');

    const loader = new Loader();
    expect(loader).toBeInstanceOf(Loader);
    expect(loader).toHaveProperty('_transform', expect.any(Function));
  });

  test('Transforming contract data', () => {
    const transform = sandbox.fn().mockImplementation(input => input + 1);
    const query = { contractName: 'MyContract' };
    const loader = new Loader({ transform });
    expect(loader.transform(1, query)).toEqual(2);
    expect(loader._transform).toHaveBeenCalledWith(1, query);
  });

  test('Loading contract data', async () => {
    const loader = new Loader();
    try {
      await loader.load({ contractName: 'MyContract' });
      expect(false).toBe(true); // Should be unreachable
    } catch (error) {
      expect(error.toString()).toMatch(
        'Expected "loadContractData()" to be defined in a derived class',
      );
    }
  });
});
