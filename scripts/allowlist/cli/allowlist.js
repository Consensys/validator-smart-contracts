const Web3 = require("web3");
const Contract = require("@truffle/contract");
const HDWalletProvider = require("@truffle/hdwallet-provider");
const XRegExp = require('xregexp');
const Fs = require('fs');
const argv = require('yargs')
    .env('ALLOWLIST')
    .command('activate <validator>', 'activates a validator for the sender of the transaction', {
        validator: {
            description: 'address of the validator as a hexadecimal string',
            type: 'string',
        }
    })
    .command('deactivate', 'deactivates the validator for the sender of the transaction', {
    })
    .command('addAccount <account>', 'vote for an account to be added to the allowlist', {
        account: {
            description: 'address of the account as a hexadecimal string',
            type: 'string',
        }
    })
    .command('removeAccount <account>', 'vote for an account to be removed from the allowlist', {
        account: {
            description: 'address of the account as a hexadecimal string',
            type: 'string',
        }
    })
    .command('countVotes <account>', 'count the votes for an account to be added or removed', {
        account: {
            description: 'address of the account as a hexadecimal string',
            type: 'string',
        }
    })
    .command('removeVote <account>', 'remove the vote for an account', {
        account: {
            description: 'address of the account as a hexadecimal string',
            type: 'string',
        }
    })
    .command('getValidators', 'get validators for the last block', {
    })
    .command('numAllowedAccounts', 'get the number of allowed accounts for the last block', {
    })
    .option('contractAddress', {
        alias: 'a',
        demandOption: true,
        default: "0000000000000000000000000000000000008888",
        describe: 'private key in hexadecimal format',
        type: 'string',
    })
    .option('privateKey', {
        alias: 'p',
        describe: 'private key in hexadecimal format',
        type: 'string',
    })
    .option('url', {
        alias: 'u',
        demandOption: true,
        default: 'http://localhost:8545',
        describe: 'URL of the Ethereum client',
        type: 'string',
    })
    .option('chainId', {
        alias: 'i',
        demandOption: true,
        describe: 'chainId of the blockchain',
        type: 'string',
    })
    .help()
    .alias('help', 'h')
    .argv;

function prefix0x(need0x, str) {
    if (need0x && !str.startsWith('0x')) {
        return "0x" + str;
    } else if (!need0x && str.startsWith("0x")) {
        return str.substr(2);
    }
    return str;
}

function getHex(str, len, need0x, name) {
    var re = XRegExp(`^0x[0-9A-Fa-f]{${len}}$`);
    if (!re.test(prefix0x(true,str))) {
        console.log(`ERROR: Invalid hex string for ${name}: ${str}`);
        if (str.length !== len+2) {
            console.log(`Expected length is ${len} digits, actual length is ${str.length-2} digits`)
        }
        process.exit(-1);
    }
    return prefix0x(need0x, str);
}

function validHexAccount(str) {
    var re = XRegExp(`^0x[0-9A-Fa-f]{40}$`);
    if (!re.test(str)) {
        if (str.length !== 42) {
            return false;
        }
    }
    return true;
}

async function getEvent(eventname, mycontract, receipt) {
    const event = await mycontract.getPastEvents(eventname,
        {fromBlock: receipt.blockNumber, toBlock: receipt.blockNumber});
    console.log(`Event from transaction:\n${JSON.stringify(event[0], null, 4)}`)
}

async function main() {
    const abi = Fs.readFileSync('ValidatorSmartContractAllowList.abi', 'utf-8');
    const contractJson = JSON.parse(abi);

    let provider = new HDWalletProvider({
        privateKeys:[getHex(argv.privateKey, 64, false, "privateKey")],
        providerOrUrl:argv.url,
        chainId:Number(argv.chainId)
    });

    web3 = new Web3(provider);
    web3.eth.handleRevert = true;

    const myAccount = web3.eth.accounts.privateKeyToAccount(prefix0x(true, argv.privateKey));
    const mycontract = await new web3.eth.Contract(contractJson, getHex(argv.contractAddress, 40, false, "contractAddress"));

    let validators;
    // check whether the contract address is correct
    try {
        validators = await mycontract.methods.getValidators().call();
        if (validators.length < 1 || !validHexAccount(validators[0])) {
            console.log("The contract address provided is not correct. Please check and rerun!");
            console.log(`Got the following return value calling the getValidators method on the contract:\n${validators}`)
            process.exit(-1);
        }
    } catch(e) {
        console.log("The contract address provided is not correct. Please check and rerun!");
        console.log(`Got the following error message calling the getValidators method on the contract:\n${e.message}`)
        process.exit(-1);
    }

    let status;
    let receipt;
    try {
        switch (argv._[0]) {
            case "getValidators":
                console.log(`Validators: ${validators}`); // validators have already been retrieved to check contract
                break;
            case "numAllowedAccounts":
                const numAllowedAccounts = await mycontract.methods.numAllowedAccounts().call();
                console.log(`Number of allowed Acocunts: ${numAllowedAccounts}`);
                break;
            case "activate":
                console.log(`Sending a transaction from account ${myAccount.address} to activate validator ${argv.validator}`);
                receipt = await mycontract.methods.activate(getHex(argv.validator, 40, true, "validator")).send({from: myAccount.address});
                status = receipt.status ? "Success" : "Failed";
                console.log(`Activating validator ${argv.validator} for account ${myAccount.address}: ${status}`);
                await getEvent("Validator", mycontract, receipt);
                break;
            case "deactivate":
                console.log(`Sending a transaction from account ${myAccount.address} to deactivate its validator`);
                receipt = await mycontract.methods.deactivate().send({from: myAccount.address});
                status = receipt.status ? "Success" : "Failed";
                console.log(`Deactivating validator for account ${myAccount.address}: ${status}`);
                await getEvent("Validator", mycontract, receipt);
                break;
            case "addAccount":
                console.log(`Sending a transaction from account ${myAccount.address} to vote to add account ${argv.account} to the allowlist`);
                receipt = await mycontract.methods.voteToAddAccountToAllowList(getHex(argv.account, 40, true, "account")).send({from: myAccount.address});
                status = receipt.status ? "Success" : "Failed";
                console.log(`Vote to add account ${argv.account}: ${status}`);
                await getEvent("Vote", mycontract, receipt);
                break;
            case "removeAccount":
                console.log(`Sending a transaction from account ${myAccount.address} to vote to remove account ${argv.account} from the allowlist`);
                receipt = await mycontract.methods.voteToRemoveAccountFromAllowList(getHex(argv.account, 40, true, "account")).send({from: myAccount.address});
                status = receipt.status ? "Success" : "Failed";
                console.log(`Vote to remove account ${argv.account}: ${status}`);
                await getEvent("Vote", mycontract, receipt);
                break;
            case "removeVote":
                console.log(`Sending a transaction from account ${myAccount.address} to remove vote for account ${argv.account}`);
                receipt = await mycontract.methods.removeVoteForAccount(getHex(argv.account, 40, true, "account")).send({from: myAccount.address});
                status = receipt.status ? "Success" : "Failed";
                console.log(`Remove vote for account ${argv.account}: ${status}`);
                await getEvent("Vote", mycontract, receipt);
                break;
            case "countVotes":
                console.log(`Sending a transaction from account ${myAccount.address} to count the votes for account ${argv.account}`);
                receipt = await mycontract.methods.countVotes(getHex(argv.account, 40, true, "account")).send({from: myAccount.address});
                status = receipt.status ? "Success" : "Failed";
                console.log(`Count votes for account ${argv.account}: ${status}`);
                await getEvent("AllowedAccount", mycontract, receipt);
                break;
            default:
                console.log(`Unknown command ${argv._[0]}`);
                break;
        }
    } catch (e) {
        const message = e.message;
        const lines = message.split('\n');
        if (lines.length > 1 && lines[0] === "Execution reverted" && lines[1].length > 138 && lines[1].startsWith("0x")) {
            console.log(`Execution reverted with revert reason:\n${web3.utils.hexToAscii("0x" + lines[1].substr(138))}`);
        } else {
            console.log(message);
        }
    }

    process.exit(0);
}

if (require.main === module) {
    main();
}
