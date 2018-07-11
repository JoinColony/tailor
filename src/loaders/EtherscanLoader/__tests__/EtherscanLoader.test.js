/* eslint-env jest */

import createEtherscanLoader from '../index';
import { HttpLoader } from '../../HttpLoader/index';

describe('EtherscanLoader', () => {
  test('Instantiating an EtherscanLoader', () => {
    expect(() => {
      createEtherscanLoader({ endpoint: '' });
    }).toThrow('An "endpoint" option must be provided');

    const loader = createEtherscanLoader();
    expect(loader).toHaveProperty('_endpoint');
    expect(loader).toBeInstanceOf(HttpLoader);
  });
});
