// Implementation of a contract to select validators using an allowlist

pragma solidity >=0.5.0;

import "../ValidatorSmartContractInterface.sol";

contract ValidatorSmartContractAllowList is ValidatorSmartContractInterface {

    struct accountInfo {
        bool allowed;
        bool activeValidator;
        uint8 validatorIndex;
    }

    uint constant MAX_VALIDATORS = 256;

    address[] private validators;
    mapping(address => accountInfo) private allowedAccounts;
    uint public numAllowedAccounts;
    mapping(address => address[]) private currentVotes;

    modifier senderIsAllowed() {
        require(allowedAccounts[msg.sender].allowed, "sender is not on the allow list");
        _;
    }

    constructor (address[] memory initialAccounts, address[] memory initialValidators) public {
        require(initialAccounts.length > 0, "no initial allowed accounts");
        require(initialValidators.length > 0, "no initial validator accounts");
        require(initialAccounts.length >= initialValidators.length, "number of initial accounts smaller than number of initial validators");
        require(initialValidators.length < MAX_VALIDATORS, "number of validators cannot be larger than 256");

        for (uint i = 0; i < initialAccounts.length; i++) {
            require(initialAccounts[i] != address(0), "initial accounts cannot be zero");
            if (i < initialValidators.length) {
                require(initialValidators[i] != address(0), "initial validators cannot be zero");
                allowedAccounts[initialAccounts[i]] = accountInfo(true, true, uint8(i));
                validators.push(initialValidators[i]);
            } else {
                allowedAccounts[initialAccounts[i]] = accountInfo(true, false, 0);
            }
        }
        numAllowedAccounts = initialAccounts.length;
    }

    function getValidators() override external view returns (address[] memory) {
        return validators;
    }

    function activate(address newValidator) external senderIsAllowed {
        require(newValidator != address(0), "cannot activate validator with address 0");
        uint i;
        for (i=0; i < validators.length; i++) {
            require(newValidator != validators[i], "validator is already active");
        }
        if (allowedAccounts[msg.sender].activeValidator) {
            validators[allowedAccounts[msg.sender].validatorIndex] = newValidator;
        } else {
            require(validators.length < MAX_VALIDATORS, "number of validators cannot be larger than 256");
            allowedAccounts[msg.sender].activeValidator = true;
            allowedAccounts[msg.sender].validatorIndex = uint8(validators.length);
            validators.push(newValidator);
        }

    }

    function deactivate() external senderIsAllowed {
        require(validators.length > 1, "cannot deactivate last validator");
        require(allowedAccounts[msg.sender].activeValidator, "sender does not have an active validator");
        allowedAccounts[msg.sender].activeValidator = false;
        validators[allowedAccounts[msg.sender].validatorIndex] = validators[validators.length-1];
        validators.pop();
    }

    function voteToAddAccountToAllowList(address account) external senderIsAllowed {
        require(allowedAccounts[account].allowed == false, "account to add is already on the allow list");

        for (uint i=0; i < currentVotes[account].length; i++) {
            require(currentVotes[account][i] != msg.sender, "sender has already voted to add account");
        }
        currentVotes[account].push(msg.sender);
    }

    function voteToRemoveAccountFromAllowList(address account) external senderIsAllowed {
        require(account != address(0), "account to be added cannot be 0");
        require(allowedAccounts[account].allowed == true, "account to remove is not on the allow list");

        for (uint i=0; i < currentVotes[account].length; i++) {
            require(currentVotes[account][i] != msg.sender, "sender has already voted to remove account");
        }
        currentVotes[account].push(msg.sender);
    }

    function removeVoteForAccount(address account) external senderIsAllowed {
        for (uint i=0; i < currentVotes[account].length; i++) {
            if (currentVotes[account][i] == msg.sender) {
                currentVotes[account][i] = currentVotes[account][currentVotes[account].length-1];
                currentVotes[account].pop();
                break;
            }
        }
    }

    function countVotes(address account) external senderIsAllowed returns(uint numVotes, uint requiredVotes, bool electionSucceeded) {
        for (uint i=0; i < currentVotes[account].length; i++) {
            if (allowedAccounts[currentVotes[account][i]].allowed) {
                // only increment numVotes if account that voted is still allowed
                numVotes++;
            }
        }
        if (numVotes > numAllowedAccounts / 2) {
            delete(currentVotes[account]);
            if (allowedAccounts[account].allowed) {
                numAllowedAccounts--;
                if(allowedAccounts[account].activeValidator) {
                    require(validators.length > 1, "cannot remove allowed account with last active validator");
                    validators[allowedAccounts[account].validatorIndex] = validators[validators.length - 1];
                    validators.pop();
                }
                delete(allowedAccounts[account]);
            } else {
                numAllowedAccounts++;
                allowedAccounts[account] = accountInfo(true, false, 0);
            }
            return (numVotes, numAllowedAccounts / 2 + 1, true);
        }
        return (numVotes, numAllowedAccounts / 2 + 1, false);
    }
}

