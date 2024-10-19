# Web3 Solana Raydium

Web3 Solana Raydium is a REST API that exposes connections to various blockchains (wallet, node & chain interaction) and decentralized exchanges (pricing, trading & liquidity provision). It is written in Typescript and takes advantage of existing blockchain and DEX SDKs. The advantage of using gateway is it provideds a programming language agnostic approach to interacting with blockchains and DEXs.

## Installation from source

Dependencies:
* NodeJS (16.0.0 or higher)
* Yarn: run `npm install -g yarn` after installing NodeJS

```bash
# Install dependencies
yarn

# Complile Typescript into JS
$ yarn build

# Run Gateway setup script, which helps you set configs and CERTS_PATH
$ chmod a+x gateway-setup.sh
$ ./gateway-setup.sh

# Start the Gateway server using PASSPHRASE
$ yarn start --passphrase=<PASSPHRASE>
```

### Configuration

- If you want to turn off `https`, set `unsafeDevModeWithHTTP` to `true` in [conf/server.yml](./conf/server.yml). 

- If you want Gateway to log to standard out, set `logToStdOut` to `true` in [conf/server.yml](./conf/server.yml).

- The format of configuration files are dictated by [src/services/config-manager-v2.ts](./src/services/config-manager-v2.ts) and the corresponding schema files in [src/services/schema](./src/services/schema).

- If you want to turn off `https`, set `unsafeDevModeWithHTTP` to `true` in [conf/server.yml](./conf/server.yml). 

- For each supported chain, token lists that translate address to symbols for each chain are stored in `/conf/lists`. You can add tokens here to make them available to Gateway.


### Architecture

Here are some files we recommend you look at in order to get familiar with the Gateway codebase:

- [src/services/ethereum-base.ts](./src/chains/ethereum/ethereum-base.ts): base class for EVM chains.

- [src/connectors/uniswap/uniswap.ts](./src/connectors/uniswap/uniswap.ts): functionality for interacting with Uniswap.

- [src/services/validators.ts](./src/services/validators.ts): defines functions for validating request payloads.


### Testing

For a pull request merged into the codebase, it has to pass unit test coverage requirements. Take a look at [Workflow](./.github/workflows/workflow.yml) for more details.

#### Unit tests

Read this document for more details about how to write unit test in gateway: [How we write unit tests for gateway](./docs/testing.md).

Run all unit tests.

```bash
yarn test:unit
```

Run an individual test folder or file

```bash
yarn jest test/<folder>/<file>
```

#### Manual tests

We have found it is useful to test individual endpoints with `curl` commands. We have a collection of prepared curl calls. POST bodies are stored in JSON files. Take a look at the [curl calls for gateway](./test-helpers/curl/curl.sh). Note that some environment variables are expected.

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


