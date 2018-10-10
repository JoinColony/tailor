---
title: Events
section: Docs
order: 4
---

Certain actions within Tailor cause an event to be emitted. Currently, these are all within a `Transaction` but in the future may be expanded to other parts of Tailor.

## Transactions

All transactions act as an `EventEmitter`, and implement the standard Node.js API through [EventEmitter3](https://github.com/primus/eventemitter3/).

### Base Transaction

For all transactions, there is a base set of events which are emitted.

```js
tx.on('confirmation', (confirmationNumber, receipt) => {})
tx.on('transactionHash', hash => {})
tx.on('receipt', receipt => {})
tx.on('error', error => {})
```

### MultiSigTransaction

MultiSig transactions also have an additional event for when the `signers` property is reset (the nonce changes, for example).

```js
tx.on('reset', () => {})
```
