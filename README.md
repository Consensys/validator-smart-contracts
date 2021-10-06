# Validator Smart Contracts

The QBFT consensus protocol implementation in the Quorum clients (GoQuorum and Besu) allows users to use a smart
contract to specify the validators that are used to propose and vaidate blocks.

These smart contracts need to implement the interface contract ValidatorSmartContractInterface.sol, specifically the 
function  

    function getValidators() external view returns (address[] memory)

This repository contains a simple implementation of this interface.

General information about QBFT can be found here: https://besu.hyperledger.org/en/stable/HowTo/Configure/Consensus-Protocols/QBFT/

## Allowlist Based Contract

This smart contract can be found in the directory _contracts/allowlist_. 

The contract holds a list of accounts (the allowlist) that are each allowed to nominate one QBFT validator. Each of 
these accounts can use transactions to call certain functions on the contract to activate and deactivate a validator. 
These accounts can also vote to add additional accounts to the allowlist, and to remove them.

To make use of this contract starting from the genesis block, the genesis file needs to contain this contract, as well 
as the storage content for the initial allowed accounts and validators. See 
[chapter "Genesis File Content"](#Genesis-File-Content) for a utility to generate the required storage. 

**See the web3-js based script in _scripts/allowlist/cli_ for a simple cli script to call the allowlist smart contract functions.**

Accounts on the allowlist can use the API of this contract to
* activate a validator
* deactivate a validator
* vote to add an account to the allowlist
* vote to remove an account from the allowlist
* remove votes they have cast to add or remove an account
* execute the vote count for an account to be added or removed

For an election to be successful more than 50% of the current members of the allowlist have to vote.

To get the votes counted and (if successful) the outcome enacted (the specified account added or removed),
the function _countVotes_ needs to be called.

A number of events are emitted to enable users to get information about changes to the validators, allowed accounts,
and voting.

To be able to use this contract starting from the genesis block of a blockchain the initial state of this contract
needs to be set in the genesis file. The `scripts/allowlist/genesisContent` directory of this
repository contains a javascript script that creates the storage section for this contract.

### Compile the Contract

To create the contract code that needs to be specified in the genesis file, this contract needs to be compiled with the
option `--bin-runtime`.

After copying the interface contract into this directory

    cp ../ValidatorSmartContractInterface.sol .

the contract can be compiled using solc 0.8.7

    solc --optimize --bin-runtime --evm-version=byzantium -o . ./ValidatorSmartContractAllowList.sol

## Genesis File Content

The _script/allowlist/genesisContent_ directory contains a script (`createContent.js`) that generates some content that 
needs to be added to the genesis file of a network that makes use of the allowlist smart contracts (`contracts/allowlist`).

### Install the dependencies

To install the dependencies of the script run `npm install` in the `scripts/allowlist/genesisContent` directory.

### Input File

The script reads the file `allowedAccountsAndValidators.txt` that defines in each line the address of an allowed account and
(optionally) the validator for that account. The account and the validator are specified using their address as a
hexadecimal string. If the account has a nominated validator, the account and the validator hexadecimal strings need
to be separated by a comma:

    0x5B38Da6a701c568545dCfcB03FcB875f56beddC4, 0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2
    0xCA35b7d915458EF540aDe6068dFe2F44E8fa733c
    0x4b20993Bc481177ec7E8f571ceCaE8A9e22C02db, 0x79731D3Ca6b7E34aC0F824c42a7cC18A495cabaB

The three lines above specify three accounts on the allow list, as well as the validators for the first and third account.

### Run the Script

To run the script in the `scripts/allowlist/genesisContent` directory: `node createContent.js`

###Output

The script creates a file named `Storage.txt`. The content of this file for the example above will look like this:

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

The content of the file needs to be placed in the genesis file for the network. In addition the <_Address of Contract_>
and <_Contract Code_> need to be filled in.

An example of a genesis file using QBFT can be found in the `genesis.json` file in this directory.

* The <_Address of Contract_> needs to be the same that is stated in the _qbft_ section of the genesis file for the _validatorcontractaddress_.
* The <_Contract Code_> needs to contain the binary runtime code for the `ValidatorSmartContractAllowList.sol` contract in `contracts/allowlist`.  
  The binary can be found in the example genesis.json file in this directory. For this binary the
  `ValidatorSmartContractAllowList.sol` contract was compiled using _--bin-runtime_, _--evm-version byzantium_ and _--optimize_ options of the solidity compiler

General information about the genesis file can be found here: https://besu.hyperledger.org/en/stable/Reference/Config-Items/

#### Short Description of the Content of the "storage" Section in the above Example Output

The storage section defines the state of the contract in the genesis block of the blockchain.
For general information on the layout of state variables in storage see
https://docs.soliditylang.org/en/v0.8.7/internals/layout_in_storage.html.

The storage section created by the `createContent.js` script defines
* the initial `validators` array (line 1 - 3 in the storage section)
* the initial `allowedAccounts` mapping (line 4 - 6 in the sotrage section)
* the initial `validatorToAccounts` mapping (line 7 and 8 in the storage section)
* the initial `numAllowedAccounts` uint (line 9 in the storage section)

For more detail please see the script.
