const BN = require("bn.js");
const fs = require("fs");
const XRegExp = require('xregexp');
const { sha3, soliditySha3, padLeft } = require("web3-utils");

var text = fs.readFileSync("./allowedAccountsAndValidators.txt", "utf-8");
var lines = text.split("\n")
var writeStream = fs.createWriteStream("Storage.txt");
var re = XRegExp('^0x[0-9A-Fa-f]{40}$');
var accMap = new Map();
var valMap = new Map();

writeIntro();

let validatorIndex = 0;
let entries = [];
let entriesIndex = 0;

for (i = 0; i < lines.length - 1; i++ ) {
    if (lines[i].trim().length !== 0) {
        values = lines[i].split(',');
        let acc = values[0].trim();
        testIfHexAddress(acc, i+1);
        checkAlreadyUsed(accMap, acc);
        if (values.length === 1) {
            entries[entriesIndex] = {account: acc, validator: null, validatorIndex: null};
        } else if (values.length === 2) {
            let vali = values[1].trim();
            testIfHexAddress(vali, i+1);
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
writeStream.write('        "0000000000000000000000000000000000000000000000000000000000000000": "' + padLeft(validatorIndex, 64).substring(2) + '",\n');

// validator array entries are stored beginning at slot sha3(slot(0))
let firstSlotForValidatorArray = sha3("0x0000000000000000000000000000000000000000000000000000000000000000").substring(2);
for (i = 0; i < entries.length; i++ ) {
    if (entries[i].validatorIndex !== null) {
        let slot = new BN(firstSlotForValidatorArray, 16).add(new BN(entries[i].validatorIndex)).toString(16);
        writeStream.write('        "' + padLeft(slot, 64) + '": "' +  padLeft(entries[i].validator.substring(2).toLowerCase(), 64) + '",\n');
    }
}

// mappings for the allowed accounts are stored in slot sha3(account | slot(1))
let p = "0000000000000000000000000000000000000000000000000000000000000001"; // mapping is slot 1
for (i = 0; i < entries.length; i++ ) {
    // add the entries for the allowed notes mapping
    let account = padLeft(entries[i].account.substring(2), 64);
    let slot = sha3('0x' + account + p).substring(2).toLowerCase();
    let structContent;
    if (entries[i].validatorIndex !== null) {
        structContent = padLeft(entries[i].validatorIndex.toString(16) + "0101", 64); // validatorIndex(hex) | activeValidator:true | allowed:true
    } else {
        structContent = padLeft("01", 64); // validatorIndex:0x00 | activeValidator:false(0x00) | allowed:true(0x01)
    }
    writeStream.write('        "' + padLeft(slot, 64) + '": "' + structContent  + '",\n')
}

// number of allowed accounts is stored in slot(2)
writeStream.write('        "' + "0000000000000000000000000000000000000000000000000000000000000002" + '": "' + padLeft(entries.length.toString(16), 64)  + '"\n');

writeEnd();

function writeIntro() {
    writeStream.write('"0x<Address of Contract>": {\n');
    writeStream.write('    "balance": "0x00",\n');
    writeStream.write('    "code": "0x<Code of the Contract (bin-runtime)>"\n');
    writeStream.write('    "storage": {\n');
}

function writeEnd() {
    writeStream.write('    },\n');
    writeStream.write('    "version": "0x01"\n');
    writeStream.write('}\n');

    writeStream.end();
}

function testIfHexAddress(hexString, lineNumber) {
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
