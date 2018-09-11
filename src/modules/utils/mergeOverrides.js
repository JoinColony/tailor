/* @flow */

import deepmerge from 'deepmerge';

/**
 * Merges two partial constant/event/method override objects. Arrays
 * are merged element by element, or appended if no element already
 * at index.
 */
export default function mergeOverrides(
  targetOverrides: Object,
  sourceOverrides: Object,
) {
  return deepmerge(targetOverrides, sourceOverrides, {
    clone: false,
    arrayMerge: (target: Array<*>, source: Array<*>) =>
      source.map(
        (e, i) =>
          typeof target[i] === 'undefined'
            ? e
            : Object.assign({}, target[i], e),
      ),
  });
}
