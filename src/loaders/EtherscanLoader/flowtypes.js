/* @flow */

export type EtherscanResponse = {
  status: '0' | '1';
  result: Array<*>; // The ABI
};
