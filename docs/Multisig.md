# Multisignature Transactions

Some contract functions rely on what's known as a [Multisignature](https://en.wikipedia.org/wiki/Multisignature) in order to process a transaction. A popular implementation of this for Solidity contracts is [`simple-multisig`](https://github.com/christianlundkvist/simple-multisig), which we use for various functions in `colonyNetwork`.

In order to use these functions, we need to create contract data to call our target contract function, gather parameters needed for executing the change on the contract, find which addresses we need signatures from, get each party to sign a transaction in a specific format, and finally, collate these signatures and send them off in one single transaction.

Wow, that's convoluted!

## Multisignature support in Tailor

Thankfully, Tailor makes this much simpler for us by providing the `multisig` transaction type.

The basic idea is that we'll initiate a transaction based on a particular function, with certain parameters (e.g. with a Colony, setting the brief of task 1 to 'the new specification hash'), then get that transaction signed and sent off.

That's more like it!

```js
// TODO: example setup
```

## Example use

An example of a function which uses Tailor's `MultiSigTransaction` within Colony is `setTaskBrief`. We'll need signatures from two parties, the Manager and Worker, in order to change the task brief.

### 1. Create a MultiSigTransaction

```js
const tx = colonyClient.methods.setTaskBrief({
  taskId: 1,
  specificationHash: 'the new specification hash',
})
// -> MultiSigTransaction
```

### 2. Identify required signers

We can determine which wallets need to sign the transaction by checking the `requiredSigners` and `missingSigners` properties.

```js
// first refresh the tx
await tx.refresh()

console.log(tx.requiredSigners)
// -> ['0x123...', '0x987...']
//    ^ Both of these addresses need to sign it...

console.log(tx.missingSigners)
// -> ['0x987...']
//    ^ This address hasn't signed it yet!
```

### 3. Sign the transaction

It's very simple to sign it:

```js
// This will sign the transaction with the current wallet.
await tx.sign()
```

Now the other party needs to sign it; we'll probably need to recreate the transaction on another instance of your app.

You can skip the next step if you can simply change the current wallet on the same app instance.

### 4. Export/restore the transaction for the other party

Firstly, we'll need to export some JSON from the `MultiSigTransaction` we want to restore:

```js
const json = tx.toJSON()
// -> "{ "nonce": 0, "payload": {...}, "signers": {...} }"
```

We can restore this elsewhere with the appropriate Tailor method:

```js
const tx = await colonyClient.setTaskBrief.restore(json)
// -> MultiSigTransaction (with the same parameters and the first signature already in place)
```

### 5. Sign the transaction (the other party)

Now the other signature can be added, and we can probably send it!

```js
await tx.sign()

console.log(tx.missingSigners)
// -> []
//    ^ We have all the signatures we need
```

### 6. Send the transaction

```js
// This works just like a regular Sender:
const { receipt: { status } } = await tx.send()
// -> 1 (successful)

// We can also add transaction options as a parameter, e.g.:
// await tx.send({ gasLimit: 2500000 })

// We can also see that our change took effect:
const task = await colonyClient.constants.getTask({ taskId: 1 })
// -> { id: 1, specificationHash: 'the new specification hash', ... }
```

## Contract state changes

It's important to understand that the data that is used to create signed messages in these transactions related to the contract state at a particular point in time.

While signatures are being collected, at least two things can happen that might cause the transaction to fail:

* Another `MultiSigTransaction` is successfully sent on the contract, increasing the nonce value
* The required signers for the transaction change

If the nonce value changes, the transaction will need to be signed again by all parties.

If the required signers change for a transaction, any accounts which are different will also now need to sign the transaction. If any of the existing signers are still required, they will not need to sign again.

The `MultiSigTransaction` can refresh these values in order to help prevent sending a transaction that will fail.

```js
// Example: two transactions with the same nonce:
console.log(firstTx.multiSigNonce) // 1
console.log(secondTx.multiSigNonce) // 1

// And no missing signers:
console.log(firstTx.missingSigners) // []
console.log(secondTx.missingSigners) // []

// We can send the first transaction successfully:
await firstTx.send()
// -> { successful: true }

// The second transaction can be refreshed:
await secondTx.refresh()

// The nonce should have been incremented:
console.log(secondTx.multiSigNonce) // 2

// And the signers should have been reset:
console.log(secondTx.missingSigners) // ['0x...', '0x...']
```

It's worth noting that starting a new transaction or sending an existing transaction will always trigger a refresh first, so this can reset the (now invalid) signers.

If desired, we can make the resetting of signers more explicit by attaching an event listener:

```js
const tx = await colonyClient.setTaskBrief({
  taskId: 1,
  specificationHash: 'the new specification hash'
})

tx.on('reset', () => {
  console.log('The signers were reset!')
})
```
