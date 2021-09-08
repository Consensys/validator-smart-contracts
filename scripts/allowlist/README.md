# Genesis File Content

This directory contains a script (_createContent.js_) that generates some content that needs to be added to the genesis 
file of a network that makes use of the allowlist smart contracts (_contracts/allowlist_).

### Install the dependencies

To install the depencies of the script run _`npm install`_ in the _scripts/allowlist_ directory. 

### Input File

The script reads the file _allowedAccountsAndValidators.txt_ that defines in each line the address of an allowed account and
(optionally) the validator for that account. The account and the validator are specified using their address as a 
hexadecimal string. If the account has a nominated validator the account and the validator hexadecimal strings need
to be separeted by a comma:

    0x5B38Da6a701c568545dCfcB03FcB875f56beddC4, 0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2
    0xCA35b7d915458EF540aDe6068dFe2F44E8fa733c
    0x4b20993Bc481177ec7E8f571ceCaE8A9e22C02db, 0x79731D3Ca6b7E34aC0F824c42a7cC18A495cabaB

The two lines above specify three accounts on the allow list, as well as the validators for the first and third account.

### Run the Script

To run the script in the _scripts/allowlist_ directory: _`node createContent.js`_
###Output

The script creates a file named _Storage.txt_. The content of this file for the example above will look like this:

    "0x<Address of Contract>": {
      "balance": "0x00",
      "code": "0x<Contract Code>"
      "storage": {
        "0000000000000000000000000000000000000000000000000000000000000000": "0000000000000000000000000000000000000000000000000000000000000002",
        "290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563": "000000000000000000000000ab8483f64d9c6d1ecf9b849ae677dd3315835cb2",
        "290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e564": "00000000000000000000000079731d3ca6b7e34ac0f824c42a7cc18a495cabab",
        "36306db541fd1551fd93a60031e8a8c89d69ddef41d6249f5fdc265dbc8fffa2": "0000000000000000000000000000000000000000000000000000000000000101",
        "58d9a93947083dcdedec58d43912ce0326f251a85b7701c5de5bc7d7a150676e": "0000000000000000000000000000000000000000000000000000000000000001",
        "e20f19dc6931eb9e42fe3f21abe1a9ef59942d8e586871d88564d0d0b63a5e5c": "0000000000000000000000000000000000000000000000000000000000010101",
        "0000000000000000000000000000000000000000000000000000000000000002": "0000000000000000000000000000000000000000000000000000000000000003" 
      },
      "version": "0x01"
    }

The content of the file needs to be places in the genesis file for the network. In addition the <_Address of Contract_> 
and <_Contract Code_> need to be filled in.

An example of a genesis file using qbft can be found in the _genesis.json_ file in this directory.

* The <_Address of Contract_> needs to be the same that is stated in the qbft section of the genesis file for the _validatorcontractaddress_.
* The <_Contract Code_> needs to contain the binary runtime code for the _ValidatorSmartContractAllowList.sol_ contract in _contracts/allowlist_.  
  The binary can be found in the example genesis.json file in this directory. For this binary the 
_ValidatorSmartContractAllowList.sol_ contract was compiled using --_bin-runtime_ and --_optimize_ options of the solidity compiler

General information about the genesis file can be found here: https://besu.hyperledger.org/en/stable/Reference/Config-Items/  

#### Short Description of the Content of the "storage" Section in the above Example Output

The storage section defines the state of the contract in the genesis block of the blockchain. 
For general information on the layout of state variables in storage see 
https://docs.soliditylang.org/en/v0.8.7/internals/layout_in_storage.html.

Each line of the section contains two 32 byte hexadecimal numbers. The first is the **_slot_** number. Each slot 
holds 32 bytes of the state of the contract. The second hexadecimal number contains the content of that state storage.

Slot(0), the first line of the section, contains the length of the validator array, in this case 2. The validator array itself is stored 
starting in slot keccak(32bytes of 0), which is _290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563_. The two slots
containing the two validators are defined in line 2 and 3 of the storage section. The content of the two slots are the 
addresses of the validators.

Lines 4 to 6 contain the mapping for the three allowed accounts. The data for each account is stored in 
slot(keccak(<32 bytes account address> | 32 bytes address of slot(1))). The 32 byte stored for each account are

* byte(0): boolean meaning that this account is allowed, always 0x01 
* byte(1): boolean indicating whether this account has an active validator
* bytes(2-9): 8 byte unsigned integer indicating the index of its validator in the validator array

Line 7 of the section (slot(2)) contains the number of allowed accounts, here 3.

