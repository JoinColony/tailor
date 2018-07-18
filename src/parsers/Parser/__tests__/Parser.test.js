/* eslint-env jest */

import Parser from '../index';

describe('Parser', () => {
  test('It should provide a name', () => {
    expect(Parser.name).toEqual('parser');
  });

  test('It should throw an error for the parse method', () => {
    const parser = new Parser();
    expect(() => {
      parser.parse();
    }).toThrowError('Expected "parse()" to be defined in a derived class');
  });
});
