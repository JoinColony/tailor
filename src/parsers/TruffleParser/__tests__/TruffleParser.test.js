/* eslint-env jest */

import createSandbox from 'jest-sandbox';

import ABIParser from '../../ABIParser';
import TruffleParser from '../index';
import MetaCoinArtifact from '../__fixtures__/MetaCoin';

const contractData = Object.assign(
  { address: '0x7da82c7ab4771ff031b66538d2fb9b0b047f6cf9' },
  MetaCoinArtifact,
);

describe('TruffleParser', () => {
  const sandbox = createSandbox();

  beforeEach(() => {
    sandbox.clear();
  });

  test('It should provide a name', () => {
    expect(TruffleParser.name).toEqual('truffle');
  });

  test('It inherits ABIParser', () => {
    const parser = new TruffleParser();
    expect(parser).toBeInstanceOf(ABIParser);
  });

  test('It parses Truffle artifacts', () => {
    const parser = new TruffleParser();
    sandbox.spyOn(parser.constructor, 'parseABI');

    const result = parser.parse(contractData);
    expect(parser.constructor.parseABI).toHaveBeenCalledWith(
      MetaCoinArtifact.abi,
    );

    expect(result).toHaveProperty(
      'constants',
      expect.objectContaining({ getBalance: expect.any(Object) }),
    );
    expect(result).toHaveProperty(
      'events',
      expect.objectContaining({ Transfer: expect.any(Object) }),
    );
    expect(result).toHaveProperty(
      'methods',
      expect.objectContaining({ sendCoin: expect.any(Object) }),
    );
    expect(result).toHaveProperty('address', contractData.address);
  });
});
