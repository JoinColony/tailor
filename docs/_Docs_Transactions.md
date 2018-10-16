---
title: Transactions
section: Docs
order: 5
---

Interacting with the Ethereum blockchain in a way which will cause its state to change is done with a transaction. In Tailor we have various types of transactions, which handle everything for you when sending a transaction.

## Contract Transactions

The `contract` transaction is the one which you'll probably use most of the time. If you do not specify a different type of transaction in the method overrides for your Tailor instance, the `contract` type will be used as a default for all methods.

It automatically encodes transaction data based on function parameters passed to it, and sets the `to` address to the `contractAddress` of the Tailor instance.

```js

const client = await Tailor.load({
  methods: {
    myMethod: {
      type: 'contract',
    },
  },
});

await client.methods.myMethod({
  myParam: 'a string',
  otherParam: 42,
}).send();

```

## Multisignature Transactions

The `multisig` transaction is used with contract methods which require a transaction to be signed by multiple parties. The `multisig` transaction was designed around [`simple-multisig`](https://github.com/christianlundkvist/simple-multisig). See [Multisignature Transactions](https://docs.colony.io/tailor/docs-multisignature-transactions/) in the [colonyJS docs](https://docs.colony.io/colonyjs/docs-overview/) for more information.

```js

const client = await Tailor.load({
  methods: {
    myMethod: {
      type: {
        name: 'multisig',
        options: {
          getRequiredSigners,
          multiSigFunctionName,
          getMultiSigNonce
        }
      },
    },
  },
});

const tx = client.methods.myMethod({
  myParam: 'a string',
  otherParam: 42,
});

await tx.sign();
const json = tx.toJSON();

// And then somewhere else at another point in time...

const restored = await client.methods.myMethod.restore(json);
await restored.send();

```

## Other Transactions

Tailor also includes other transactions which are used internally, but unlikely to be useful otherwise.

For example, there is the base `transaction` on which the other transactions within Tailor are based. It can be used for cases where you need to make a simple transfer of Ether, or where you have specific data you wish to set for the transaction.

```js

const client = await Tailor.load({
  methods: {
    myMethod: {
      type: 'transaction',
    },
  },
  ...
});

await client.methods.myMethod({
  value: 123456,
  to: '0xabc',
  data: '0x123',
}).send();

```

There is also a `deploy` transaction which can be used for deploying new contracts on the network. This is used internally when you use `Tailor.deploy(...)`.
