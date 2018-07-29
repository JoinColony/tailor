/* @flow */

import type {
  ContractData,
  // GenericQuery,
  Transform,
  TruffleArtifact,
} from '../flowtypes';

/*
 * Given a Truffle Artifact object and a Query, transform the artifact
 * into the contract data that the Loader is expected to return
 */
const transformTruffleArtifact: Transform = (
  { abi = [], bytecode, networks = {} }: TruffleArtifact = {},
  { network }: * = {},
): ContractData => {
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
};

export default transformTruffleArtifact;
