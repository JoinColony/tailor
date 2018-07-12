/* eslint-env jest */

import TruffleLoader from '../index';
import FSLoader from '../../FSLoader';
import truffleTransformArtifact from '../../transforms/transformTruffleArtifact';

describe('TruffleLoader', () => {
  test('Instantiating a TruffleLoader', () => {
    expect(() => {
      new TruffleLoader({ directory: '' });
    }).toThrow('A "directory" option must be provided');

    const directory = '~/contracts';
    const loader = new TruffleLoader({ directory });
    expect(loader).toHaveProperty('_directory', directory);
    expect(loader).toHaveProperty('_transform', truffleTransformArtifact);
    expect(loader).toBeInstanceOf(FSLoader);
  });
});
