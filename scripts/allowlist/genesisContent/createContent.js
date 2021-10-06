const BN = require("../node_modules/bn.js/lib/bn");
const fs = require("fs");
const XRegExp = require('xregexp');
const { sha3, soliditySha3, padLeft } = require("web3-utils");

function main() {
    var text = fs.readFileSync("./allowedAccountsAndValidators.txt", "utf-8");
    var lines = text.split("\n")
    var accMap = new Map();
    var valMap = new Map();

    let section = {};
    let contract = {};
    section["<Address of Contract>"] = contract;
    contract.comment = "validator smart contract";
    contract.balance = "0x00";
    contract.code = "0x<Contract Code>";
    let storage = {};

    let validatorIndex = 0;
    let entries = [];
    let entriesIndex = 0;

    for (i = 0; i < lines.length - 1; i++) {
        if (lines[i].trim().length !== 0) {
            values = lines[i].split(',');
            let acc = values[0].trim();
            testIfHexAddress(acc, i + 1);
            checkAlreadyUsed(accMap, acc);
            if (values.length === 1) {
                entries[entriesIndex] = {account: acc, validator: null, validatorIndex: null};
            } else if (values.length === 2) {
                let vali = values[1].trim();
                testIfHexAddress(vali, i + 1);
                checkAlreadyUsed(valMap, vali);
                entries[entriesIndex] = {account: acc, validator: vali, validatorIndex: validatorIndex};
                validatorIndex++;
            } else {
                console.log("ERROR: lines can only have 1 or 2 addresses");
                process.exit(-1);
            }
            entriesIndex++;
        }
    }

    // length of the validator array is stored in slot 0
    storage["0000000000000000000000000000000000000000000000000000000000000000"] = padLeft(validatorIndex, 64).substring(2);

    // validator array entries are stored beginning at slot sha3(slot(0))
    let firstSlotForValidatorArray = sha3("0x0000000000000000000000000000000000000000000000000000000000000000").substring(2);
    for (i = 0; i < entries.length; i++) {
        if (entries[i].validatorIndex !== null) {
            let slot = new BN(firstSlotForValidatorArray, 16).add(new BN(entries[i].validatorIndex)).toString(16);
            storage[padLeft(slot, 64)] = padLeft(entries[i].validator.substring(2).toLowerCase(), 64);
        }
    }

    // mappings for the allowed accounts are stored in slot sha3(account | slot(1))
    let pAllowed = "0000000000000000000000000000000000000000000000000000000000000001";
    for (i = 0; i < entries.length; i++) {
        let account = padLeft(entries[i].account.substring(2), 64);
        let slotAllowed = sha3('0x' + account + pAllowed).substring(2).toLowerCase();
        if (entries[i].validatorIndex !== null) {
            storage[padLeft(slotAllowed, 64)] = padLeft(entries[i].validatorIndex.toString(16) + "0101", 64); // validatorIndex(hex) | activeValidator:true(0x01) | allowed:true(0x01)
        } else {
            storage[padLeft(slotAllowed, 64)] = padLeft("01", 64); // validatorIndex:0x00 | activeValidator:false(0x00) | allowed:true(0x01)
        }
    }

    // mappings from validator to account are stored in slot sha3(validator | slot(2))
    let pV2A = "0000000000000000000000000000000000000000000000000000000000000002";
    for (i = 0; i < entries.length; i++) {
        if (entries[i].validatorIndex !== null) {
            let slotV2A = sha3('0x' + padLeft(entries[i].validator.substring(2), 64) + pV2A).substring(2).toLowerCase();
            storage[padLeft(slotV2A, 64)] = padLeft(entries[i].account.substring(2).toLowerCase(), 64);
        }
    }

    // number of allowed accounts is stored in slot(3)
    storage["0000000000000000000000000000000000000000000000000000000000000003"] = padLeft(entries.length.toString(16), 64);



    contract.storage = storage;
    contract.version = "0x01";

    var writeStream = fs.createWriteStream("Storage.txt");
    let stringify = JSON.stringify(section, null, "\t");
    writeStream.write(stringify.substring(2, stringify.length - 2)); // do not write lines with enclosing brackets
}

function testIfHexAddress(hexString, lineNumber) {
    const re = XRegExp('^0x[0-9A-Fa-f]{40}$');
    if (!re.test(hexString)) {
        console.log("ERROR: Invalid address in line " + lineNumber + ": '" + hexString + "'");
        process.exit(-1);
    }
}

function checkAlreadyUsed(map, key) {
    if (map.has(key)) {
        console.log("ERROR: Accounts and Validators can only be used once");
        process.exit(-1);
    }
    map.set(key, 1);
}

if (require.main === module) {
    main();
}
