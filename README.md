#Description
- It is blockchain system for Advertiser / Publisher.
- Advertiser makes payment in ADB tokens to publisher.
- Actually, wallets for each advertiser / publisher are made by this system and kept in private.
- Whenever advertiser makes payment, it checks the remaining gas of advertiser wallet.
- If it is not enough, fee is sent from AdBank Network Wallet to the advertiser wallet.
- Fee is calculated and it is sent to AdBank Revenue Wallet along with the payment to the publisher wallet.
- Publisher can export tokens from his internal wallet to any external wallet.

#Tips
- Run network ( live or test )
- Go to config and give appropriate settings
- Run mongoDB
- node server.js ( This will run the script and API endpoints will be open )
  (NODE_ENV="<mode name>" node server.js)

#Network (Dev)
- geth --dev --datadir ./devnet --rpc --rpcapi admin,eth,miner,net,personal,web3 console

#Network (Ropsten)
- geth --testnet removedb
- geth --testnet --fast --bootnodes 'enode://20c9ad97c081d63397d7b685a412227a40e23c8bdc6688c6f37e97cfbc22d2b4d1db1510d8f61e6a8866ad7f0e17c02b14182d37ea7c3c8b9c2683aeb6b733a1@52.169.14.227:30303,enode://6ce05930c72abc632c58e2e4324f7c7ea478cec0ed4fa2528982cf34483094e9cbc9216e7aa349691242576d552a2a56aaeae426c5303ded677ce455ba1acd9d@13.84.180.240:30303'
- geth --testnet --fast --rpc --rpcapi admin,eth,miner,net,personal,web3 2>/home/ubuntu/geth.log

#Network (Live)
- geth --fast --cache 1024 --rpc --rpcapi admin,eth,miner,net,personal,web3