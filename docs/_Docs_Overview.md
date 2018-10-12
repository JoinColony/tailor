---
title: Overview
section: Docs
order: 0
---

Tailor is a library for interacting with Ethereum smart contracts. It acts as a powerful and easy to use layer between lower-level libraries such as Web3, and your dApp, with features including dynamic ABI loading and extensible type checking.

Tailor is made up of various moving parts, from adapters to wallets, which help to take away some of the complexity of interacting with Ethereum contracts. Some of these parts will be operating behind the scenes, while others will be actively used.

## Understanding the parts

When you first instantiate a Tailor client, you pass it either a loader or contract data, an adapter, a wallet, and any additional overrides and instance methods you want to apply. The loader loads the contract data (if not already supplied), the adapter is used for interacting with the Ethereum blockchain, the wallet is used for signing transactions, and the overrides and instance methods are applied on top of the instance.

Also set behind the scenes is the parser, which takes the raw contract data and turns it into a format which Tailor expects. Parsers will likely be expanded upon in the future to become something more configurable, but for now we just expect `contractData` to be an object containing the `abi` and `address`.
