/* eslint-env jest */

import transformTruffleArtifact from '../transformTruffleArtifact';

describe('Transforming Truffle artifacts', () => {
  const artifact = {
    abi: ['abi item'],
    bytecode: 'bytecode',
    networks: {
      1: {
        address: 'address 1',
      },
      '2': {
        address: 'address 2',
      },
    },
  };

  test('No artifact', () => {
    expect(transformTruffleArtifact()).toEqual({
      abi: [],
    });
  });

  test('With latest network', () => {
    expect(transformTruffleArtifact(artifact)).toEqual({
      abi: ['abi item'],
      address: 'address 2',
      bytecode: 'bytecode',
    });
  });

  test('With present specific network', () => {
    expect(transformTruffleArtifact(artifact, { network: '1' })).toEqual({
      abi: ['abi item'],
      address: 'address 1',
      bytecode: 'bytecode',
    });
  });

  test('With absent specific network', () => {
    expect(() => transformTruffleArtifact(artifact, { network: 3 })).toThrow(
      'Network ID "3" not found in Truffle artifact',
    );
  });
});
