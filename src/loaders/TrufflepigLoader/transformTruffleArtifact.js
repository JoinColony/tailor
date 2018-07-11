/* @flow */

import type { TruffleArtifact } from './flowtypes';
import type { ContractData, Query } from '../../interface/Loader';

/*
 * Given a Truffle Artifact object and a Query, transform the artifact
 * into the contract data that the Loader is expected to return
 */
export default function transformTruffleArtifact(
  { abi = [], bytecode, networks = {} }: TruffleArtifact = {},
  { network }: Query = {},
): ContractData {
  let address;

  // Some clients (like Ganache) create IDs as integers; normalise them
  const networkKeys = Object.keys(networks).map(id => `${id}`);

  if (network && networkKeys.length) {
    if (!networks[network])
      throw new Error(`Network ID "${network}" not found in Truffle artifact`);
    ({ address } = networks[network]);
  } else {
    // Pick the last network (assumed to be the most recent)
    ({ address } = networks[networkKeys[networkKeys.length - 1]] || {});
  }

  return {
    abi,
    address,
    bytecode,
  };
}
