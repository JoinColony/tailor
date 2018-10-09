---
title: Contract Specification
section: Docs
order: 2
---

# Contract Specification

The contract specification is what tells Tailor how it should interact with your contract. It's derived by parsing the `contractData` which was either loaded or passed as an argument when instantiating the Tailor instance.

It's useful to understand the contract spec structure, as this is what overrides are applied on top of.

```js
// overrides
{
  constants: {
    myConstant: {
      // use a different function on the contract
      functionName: 'actualConstant',
      // explicityly name and type each argument
      input: [{
        name: 'firstParam',
        type: 'integer'
      }, {
        name: 'secondParam',
        type: 'string'
      }],
      // same for output
      output: [{
        name: 'myOutput',
        type: 'boolean'
      }],
    }
  },
  events: {
    MyEvent: {
      // same structure for output
      output: [{
        ...
      }]
    }
  },
  methods: {
    myMethod: {
      // can choose the transaction type to use
      type: 'contract',
      functionName: 'actualMethod',
      // override only the second input, just the type
      input: [{}, {
        type: 'date'
      }]
    }
  }
}
```

For more info about the different types of transaction available, see [transactions](Transactions.md).
