# Validator Smart Contracts

The QBFT consensus protocol implementation in the Quorum clients (GoQuorum and Besu) allows users to use a smart
contract to specify the validators that are used to propose and vaidate blocks.

These smart contracts need to implement the interface contract _ValidatorSmartContractInterface.sol_, which 
defines the function  

    `function getValidators() external view returns (address[] memory)`

that needs to be implemented.

This repository contains examples of Ethereum smart contracts that can be used to do that.

General information about QBFT can be found here: https://besu.hyperledger.org/en/stable/HowTo/Configure/Consensus-Protocols/QBFT/

## Allow List Based Contract

This smart contract can be found in the directory contracts/allowlist. 

The contract holds a list of accounts that are allowed to nominate a QBFT validator each, the allow list. Each of these 
accounts can use transactions to call certain functions on the contract to activate and deactivate a validator. These 
accounts can also vote to add additional accounts to the allow list, and to remove them.

To make use of this contract starting from the genesis block the genesis file needs to contain this contract, as well 
as the storage content for the initial allowed accounts and validators. In the /scripts/allowlist directory a javascript
script can be found that generates the content for the storage section, based on a simple text file that contains
the allowed accounts and their (optional) validators. 
