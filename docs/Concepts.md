---
title: Concepts
section: Docs
order: 0
---

# Concepts

Tailor is made up of various moving parts, from wallets to adapters, which help to take away some of the complexity of interacting with Ethereum contracts. Some of this is going on behind the scenes, while other parts will be actively used.

## Lifecycle of a Tailor instance

When you first instantiate a Tailor client, you pass it a wallet, an adapter, a loader or contract data, and any additional overrides and instance methods you may want to be applied. The wallet is used for signing transactions, the adapter for interacting with the Ethereum blockchain, the loader loads the contract data (if not already supplied), and the overrides and instance methods are applied on top of the instance.

Also set behind the scenes is the parser, which takes the raw contract data and turns it into a format which Tailor expects. Parsers are something which will likely be expanded in the future into something more configurable, but for now we just expect `contractData` to be an object containing the `abi` and `address`.
