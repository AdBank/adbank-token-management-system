1.	Summary
	This documentation shows how to lanuch it form bottom to the live.
	Make a reference to DOCUMENT.md for understanding the API configuration and details.

2.	Installation / Deploy
	1)	Make sure you owned one eth address for your smart contract to be deployed. It can be called as owner address.
	2)	There are several ways to deploy smart contracts. Let's go with remix
		- Make sure MetaMask is installed on your browser. ( MetaMask Extension. The icon is fox )
		- Once it is installed, make sure active network is main network, not test. "Top left corner".
		- Create / Import account in MetaMask.
		- Make sure the one created/imported that you are going to use as contract owner address is active inside MetaMask.
		- Go to remix.ethereum.org.
		- Upload AdBank.sol ( Smart Contract File ) in remix and click "compile".
		- After it had been compiled, go to "run" tab which is next to "compile" tab.
		- Make sure "Injected Web3" is selected in "Environment" dropdown.
		- You will see your active eth account in MetaMask is appeared in Account dropdown.
		- Give Gas Limit and value.
		- Below, Choose AdBank smart contract in dropdown.
		- Click Create
		- Then you will see something is happening in etherscan.io. You can go to etherscan.io/address/your_owner_address
		- Once the transaction is confirmed, you need to keep the mined address. "Contract Address"
	3)	Network creation and syncing
		- Go to your platform where you want to launch and run token management system. We will run network on the same platform.
		- On that platform, install geth. https://github.com/ethereum/go-ethereum/wiki/Installing-Geth
		- Run network and it will start sync automatically.
		  * geth removedb *
		  * geth --fast --bootnodes "enode://20c9ad97c081d63397d7b685a412227a40e23c8bdc6688c6f37e97cfbc22d2b4d1db1510d8f61e6a8866ad7f0e17c02b14182d37ea7c3c8b9c2683aeb6b733a1@52.169.14.227:30303,enode://6ce05930c72abc632c58e2e4324f7c7ea478cec0ed4fa2528982cf34483094e9cbc9216e7aa349691242576d552a2a56aaeae426c5303ded677ce455ba1acd9d@13.84.180.240:30303" *
		- We need to wait till the network is fully synced.
		- After that, it's the time to run this as a daemon inside the platform.
		- Let's suppose we use Ubuntu under AWS and we are in its shell terminal.
		- Go to /lib/systemd/system directory. cd /lib/systemd/system
		- Make new file named geth.service. sudo vi geth.service.
		- Put this content inside that file.
			* [Unit] *
			* Description=The Live Network *
			* Documentation=man:geth(1) *
			* After=network.target *
			* *
			* [Service] *
			* User=ubuntu *
			* Group=ubuntu *
			* ExecStart=/usr/bin/geth --fast 2>/home/ubuntu/geth.log *
			* *
			* [Install] *
			* WantedBy=default.target *
		- Enable this service. sudo systemctl enable geth.service
		- Start this service. sudo systemctl start geth.service
		- Now, we need to run the token management system application.
		- Go to config/live.js and give appropriate values following the DOCUMENT.md.
		- Install node, npm, nginx on the platform.
		- Locate the full application directory in the platform.
		- Go to that folder.
		- Run "npm install"
		- Make sure new folder named "node_modules" are generated.
		- Run "NODE_ENV=live node server.js" and make sure there is no error.
		- Now, we need to run this application as a daemon process
		- Install pm2 [https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-16-04]
		- When running pm2, make sure use this command. "NODE_ENV=live pm2 start server.js"
		- The token management system application runs on Port 3000 by default.
		- We need to bind this using nginx.
		- Then it's all set.

3.	My opinion regarding new idea.
	1) Current process
		* When new wallet is created, master ETH holder sends 0.1 ETH to the newly created wallet. There is no Fee holder for now *
	2) New process
		* New Idea is really great. There is Fee holder and ETH / Token holder. *
		* Every new transaction is made between two internal wallets, Fee holder holds its quantity. That comes from transaction caller. In new idea, ETH holder and Token holder are same. *
	3) My Opinion
		* In my opinion, it is better to have 3 holders. ETH holder, Fee holder and token holder. ( contract owner ) *
		* ETH holder only covers eth for internal wallet when it is created. *
		* Fee holder only covers fee. *
		* Token holder only sends tokens to internal wallets. *
		* It will be good to maintain clear transaction history. We might need to develop API to fetch transaction history and do appropriate actions. In that case, this approach will give much help. Because each holder contains exact purpose transaction list. *
4.	Conclusion
	* If you have any other problems, just contact me. *
	* Email: tspaup@gmail.com *