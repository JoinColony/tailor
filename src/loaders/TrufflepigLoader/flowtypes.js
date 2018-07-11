/* @flow */

export type TruffleArtifact = {
  abi: Array<{}>,
  bytecode: string,
  networks: {
    [network: string | number]: {
      address: string,
    },
  },
};
