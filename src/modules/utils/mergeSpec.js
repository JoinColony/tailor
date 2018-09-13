/* @flow */

import deepmerge from 'deepmerge';

/**
 * Merges a partial override object with a full contract spec. Arrays
 * are merged only if an element exists in the spec at that index.
 */
export default function mergeSpec(spec: Object, overrides: Object) {
  return deepmerge(spec, overrides, {
    clone: false,
    arrayMerge: (target: Array<*>, source: Array<*>) =>
      target.map(
        (e, i) =>
          typeof source[i] === 'undefined'
            ? e
            : Object.assign({}, e, source[i]),
      ),
  });
}
