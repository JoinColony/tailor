# Hooks

Tailor has a system of "hooks" which can be used to transform internal values before they are used. The idea with these is to allow more flexibility and customisation when certain things happen in Tailor.

## Hooks Usage

Hooks may be registered multiple times, and at different levels within Tailor. In these cases, the value is cascaded from global to local level.

A hook function is expected to return an optionally transformed version of its first argument, with additional arguments potentially being passed, for example other state variables to be used when determining the transformed value.

```js
thingWithHooks.hooks({
  myHook: (valueToTransform, otherValue) => valueToTransform + otherValue
})
```

## Available Hooks

Only a limited set of hooks are currently available, however it's quite likely that this system will be expanded in the future.

### Constants

Hooks for constants are registered only at the global level, as they have no concept of state.

```js
client.constants.myConstant.hooks({
  call: functionCall => functionCall,
  result: result => result
})
```

### Methods/Transactions

Hooks for methods can be registered either at the global level, or for each individual transaction.

```js
client.constants.myConstant.hooks({
  send: (state, tx) => state,
  receipt: (receipt, tx) => receipt
})
```
