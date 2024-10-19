# Web3 Solana Raydium

Web3 Solana Raydium is a REST API that exposes connections to various blockchains (wallet, node & chain interaction) and decentralized exchanges (pricing, trading & liquidity provision). It is written in Typescript and takes advantage of existing blockchain and DEX SDKs. The advantage of using gateway is it provideds a programming language agnostic approach to interacting with blockchains and DEXs.

## Installation from source

Dependencies:
* NodeJS (16.0.0 or higher)
* Yarn: run `npm install -g yarn` after installing NodeJS
  
## Linting

This repo uses `eslint` and `prettier`. When you run `git commit` it will trigger the `pre-commit` hook. This will run `eslint` on the `src` and `test` directories.

You can lint before committing with:

```bash
yarn run lint
```

You can run the prettifier before committing with:

```bash
yarn run prettier
```


