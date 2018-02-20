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
- Go to config/dev.js and give appropriate settings
- node server.js ( This will run the script and API endpoints will be open )

#Dev Network Process
geth --datadir devnet --dev --rpc --rpcaddr="localhost" console
#Dev Network Mining
geth --datadir devnet --dev --mine --minerthreads 1 --etherbase 0

#Extra Commands ( Not Used)
geth --datadir testnet removedb
geth --datadir testnet init genesis.json
geth --fast --cache 512 --rpc --rpcaddr="localhost" --rpcapi="db,eth,net,personal,miner,web3" --networkid 1234 --datadir testnet console

#Other Usage ( Not Used)
geth --testnet --syncmode "fast" --rpc --rpcaddr="localhost" --rpcapi="db,eth,net,personal,miner,web3" --cache=1024 console

#Other Usage (Ropsten)
geth --testnet --fast --nodiscover --rpc --rpcaddr="localhost" console 2>> geth.log

#Mining
miner.setEtherbase(personal.listAccounts[0])
miner.start()