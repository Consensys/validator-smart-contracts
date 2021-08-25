const AllowListContract = artifacts.require("ValidatorSmartContractAllowList.sol");

var fs = require('fs');
var jsonFile = "build/contracts/ValidatorSmartContractAllowList.json";
var parsed= JSON.parse(fs.readFileSync(jsonFile));
var allowListContractAbi = parsed.abi;


contract ("Account Ingress (no contracts registered)", (accounts) => {
    const validators = accounts;

    let allowListContract;

    beforeEach("create a new contract for each test", async () => {
        allowListContract = await AllowListContract.new([accounts[0]], [validators[0]], {from: accounts[0]});
    })

    it("should retrun validators[0] as the only validator after deployment", async () => {
        let result = await allowListContract.getValidators({from: accounts[1]});
        assert.lengthOf(result, 1);
        assert.equal(result[0], validators[0]);
    });

    it("constructor can be called with more initial accounts than validators", async () => {
        myContract = await AllowListContract.new([accounts[0], accounts[1], accounts[2]], [validators[0]], {from: accounts[0]});
        let currentValidators = await myContract.getValidators()
        assert.lengthOf(currentValidators, 1);
        assert.equal(currentValidators[0], validators[0]);
        let numAllowedAccounts = await myContract.numAllowedAccounts();
        assert.equal(numAllowedAccounts, 3);
    });

    it("can add new account to allow list, which can activate a new validator", async () => {
        let numAllowedAccounts = await allowListContract.numAllowedAccounts();
        assert.equal(numAllowedAccounts, 1);

        await allowListContract.voteToAddAccountToAllowList(accounts[1]);
        numAllowedAccounts = await allowListContract.numAllowedAccounts();
        assert.equal(numAllowedAccounts, 1);

        await allowListContract.countVotes(accounts[1]);
        numAllowedAccounts = await allowListContract.numAllowedAccounts();
        assert.equal(numAllowedAccounts, 2);
    });

    it("can activate different validator and deactivate validator", async () => {
        await addValidators(1, 1);

        let currentValidators = await allowListContract.getValidators();
        assert.lengthOf(currentValidators, 2);
        assert.equal(currentValidators[0], validators[0]);
        assert.equal(currentValidators[1], validators[1]);

        await allowListContract.activate(validators[2], {from: accounts[1]});
        currentValidators = await allowListContract.getValidators();

        assert.lengthOf(currentValidators, 2);
        assert.equal(currentValidators[0], validators[0]);
        assert.equal(currentValidators[1], validators[2]);

        await allowListContract.deactivate({from: accounts[0]});
        currentValidators = await allowListContract.getValidators();

        assert.lengthOf(currentValidators, 1);
        assert.equal(currentValidators[0], validators[2]);
    });

    it("need more than 50% of votes to add to allow list", async () => {
        await addValidators(1, 1);

        let numAllowedAccounts = await allowListContract.numAllowedAccounts();
        assert.equal(numAllowedAccounts, 2);

        await allowListContract.voteToAddAccountToAllowList(accounts[2], {from: accounts[0]});
        await allowListContract.countVotes(accounts[2]);
        numAllowedAccounts = await allowListContract.numAllowedAccounts();
        assert.equal(numAllowedAccounts, 2);

        await allowListContract.voteToAddAccountToAllowList(accounts[2], {from: accounts[1]});
        await allowListContract.countVotes(accounts[2]);
        numAllowedAccounts = await allowListContract.numAllowedAccounts();
        assert.equal(numAllowedAccounts, 3);
    });

    it("need more than 50% of votes to remove from allow list", async () => {
        await addValidators(1, 2);

        let numAllowedAccounts = await allowListContract.numAllowedAccounts();
        assert.equal(numAllowedAccounts, 3);

        await allowListContract.voteToRemoveAccountFromAllowList(accounts[2], {from: accounts[0]});
        await allowListContract.countVotes(accounts[2]);
        numAllowedAccounts = await allowListContract.numAllowedAccounts();
        assert.equal(numAllowedAccounts, 3);

        await allowListContract.voteToRemoveAccountFromAllowList(accounts[2], {from: accounts[1]});
        await allowListContract.countVotes(accounts[2]);
        numAllowedAccounts = await allowListContract.numAllowedAccounts();
        assert.equal(numAllowedAccounts, 2);
    });

    it("can be removed from allow list, and activated validators are removed", async () => {
        await addValidators(1, 1);

        let currentValidators = await allowListContract.getValidators();
        assert.lengthOf(currentValidators, 2);
        assert.equal(currentValidators[0], validators[0]);
        assert.equal(currentValidators[1], validators[1]);

        await allowListContract.voteToRemoveAccountFromAllowList(accounts[0], {from: accounts[0]});
        await allowListContract.voteToRemoveAccountFromAllowList(accounts[0], {from: accounts[1]});
        await allowListContract.countVotes(accounts[0]);
        numAllowedAccounts = await allowListContract.numAllowedAccounts();
        assert.equal(numAllowedAccounts, 1);

        currentValidators = await allowListContract.getValidators();
        assert.lengthOf(currentValidators, 1);
        assert.equal(currentValidators[0], validators[1]);
    });

    it("can remove a vote", async () => {
        await addValidators(1, 2);

        let numAllowedAccounts = await allowListContract.numAllowedAccounts();
        assert.equal(numAllowedAccounts, 3);

        await allowListContract.voteToAddAccountToAllowList(accounts[3], {from: accounts[0]});
        await allowListContract.voteToAddAccountToAllowList(accounts[3], {from: accounts[1]});

        await allowListContract.removeVoteForAccount(accounts[3], {from: accounts[0]});

        await allowListContract.countVotes(accounts[2]);
        numAllowedAccounts = await allowListContract.numAllowedAccounts();
        assert.equal(numAllowedAccounts, 3);
    });

    it("can remove a vote", async () => {
        await addValidators(1, 2);

        let numAllowedAccounts = await allowListContract.numAllowedAccounts();
        assert.equal(numAllowedAccounts, 3);

        await allowListContract.voteToAddAccountToAllowList(accounts[3], {from: accounts[0]});
        await allowListContract.voteToAddAccountToAllowList(accounts[3], {from: accounts[1]});

        await allowListContract.removeVoteForAccount(accounts[3], {from: accounts[0]});

        await allowListContract.countVotes(accounts[2]);
        numAllowedAccounts = await allowListContract.numAllowedAccounts();
        assert.equal(numAllowedAccounts, 3);
    });

    it("can call countVotes to get number of votes for an account", async () => {
        await addValidators(1, 1);

        await allowListContract.voteToAddAccountToAllowList(accounts[2], {from: accounts[0]});
        await allowListContract.voteToAddAccountToAllowList(accounts[2], {from: accounts[1]});
        const web3Contract = new web3.eth.Contract(allowListContractAbi, allowListContract.address);
        let result = await web3Contract.methods.countVotes(accounts[2]).call({from: accounts[0]});
        assert.equal(result.numVotes, 2);
        assert.equal(result.requiredVotes, 2);
        assert.equal(result.electionSucceeded, true);
    });

    it("account not on the allow list cannot call voteToAddAccountToAllowList", async () => {
        try {
            await allowListContract.voteToAddAccountToAllowList(accounts[0], {from: accounts[3]});
            assert.fail("Should not allow account not on the allow list to call add");
        } catch (err) {
            expect(err.reason).to.contain("sender is not on the allow list");
        }
    });

    it("account not on the allow list cannot call voteToRemoveAccountFromAllowList", async () => {
        try {
            await allowListContract.voteToRemoveAccountFromAllowList(accounts[0], {from: accounts[3]});
            assert.fail("Should not allow account not on the allow list to call remove");
        } catch (err) {
            expect(err.reason).to.contain("sender is not on the allow list");
        }
    });

    it("account not on the allow list cannot call countVotes", async () => {
        try {
            await allowListContract.countVotes(accounts[0], {from: accounts[3]});
            assert.fail("Should not allow account not on the allow list to call countVotes");
        } catch (err) {
            expect(err.reason).to.contain("sender is not on the allow list");
        }
    });

    it("account not on the allow list cannot call activate", async () => {
        try {
            await allowListContract.activate(accounts[0], {from: accounts[3]});
            assert.fail("Should not allow account not on the allow list to call countVotes");
        } catch (err) {
            expect(err.reason).to.contain("sender is not on the allow list");
        }
    });

    it("account not on the allow list cannot call deactivate", async () => {
        try {
            await allowListContract.deactivate({from: accounts[3]});
            assert.fail("Should not allow account not on the allow list to call countVotes");
        } catch (err) {
            expect(err.reason).to.contain("sender is not on the allow list");
        }
    });

    it("account not on the allow list cannot call removeVoteForAccount", async () => {
        try {
            await allowListContract.removeVoteForAccount(accounts[0], {from: accounts[3]});
            assert.fail("Should not allow account not on the allow list to call countVotes");
        } catch (err) {
            expect(err.reason).to.contain("sender is not on the allow list");
        }
    });

    it("account not on the allow list cannot call add", async () => {
        await addValidators(1, 9);
        let web3Contract = new web3.eth.Contract(allowListContractAbi, allowListContract.address);
        let validators = await web3Contract.methods.getValidators().call();
        assert.equal(validators.length, 10);
    });

    it("constructor cannot be called without inital account", async () => {
        try {
            allowListContract = await AllowListContract.new([], [validators[0]], {from: accounts[0]});
            assert.fail("no inital allowed accounts");
        } catch (err) {
            expect(err.reason).to.contain("no inital allowed accounts");
        }
    });

    it("constructor cannot be called without inital validator", async () => {
        try {
            allowListContract = await AllowListContract.new([accounts[0]], [], {from: accounts[0]});
            assert.fail("no inital validator accounts\"");
        } catch (err) {
            expect(err.reason).to.contain("no inital validator accounts");
        }
    });

    it("constructor cannot be called with initial accounts smaller than initial validators", async () => {
        try {
            allowListContract = await AllowListContract.new([accounts[0]], [validators[0], validators[1]], {from: accounts[0]});
            assert.fail("number of initial accounts smaller than number of inital validators");
        } catch (err) {
            expect(err.reason).to.contain("number of initial accounts smaller than number of inital validators");
        }
    });

    it("constructor cannot be called with initial accounts of 0", async () => {
        try {
            allowListContract = await AllowListContract.new(['0x0000000000000000000000000000000000000000'], [validators[0]], {from: accounts[0]});
            assert.fail("initial accounts cannot be zero");
        } catch (err) {
            expect(err.reason).to.contain("initial accounts cannot be zero");
        }
    });

    it("constructor cannot be called with initial accounts of 0", async () => {
        try {
            allowListContract = await AllowListContract.new([accounts[0]], ['0x0000000000000000000000000000000000000000'], {from: accounts[0]});
            assert.fail("initial validators cannot be zero");
        } catch (err) {
            expect(err.reason).to.contain("initial validators cannot be zero");
        }
    });
    // assumes that accounts 0 to start-1 are allowed
    // adds accounts [start] to [end] with activated validators [start] to [end]
    async function addValidators(start, end) {
        for (let i = start; i <= end; i++) {
            for (let j = 0; j <= i/2; j++) {
                await allowListContract.voteToAddAccountToAllowList(accounts[i], {from: accounts[j]});
            }
            await allowListContract.countVotes(accounts[i]);
            await allowListContract.activate(validators[i], {from: accounts[i]});
        }
    }

});
