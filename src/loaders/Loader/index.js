/* @flow */

import type {
  ContractData,
  ILoader,
  LoaderArgs,
  Query,
  RequiredContractDataProps,
  Transform,
} from '../flowtypes';

import { REQUIRED_CONTRACT_DATA_PROPS } from '../defaults';
import { validateDataField, validateQueryField } from '../validation';

import transformJson from '../transforms/transformJson';

const assert = require('assert');

export default class Loader implements ILoader {
  _transform: Transform;

  constructor({ transform = transformJson }: LoaderArgs = {}) {
    assert(
      typeof transform === 'function',
      'A "transform" option must be provided',
    );
    this._transform = transform;
  }

  transform(input: *, query: Query): ContractData {
    return this._transform(input, query);
  }

  /*
 * Given contract data and required contract properties, validate the
 * data against each required property.
 */
  static runDataValidation(
    data: ContractData,
    props: RequiredContractDataProps,
  ): void {
    if (props.abi) validateDataField('abi', data.abi);
    if (props.address) validateDataField('address', data.address);
    if (props.bytecode) validateDataField('bytecode', data.bytecode);
  }

  /*
   * Given a query, validate each property and ensure that either
   * contractName or contractAddress is present.
   */
  static runQueryValidation(query: Query): void {
    Object.entries(query).forEach(([fieldName, value]) => {
      validateQueryField(fieldName, value);
    });
    assert(
      query.contractName || query.contractAddress,
      'Invalid query: "contractName" or "contractAddress" required',
    );
  }

  // eslint-disable-next-line
  async loadContractData(query: *, props?: *) {
    throw new Error(
      'Expected "loadContractData()" to be defined in a derived class',
    );
  }

  /*
   * Given a query and required contract data properties, validate the query,
   * use the loader to loadContractData the contract data, and validate the data.
   */
  async load(
    query: Query,
    props: RequiredContractDataProps = REQUIRED_CONTRACT_DATA_PROPS,
  ) {
    this.constructor.runQueryValidation(query);

    const {
      contractName,
      contractAddress,
      routerName,
      routerAddress,
      ...otherQuery
    } = query;

    // Load the contract definition by either the contract name or address
    const firstQuery = Object.assign(
      {},
      contractName ? { contractName } : { contractAddress },
      otherQuery,
    );
    const data = await this.loadContractData(firstQuery, props);

    if (data == null) throw new Error('Unable to load contract definition');

    if (contractAddress) {
      // If we have a specific contractAddress, set it directly.
      data.address = contractAddress;
    } else if (routerAddress) {
      // If we have the router address, set it directly.
      data.address = routerAddress;
    } else if (routerName) {
      // If we have the router name, look it up for the router address.
      const routerContract = await this.loadContractData(
        Object.assign({}, otherQuery, { contractName: routerName }),
        props,
      );
      if (routerContract != null) data.address = routerContract.address;
    }

    // Validate the collected data
    this.constructor.runDataValidation(data, props);

    return data;
  }
}
