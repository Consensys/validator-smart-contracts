# Manual Testing

This directory and it's subdirectories contain configuration files and other files that can be used to create a 
two node Besu cluster that uses QBFT to validate blocks and the allowlist smart contract to select the validators. 

This has been tested to work with besu version besu/v21.10.0-RC2-dev-012d95ce/osx-x86_64/oracle_openjdk-java-11.

Start Node 1:

    besu --genesis-file qbftNode1/besu_genesis.json --data-path qbftNode1/data --node-private-key-file=qbftNode1/val_key_1 --rpc-http-enabled --rpc-http-apis=ETH,NET,DEBUG,ADMIN,WEB3,EEA,PRIV,QBFT,TRACE --rpc-http-port=8590 --min-gas-price=0 --p2p-port=30304 --network-id=2017 --host-allowlist="all" --rpc-http-cors-origins="all"

Start Node 2:

    besu --genesis-file qbftNode2/besu_genesis.json --data-path qbftNode2/data --node-private-key-file=qbftNode2/val_key_1 --rpc-http-enabled --rpc-http-apis=ETH,NET,DEBUG,ADMIN,WEB3,EEA,PRIV,QBFT,TRACE --rpc-http-port=8591 --min-gas-price=0 --p2p-port=30305 --network-id=2017 --host-allowlist="all" --rpc-http-cors-origins="all"


Validators:
 * Besu Node 1 account: 0x9A6d82Ef3912d5aB60473124BCCd2f2A640769D7, private key: 0x70f1384b24df3d2cdaca7974552ec28f055812ca5e4da7a0ccd0ac0f8a4a9b00
 * Besu Node 2 account: 0x65463BF6268e5cC409b6501eC846487B935A1446, private key: 0xad0352cfc09aa0128db4e135fcea276523c400163dcc762a11ecba29d5f0a34a

Allowed Accounts:
 * 0xfe3b557e8fb62b89f4916b721be55ceb828dbd73, private key: 0x8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63 
   (acitve validator in genesis block is 0x9A6d82Ef3912d5aB60473124BCCd2f2A640769D7)
 * 0x627306090abaB3A6e1400e9345bC60c78a8BEf57, private key: 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3
   (acitve validator in genesis block is 0x65463BF6268e5cC409b6501eC846487B935A1446)


##Example CLI calls:
export NODE_NO_WARNINGS=1

node allowlist.js getValidators -p 0x70f1384b24df3d2cdaca7974552ec28f055812ca5e4da7a0ccd0ac0f8a4a9b00 -i 2017 -u http://localhost:8590

node allowlist.js removeAccount 0x627306090abaB3A6e1400e9345bC60c78a8BEf57 -p 0x8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63 -i 2017 -u http://localhost:8590

node allowlist.js removeAccount 0x627306090abaB3A6e1400e9345bC60c78a8BEf57 -p 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 -i 2017 -u http://localhost:8590

node allowlist.js addAccount  0x627306090abaB3A6e1400e9345bC60c78a8BEf57  -p 0x8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63 -i 2017 -u http://localhost:8590

node allowlist.js countVotes 0x627306090abaB3A6e1400e9345bC60c78a8BEf57 -p 0x8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63 -i 2017 -u http://localhost:8590

node allowlist.js activate 0x65463BF6268e5cC409b6501eC846487B935A1446 -p 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 -i 2017 -u http://localhost:8590

node allowlist.js activate 0x65463BF6268e5cC409b6501eC846487B935A1446 -p 0x8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63 -i 2017 -u http://localhost:8590

node allowlist.js activate 0x65463BF6268e5cC409b6501eC846487B935A1446 -p 0x70f1384b24df3d2cdaca7974552ec28f055812ca5e4da7a0ccd0ac0f8a4a9b00 -i 2017 -u http://localhost:8590

node allowlist.js activate 0x9A6d82Ef3912d5aB60473124BCCd2f2A640769D7 -p 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 -i 2017 -u http://localhost:8590

node allowlist.js deactivate -p 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 -i 2017 -u http://localhost:8590
