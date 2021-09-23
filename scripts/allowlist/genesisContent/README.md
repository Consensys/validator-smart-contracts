# Genesis File Content

This directory contains a script (`createContent.js`) that generates some content that needs to be added to the genesis 
file of a network that makes use of the allowlist smart contracts (`contracts/allowlist`).

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

The two lines above specify three accounts on the allow list, as well as the validators for the first and third account.

### Run the Script

To run the script in the `scripts/allowlist/genesisContent` directory: `node createContent.js`
###Output

The script creates a file named `Storage.txt`. The content of this file for the example above will look like this:

	"<insert contract address here>": {
		"comment": "validator smart contract",
		"balance": "0x00",
		"code": "0x<insert bin-runtime code of the contract here>",
		"storage": {
			"0000000000000000000000000000000000000000000000000000000000000000": "0000000000000000000000000000000000000000000000000000000000000002",
			"290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563": "000000000000000000000000ab8483f64d9c6d1ecf9b849ae677dd3315835cb2",
			"290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e564": "00000000000000000000000079731d3ca6b7e34ac0f824c42a7cc18a495cabab",
			"02e472438281ece9fae629c31ebc952b0b512971efb1bacfc7d4441c586cff6c": "0000000000000000000000005b38da6a701c568545dcfcb03fcb875f56beddc4",
			"36306db541fd1551fd93a60031e8a8c89d69ddef41d6249f5fdc265dbc8fffa2": "0000000000000000000000000000000000000000000000000000000000000101",
			"58d9a93947083dcdedec58d43912ce0326f251a85b7701c5de5bc7d7a150676e": "0000000000000000000000000000000000000000000000000000000000000001",
			"e0ddd3944b4f9c65a068b84248d68e1f0f838457a33299384eef528de71c9c0c": "0000000000000000000000004b20993bc481177ec7e8f571cecae8a9e22c02db",
			"e20f19dc6931eb9e42fe3f21abe1a9ef59942d8e586871d88564d0d0b63a5e5c": "0000000000000000000000000000000000000000000000000000000000010101",
			"0000000000000000000000000000000000000000000000000000000000000002": "0000000000000000000000000000000000000000000000000000000000000003"
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
 * the initial `validators` array
 * the initial `allowedAccounts` mapping
 * the initial `validatorToAccounts` mapping
 * the initial `numAllowedAccounts` uint

For more detail please see the script.

