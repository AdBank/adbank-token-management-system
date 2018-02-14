--- Platform Explanation ---

This platform doesn't return / share any internal wallet info, contract info.
It just accepts userId which is unique and other appropriate parameters from main network platform and does proper actions.

Below is the brief explanation for API endpoints.
All API endpoints are working based on x-api-key(header).
You can check/change the right value in config/dev.js. This is used for security and nobody can't use any API without this key.

1.	/system
	Parameters: 
		action: on/off

	Description:
		This endpoint is to turn on/off the system.
		If the system is turned off, any APIs won't work.

2.	/ownerTokenBalance
	Parameters:
		None

	Description:
		This endpoint returns contract owner's token balance

3.	/userTokenBalance
	Parameters:
		userId: integer value which is unique

	Description:
		This endpoint returns token balance of user

4.	/wallet
	Parameters:
		userId: integer value which is unique

	Description:
		This endpoint accepts userId.
		If it is new, new user is created and saved in database. (address, private key)
		And then, it creates internal wallet automatically and transfers 1 ETH from master ETH wallet to the newly created internal wallet.
		This transferred ETH will be used for transactions between internal wallets.
		If successful, it returns only success message without created wallet info.

5.  /transferTokens
	Parameters:
		userId: integer value which is unique
		tokenAmount: float value

	Description:
		This endpoint is to transfer tokens from contract owner to the user.

6.	/withdraw
	Parameters:
		userId: integer value which is unique
		address: public wallet address

	Description:
		This endpoint will withdraw all tokens from the user's internal wallet to the specified public address.

7.	/transferTokensInternally
	Parameters:
		fromUserId: integer value which is unique
		toUserId: integer value which is unique
		tokenAmount: float value

	Description:
		This endpoint is to transfer tokens from <fromUser>'s internal wallet to <toUser>'s internal wallet.


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