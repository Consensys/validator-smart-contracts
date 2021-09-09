# Allow List Smart Contract

Accounts on the allow list can use the API of this contract to 
* activate a validator
* deactivate a validator
* vote to add an account to the allow list
* vote to remove an account from the allow list
* remove votes they have cast to add or remove an account
* execute the vote count for an account to be added or removed

For a vote to be successful more than 50% of the current members of the allow list have to vote. 

To get the votes counted and a new account being added or an account to be removed the function _countVotes needs to 
be called.

A number of events are emitted to enable users to get information about changes to the validators, allowed accounts, 
and voting.

To be able to use this contract starting from the genesis block of a blockchain the initial state of this contract 
needs to be set in the genesis file. The _**scripts/allowlist**_ directory of this 
repository contains a javascript script that creates the storage section for this contract.

### Build the Contract

To create the contract code that needs to be specified in the genesis file, this contract needs to be compiled with the
option `--bin-runtime`.

After copying the interface contract into this directory

    cp ../ValidatorSmartContractInterface.sol .

the contract can be compiled using solc 0.8.7 

    solc --optimize --bin-runtime --evm-version=byzantium -o . ./ValidatorSmartContractAllowList.sol

