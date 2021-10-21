# Validator smart contracts

The QBFT consensus protocol implementation in the Quorum clients (GoQuorum and Besu) allows you to use a smart
contract to specify the validators that are used to propose and validate blocks. You can create your own
smart contract based on your organisation's requirements.

These smart contracts must implement the `ValidatorSmartContractInterface.sol` interface contract, specifically the
function:

    function getValidators() external view returns (address[] memory)

This repository contains an example smart contract that implements the interface.

General information about QBFT can be found in the [Hyperledger Besu documentation](https://besu.hyperledger.org/en/stable/HowTo/Configure/Consensus-Protocols/QBFT/).

## Example contract

The example smart contract can be found in the `contracts/allowlist` directory.

The contract holds a list of accounts (the allowlist) that are each allowed to nominate one QBFT validator
using an API.

Accounts on the allowlist can use the API of this contract to:

* Activate a validator
* Deactivate a validator
* Vote to add an account to the allowlist
* Vote to remove an account from the allowlist
* Remove votes they have cast to add or remove an account
* Execute the vote count for an account to be added or removed

For an election to be successful more than 50% of the current members of the allowlist must vote. Use the
`countVotes` function to count the votes, and if successful, add or remove the specified account.

Events are emitted to enable users to get information about changes to the validators, allowed accounts,
and voting.

To use this contract from the genesis block of a blockchain, the initial state of this contract
must be set in the genesis file. The `scripts/allowlist/genesisContent` directory of this
repository contains a javascript script that creates the storage section for this contract.
Refer to the ["Genesis file content"](#genesis-file-content) section.

**Information**: See the web3-js based script in the `scripts/allowlist/cli` directory for an example CLI script
that calls the allowlist smart contract functions.

### Compiling the contract for deployment

To create the contract code to add to the genesis file, compile the contract with the `--bin-runtime` option:

Copy the interface contract into this directory

    cp ../ValidatorSmartContractInterface.sol .

Then compile the contract using solc 0.8.7

    solc --optimize --bin-runtime --evm-version=byzantium -o . ./ValidatorSmartContractAllowList.sol

### Running tests

Unit tests are executed via Truffle:

    yarn install
    yarn truffle compile
    yarn truffle test

## Create the genesis file content

The `script/allowlist/genesisContent` directory contains the `createContent.js` script that generates the content
required for the genesis file of a network that uses the allowlist smart contracts (`contracts/allowlist`).

### Create the input file

The script reads the file `allowedAccountsAndValidators.txt` that defines in each line the address of an allowed account and
(optionally) the validator for that account. The account and the validator are specified using their address as a
hexadecimal string. If the account has a nominated validator, the account and the validator hexadecimal strings need
to be separated by a comma:

    0x5B38Da6a701c568545dCfcB03FcB875f56beddC4, 0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2
    0xCA35b7d915458EF540aDe6068dFe2F44E8fa733c
    0x4b20993Bc481177ec7E8f571ceCaE8A9e22C02db, 0x79731D3Ca6b7E34aC0F824c42a7cC18A495cabaB

The three lines above specify three accounts on the allowlist, and the validators for the first and third account.

You can export the node's public key using the following Besu command:

    besu public-key export-address

### Run the Script

**Prerequisites**:

* Install the script dependencies by running run `yarn install` in the `scripts/allowlist/genesisContent` directory.

Run the script in the `scripts/allowlist/genesisContent` directory:

    node createContent.js

### Output

The script creates a file named `Storage.txt`. The content of this file for the above example looks as follows:

	"<Address of Contract>": {
        "comment": "validator smart contract",
        "balance": "0x00",
        "code": "0x<Contract Code>",
        "storage": {
            "0000000000000000000000000000000000000000000000000000000000000000": "0000000000000000000000000000000000000000000000000000000000000002",
            "290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563": "000000000000000000000000ab8483f64d9c6d1ecf9b849ae677dd3315835cb2",
            "290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e564": "00000000000000000000000079731d3ca6b7e34ac0f824c42a7cc18a495cabab",
            "36306db541fd1551fd93a60031e8a8c89d69ddef41d6249f5fdc265dbc8fffa2": "0000000000000000000000000000000000000000000000000000000000000101",
            "58d9a93947083dcdedec58d43912ce0326f251a85b7701c5de5bc7d7a150676e": "0000000000000000000000000000000000000000000000000000000000000001",
            "e20f19dc6931eb9e42fe3f21abe1a9ef59942d8e586871d88564d0d0b63a5e5c": "0000000000000000000000000000000000000000000000000000000000010101",
            "f4c32baaad9a468f8a07690e6d59a45329a58ffaa2080ee4ccc1c4e2d7249e78": "0000000000000000000000005b38da6a701c568545dcfcb03fcb875f56beddc4",
            "5dbbb5c5a02cb5b882ed6d78dcc49118067d39a359082b7fe270d1949d2ca44d": "0000000000000000000000004b20993bc481177ec7e8f571cecae8a9e22c02db",
            "0000000000000000000000000000000000000000000000000000000000000003": "0000000000000000000000000000000000000000000000000000000000000003"
        },
        "version": "0x01"
    }

The content of the file needs to be placed in the genesis file for the network. In addition the `<Address of Contract>`
and `<Contract Code>` must be filled in.

An example of a genesis file using QBFT can be found in the `genesis.json` file in this directory.

* `<Address of Contract>` must be identical to `validatorcontractaddress` located in the `qbft` section of the genesis file.
* `<Contract Code>` must contain the binary runtime code for the `ValidatorSmartContractAllowList.sol` contract in `contracts/allowlist`.
  The binary can be found in the example `genesis.json` file in this directory. For this binary the
  `ValidatorSmartContractAllowList.sol` contract was compiled using `--bin-runtime`, `--evm-version byzantium`, and `--optimize` options of the solidity compiler.

General information about the genesis file can be found in the [Besu documentation](https://besu.hyperledger.org/en/stable/Reference/Config-Items/).

#### Short Description of the Content of the "storage" Section in the above example output

The storage section defines the state of the contract in the genesis block of the blockchain.
For general information on the layout of state variables in storage see
https://docs.soliditylang.org/en/v0.8.7/internals/layout_in_storage.html.

The storage section created by the `createContent.js` script defines
* the initial `validators` array (line 1 - 3 in the storage section)
* the initial `allowedAccounts` mapping (line 4 - 6 in the storage section)
* the initial `validatorToAccounts` mapping (line 7 and 8 in the storage section)
* the initial `numAllowedAccounts` uint (line 9 in the storage section)

For more detail please see the script.
