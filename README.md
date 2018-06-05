#Description
A system is needed that communicates with the main AdBank Ad Network such that token payments from advertisers to publishers, for example, can be made automatically without users having to share their own personal wallets public and private keys.

To facilitate this, the system needs to be able to create wallets, store their information, and execute token transactions automatically. The system also needs to be able to send tokens from the internal wallets to external wallets upon user request. Finally, the system needs to be secure to ensure that a hacker can not break into the system and steal tokens from the internal wallets nor steal public and private keys for internal and external wallets.

New Sign Up of Advertiser or Publisher

Main system creates new account and records details including the user's personal wallet ID (we don't know nor need to know their private key)
Token management system creates a new internal wallet, records the public wallet ID, securely records the private key, and links the wallet to the main system account for that person
An internal wallet is simply a normal Ethereum wallet where the system records the public and private key in a secure database, allowing the system to make transactions between wallets automatically on behalf of users
Payment from Advertiser to Publisher

When the main system has recorded enough transactions between a specific pair of advertiser and publisher, the main system will send a request to the token management system to transfer tokens between the two matching internal wallets
When the main system receives a request from a user to get their tokens out of the AdBank Ad Network, the token system receives a request to transfer tokens from an internal wallet to the user's personal wallet
The token system will return a success or failure message to the main system after each transaction
Wallet Balance Details

The Token Management System needs to be able to take a request for a wallet balance and return that balance to the main system
Security

The system needs to be secure and make it difficult for someone to hack it and gain access such that tokens can be drained away from internal wallets to any external addresses, as well as making it difficult to obtain the public and private keys of the internal wallets
There should be some way for the token system to be temporarily shut down so that no internal wallet transactions can happen and no one can break in and steal anything during an attack on the servers of some kind

#Tips
- Run network ( live or test )
- Go to config/dev.js (live.js) and give appropriate settings
- node server.js ( This will run the script and API endpoints will be open )
  (NODE_ENV="live" node server.js)

#Network (Dev)
- geth --dev --datadir ./devnet --rpc --rpcapi admin,eth,miner,net,personal,web3,rpc console

#Network (Ropsten)
- geth --testnet removedb
- geth --testnet --fast --bootnodes 'enode://20c9ad97c081d63397d7b685a412227a40e23c8bdc6688c6f37e97cfbc22d2b4d1db1510d8f61e6a8866ad7f0e17c02b14182d37ea7c3c8b9c2683aeb6b733a1@52.169.14.227:30303,enode://6ce05930c72abc632c58e2e4324f7c7ea478cec0ed4fa2528982cf34483094e9cbc9216e7aa349691242576d552a2a56aaeae426c5303ded677ce455ba1acd9d@13.84.180.240:30303'
- geth --testnet --fast --mine --minerthreads 1 --etherbase 0 2>/home/ubuntu/geth.log