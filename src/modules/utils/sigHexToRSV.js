/* @flow */

/**
 * Converts a signature hex string to an object containing its
 * r, s and v components.
 *
 * Adapted from:
 * https://github.com/ethereumjs/ethereumjs-util/blob/master/index.js#L432
 */
export default function sigHexToRSV(sigString: string) {
  const sig = exports.toBuffer(sigString);

  // NOTE: with potential introduction of chainId this might need to be updated
  if (sig.length !== 65) {
    throw new Error('Invalid signature length');
  }

  let v = sig[64];
  // support both versions of `eth_sign` responses
  if (v < 27) {
    v += 27;
  }

  return {
    v,
    r: sig.slice(0, 32),
    s: sig.slice(32, 64),
  };
}
