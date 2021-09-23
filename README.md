# Validator Smart Contracts

The QBFT consensus protocol implementation in the Quorum clients (GoQuorum and Besu) allows users to use a smart
contract to specify the validators that are used to propose and vaidate blocks.

These smart contracts need to implement the interface contract ValidatorSmartContractInterface.sol, specifically the 
function  

    function getValidators() external view returns (address[] memory)

This repository contains a simple implementation of this interface.

General information about QBFT can be found here: https://besu.hyperledger.org/en/stable/HowTo/Configure/Consensus-Protocols/QBFT/

## Allowlist Based Contract

This smart contract can be found in the directory contracts/allowlist. 

The contract holds a list of accounts that are allowed to nominate a QBFT validator each, the allowlist. Each of these 
accounts can use transactions to call certain functions on the contract to activate and deactivate a validator. These 
accounts can also vote to add additional accounts to the allowlist, and to remove them.

To make use of this contract starting from the genesis block, the genesis file needs to contain this contract, as well 
as the storage content for the initial allowed accounts and validators. See /scripts/allowlist/ for utilities to 
generate the required storage and a simple cli script to call the allowlist smart contract functions.
