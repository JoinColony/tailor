/* eslint-env jest */

import transformEtherscanResponse from '../transformEtherscanResponse';

describe('Transforming Etherscan responses', () => {
  const contractAddress = '0x7da82c7ab4771ff031b66538d2fb9b0b047f6cf9';
  const abi = ['a mock ABI'];
  const query = { contractAddress };

  test('Malformed/missing response', () => {
    expect(() => {
      transformEtherscanResponse(undefined, query);
    }).toThrow('Malformed response from Etherscan');
    expect(() => {
      transformEtherscanResponse('abc', query);
    }).toThrow('Malformed response from Etherscan');
    expect(() => {
      transformEtherscanResponse({ status: '1', abi: 'rubbish' }, query);
    }).toThrow('Error parsing result from Etherscan');
  });

  test('Erroneous response', () => {
    expect(() => {
      transformEtherscanResponse(
        {
          status: '0',
          result: 'Something went wrong',
        },
        query,
      );
    }).toThrow('Erroneous response from Etherscan (status: 0)');
  });

  test('Successful response', () => {
    expect(
      transformEtherscanResponse(
        {
          status: '1',
          result: JSON.stringify(abi),
        },
        query,
      ),
    ).toEqual({
      address: contractAddress,
      abi,
    });
  });

  test('No query provided', () => {
    expect(
      transformEtherscanResponse({
        status: '1',
        result: JSON.stringify(abi),
      }),
    ).toEqual({
      abi,
      address: undefined,
    });
  });

  test('Getting bytecode errors', () => {
    expect(
      () =>
        transformEtherscanResponse({
          status: '1',
          result: JSON.stringify(abi),
        }).bytecode,
    ).toThrow('Etherscan does not currently provide contract bytecode');
  });
});
