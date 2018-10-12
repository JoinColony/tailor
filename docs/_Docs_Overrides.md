---
title: Overrides
section: Docs
order: 4
---

Sometimes it helps to be able to specify in more detail how Tailor should interact with your contract, and what values it can expect to be returned. We can do this by passing overrides for constants, events and methods.

## Contract Specification

The contract specification is what tells Tailor how it should interact with the provided contract. It's derived by parsing the `contractData` which was either loaded or passed as an argument when instantiating the Tailor instance.

## How to use overrides

Overrides are applied on top of the contract specification structure.

### Constants

```js

{
  constants: {
    myConstant: {
      // use a different constant from the contract
      functionName: 'actualConstant',
      // explicitly name and type each argument
      input: [{
        name: 'firstParam',
        type: 'integer',
      }, {
        name: 'secondParam',
        type: 'string',
      }],
      // explicitly name and type each output
      output: [{
        name: 'myOutput',
        type: 'boolean',
      }],
    },
  },
  ...
}

```

### Events

```js

{
  ...
  events: {
    MyEvent: {
      // use a different event from the contract
      eventName: 'ActualEvent',
      // explicitly name and type each output
      output: [{
        name: 'myOutput',
        type: 'address',
      }],
    },
  },
  ...
}

```

### Methods

```js

{
  ...
  methods: {
    myMethod: {
      // choose the transaction type to use
      type: 'contract',
      // use a different method from the contract
      functionName: 'actualMethod',
      // override only the type of the second input
      input: [{}, {
        type: 'date',
      }],
    },
  },
}

```

For more info about the different types of transaction available, see [transactions](https://docs.colony.io/tailor/docs-transactions/).
