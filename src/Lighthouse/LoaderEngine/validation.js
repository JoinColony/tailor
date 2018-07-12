/* @flow */

import type { Schema } from './flowtypes';
import { DATA_SCHEMA, QUERY_SCHEMA } from './constants';

const assert = require('assert');

/*
 * For a given schema and context message, return a function
 * that validates a field based on the schema
 */
const validator = (schema: Schema, context: string) => (
  fieldName: string,
  value: *,
) => {
  const [validate, message] = schema[fieldName];
  assert(validate(value), `${context}: "${fieldName}" ${message}`);
};

export const validateDataField = validator(
  DATA_SCHEMA,
  'Invalid contract data',
);
export const validateQueryField = validator(QUERY_SCHEMA, 'Invalid query');
