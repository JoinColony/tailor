/* @flow */

import type { MethodSpec } from '../../interface/ContractSpec';
import type Tailor from '../../Tailor';
import { getTransaction } from '../transactions';

/*
 * Given a specification for a method function, return an async function
 * which can be called with any valid input.
 */
export default function methodFactory(
  tailor: Tailor,
  { name, input = {}, isPayable, type }: MethodSpec,
) {
  const functionSignatures = Object.keys(input);

  // If input wasn't provided, use the method name (presumed to be the
  // function signature) to produce the function parameters we need.
  const functionParams =
    functionSignatures.length === 0 ? { [name]: [] } : input;

  // Get class for the type of Transaction to use for this method. Uses
  // `type` spec, or returns default `ContractTransaction`.
  const { class: Tx, options } = getTransaction(type);

  // Get the method function object, which is callable and may also
  // have additional properties attached (such as hooks).
  const fn = Tx.getMethodFn({
    tailor,
    functionParams,
    isPayable,
    ...options,
  });

  // Allow each function signature to be called specifically by adding
  // properties to the method function
  functionSignatures.forEach(functionSignature => {
    fn[functionSignature] = Tx.getMethodFn({
      tailor,
      functionParams: {
        [functionSignature]: functionParams[functionSignature],
      },
      isPayable,
    });
  });

  return fn;
}
