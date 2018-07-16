/* eslint-env jest */

import createSandbox from 'jest-sandbox';

import ABIParser from '../../ABIParser';
import TruffleParser from '../index';
import MetaCoinArtifact from '../__fixtures__/MetaCoin';

describe('TruffleParser', () => {
  const sandbox = createSandbox();

  beforeEach(() => {
    sandbox.clear();
  });

  test('It inherits ABIParser', () => {
    const parser = new TruffleParser();
    expect(parser).toBeInstanceOf(ABIParser);
  });

  test('It parses Truffle artifacts', () => {
    const parser = new TruffleParser();
    sandbox.spyOn(parser.constructor, 'parseABI');

    const result = parser.parse(MetaCoinArtifact);
    expect(parser.constructor.parseABI).toHaveBeenCalledWith(
      MetaCoinArtifact.abi,
    );

    expect(result).toHaveProperty(
      'constants',
      expect.arrayContaining([expect.any(Object)]),
    );
    expect(result).toHaveProperty(
      'events',
      expect.arrayContaining([expect.any(Object)]),
    );
    expect(result).toHaveProperty(
      'methods',
      expect.arrayContaining([expect.any(Object)]),
    );
    expect(result).toHaveProperty('contractData', MetaCoinArtifact);
  });
});
