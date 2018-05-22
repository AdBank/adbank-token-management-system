--- Configuration ---
server.js loads settings for the app

* db
	- url
		mongodb url
* web3
	- provider
		live/test network running provider ( IPC )
* contract
	- abi
		Adbank smart contract ABI file. You can get it easily after compilation. ( Try to get it in Remix )
	- owner address
		Your eth address where you want to deploy smart contract
	- password
		Your eth address password ( This is used to unlock your address to send tokens )
	- address
		You deploy smart contract on your eth address. Then you get smart contract mined address.
		This is used to create smart contract object in node.
	- decimals
		Your token decimal
* networkWallet ( Gas holder )
	- address
		Your network wallet address
		When we create internal wallet, we send 0.01 ETH to the created internal wallet from network wallet.
		That's because transactions can be made between two created internal wallets.
		Currently, in my test configration, it is set as the one same as contract owner address.
	- password
		Your network wallet password
* revenueWallet ( Fee holder )
	- address
		Your revenue wallet address
		When transaction is happening from advertiser to publisher, fee is sent to the fee holder.
	- password
		Your revenue wallet password *(No need to have the password because it is just to send token in this wallet)*

--- Platform Explanation ---

This platform doesn't return / share any internal wallet info, contract info.
It just accepts userId which is unique and other appropriate parameters from main network platform and does proper actions.

Below is the brief explanation for API endpoints.
All API endpoints are working based on x-api-key(header).
You can check/change the right value in config/dev.js. This is used for security and nobody can't use any API without this key.

*	/system
	Parameters: 
		action: on/off

	Description:
		This endpoint is to turn on/off the system.
		If the system is turned off, any APIs won't work.

*	/ownerTokenBalance
	Parameters:
		None

	Description:
		This endpoint returns contract owner's token balance

*	/holderTokenBalance
	Parameters:
		address: eth address of any token holder

*	/userTokenBalance
	Parameters:
		walletId: string value which is unique

	Description:
		This endpoint returns token balance of user

*	/wallet
	Parameters:
		userId: string value which is unique

	Description:
		This endpoint accepts userId.
		If it is new, new user is created and saved in database. (address, private key)
		And then, it creates internal wallet automatically and transfers 0.01 ETH from master ETH wallet to the newly created internal wallet.
		This transferred ETH will be used for transactions between internal wallets.
		If successful, it returns only success message and wallet Id which is unique.

*  /transferTokens
	Parameters:
		walletId: string value which is unique
		tokenAmount: float value

	Description:
		This endpoint is to transfer tokens from contract owner to the user.

*	/withdraw
	Parameters:
		walletId: string value which is unique
		address: public wallet address
		tokenAmount: float value ( optional )
	Description:
		This endpoint will withdraw all tokens from the user's internal wallet to the specified public address.

*	/transferTokensInternally
	Parameters:
		fromWalletId: string value which is unique
		toWalletId: string value which is unique
		tokenAmount: float value

	Description:
		This endpoint is to transfer tokens from <fromUser>'s internal wallet to <toUser>'s internal wallet.

*	/history
	Parameters:
		walletId: wallet Id of the user ( advertiser / publisher ) 
	
	Description:
		This endpoint is to return the transaction history of the user.

--- Suggestion ---

It is recommended to call API endpoints by using PHP Curl, not by using front end method like jQuery Ajax.
Because front end methods can be easily detected by using tools like Browser Console Network tab.

That means, anyone can easily get the security key. This is really dangerous.

So, security key has to be shared only in main network backend.

When the main network is live on url, that's the right time to add "accept" header field so that the requests from the specified source can be only accepted.


--- Conclusion ---

It is fully tested in Test Network.
Test is not done on Live Network.
If there are things which are not clear or not working, contact "tspaup@gmail.com" at any time.
