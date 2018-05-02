module.exports = function(app) {
	var mongoose = require('mongoose'),
		bcrypt  = require('bcrypt'),
		Web3    = require('web3'),
		Cryptr = require('cryptr'),
		Wallet = require('../models/wallet'),
		History = require('../models/history'),
		BigNumber = require("bignumber.js"),
		net = require('net'),
		Tx = require('ethereumjs-tx'),
		stripHexPrefix = require('strip-hex-prefix'),
		ethereum_address = require('ethereum-address');

	var flag = true; // System flag

	var cryptr = new Cryptr('AdBankTokenNetwork');
	var client = new net.Socket();

	/* Web3 Initialization */
	var web3 = new Web3(new Web3.providers.IpcProvider(app.web3.provider, client));
	
	/* Contract Initialization */
	var contractObj = new web3.eth.Contract(app.contract.abi, app.contract.address);
	contractObj.options.from = app.contract.owner_address;

	/* Turn on system flag */
	app.post('/system', async function(req, res){
		var key = '';
		if(req.headers['x-api-key'])
			key = req.headers['x-api-key'];

		if(key != app.key)
			return res.send({status: false, msg: 'You are not authorised!'});

		if(!req.body.action)
			return res.send({status: false, msg: 'Undefined action!'});

		var action = req.body.action;

		if(action != 'on' && action != 'off')
			return res.send({status: false, msg: 'Undefined action!'});

		if(action == 'on'){
			flag = true;
			return res.send({status: true, msg: 'System is turned on!'});
		}else{
			flag = false;
			return res.send({status: true, msg: 'System is turned off!'});
		}
	});

	/* Return Owner Token Balance */
	app.post('/ownerTokenBalance', async function(req, res){
		var key = '';
		if(req.headers['x-api-key'])
			key = req.headers['x-api-key'];

		if(key != app.key)
			return res.send({status: false, msg: 'You are not authorised!'});

		contractObj.methods.balanceOf(app.contract.owner_address).call({from: app.contract.owner_address})
		.then(function(result){
			var balance = result / Math.pow(10, app.contract.decimals);

			return res.send({status: true, balance: balance});
		});
	});

	/* Return Any Holder Token Balance */
	app.post('/holderTokenBalance', async function(req, res){
		var key = '';
		if(req.headers['x-api-key'])
			key = req.headers['x-api-key'];

		if(key != app.key)
			return res.send({status: false, msg: 'You are not authorised!'});

		if(!req.body.address)
			return res.send({status: false, msg: 'Address is missing!'});

		var address = req.body.address;

		if(!ethereum_address.isAddress(address))
			return res.send({status: false, msg: 'Invalid address!'});

		contractObj.methods.balanceOf(address).call({from: app.contract.owner_address})
		.then(function(result){
			var balance = result / Math.pow(10, app.contract.decimals);

			return res.send({status: true, balance: balance});
		});
	});

	/* Return Token Balance By WalletId ( userTokenBalance => walletTokenBalance ) */
	app.post('/walletTokenBalance', async function(req, res){
		var key = '';
		if(req.headers['x-api-key'])
			key = req.headers['x-api-key'];

		if(key != app.key)
			return res.send({status: false, msg: 'You are not authorised!'});

		if(!req.body.walletId)
			return res.send({status: false, msg: 'Wallet ID is missing!'});
		
		var walletId = req.body.walletId;
		if (!walletId.match(/^[0-9a-fA-F]{24}$/))
			return res.send({status: false, msg: 'Invalid wallet id!'});

		var wallet = await Wallet.findOne({_id: walletId});

		if(!wallet)
			return res.send({status: false, msg: 'Wallet doesn\'t exist!'});

		contractObj.methods.balanceOf(wallet.address).call({from: app.contract.owner_address})
		.then(function(result){
			var balance = result / Math.pow(10, app.contract.decimals);

			return res.send({status: true, balance: balance});
		});
	});

	/* Create internal wallet for user */
	app.post('/wallet', async function(req, res){
		var key = '';
		if(req.headers['x-api-key'])
			key = req.headers['x-api-key'];

		if(key != app.key)
			return res.send({status: false, msg: 'You are not authorised!'});
		
		if(!flag)
			return res.send({status: false, msg: 'System is turned off!'});

		if(!req.body.userId)
			return res.send({status: false, msg: 'User is missing!'});

		var wallet = await Wallet.findOne({userId: req.body.userId});

		if(wallet)
			return res.send({status: false, msg: 'Already registered!', walletId: wallet._id});

		var account = web3.eth.accounts.create(web3.utils.randomHex(32));

		if(!account)
			return res.send({status: false, msg: 'Error occurred in creating new account!'});

		Wallet.create({
			userId: req.body.userId,
			address: account.address,
			privateKey: cryptr.encrypt(account.privateKey)
		}, async function(err, wallet){
			if(err)
				return res.send({status: false, msg: 'Error occurred in creating wallet!'});
			
			return res.send({status: true, msg: 'Wallet created successfully!', walletId: wallet._id, walletAddress: account.address});
			/* We need to send some eth from our gas wallet to created internal wallet */
			/*web3.eth.personal.unlockAccount(app.networkWallet.address, app.networkWallet.password, 0, (err, unlocked) => {
				if(err)
					return res.send({status: false, msg: 'Unlock failed!', err: err});

				var sent = false;

				web3.eth.sendTransaction({
					from: app.networkWallet.address,
					to: account.address,
					value: web3.utils.toWei('0.01', 'ether')
				}).on('transactionHash', function(hash){
					sent = true;
					return res.send({status: true, msg: 'Wallet created successfully!', walletId: wallet._id, walletAddress: account.address});
				}).on('error', function(err){
					if(!sent)
						return res.send({status: false, msg: 'Error occurred in sending transaction!'});
				});
			});*/
		});
	});

	/* Transfer tokens from contract to internal wallet */
	app.post('/transferTokens', async function(req, res){
		var key = '';
		if(req.headers['x-api-key'])
			key = req.headers['x-api-key'];

		if(key != app.key)
			return res.send({status: false, msg: 'You are not authorised!'});

		if(!flag)
			return res.send({status: false, msg: 'System is turned off!'});

		if(!req.body.walletId || !req.body.tokenAmount || isNaN(req.body.tokenAmount))
			return res.send({status: false, msg: 'Parameters are missing!'});
		
		var walletId = req.body.walletId;
		if (!walletId.match(/^[0-9a-fA-F]{24}$/))
			return res.send({status: false, msg: 'Invalid wallet id!'});

		var wallet = await Wallet.findOne({_id: walletId});

		if(!wallet)
			return res.send({status: false, msg: 'Wallet doesn\'t exist!'});
		
		web3.eth.personal.unlockAccount(app.contract.owner_address, app.contract.password, 0, (err, unlocked) => {
			if(err)
				return res.send({status: false, msg: 'Unlock failed!', err: err});

			var tokenAmount = new BigNumber(req.body.tokenAmount * Math.pow(10, app.contract.decimals));
			
			var sent = false;

			contractObj.methods.balanceOf(wallet.address).call({from: app.contract.owner_address})
			.then(async function(result){
				var balance = result / Math.pow(10, app.contract.decimals);
				balance += parseFloat(req.body.tokenAmount); // Fresh Balance

				contractObj.methods.transfer(wallet.address, tokenAmount).send({
					from: app.contract.owner_address
				}).on('transactionHash', function(hash){
					History.create({
						from: app.contract.owner_address,
						to: wallet._id,
						amount: tokenAmount,
						hash: hash,
						action: 'import'
					}, async function(err, history){
						sent = true;

						if(err)
							return res.send({status: false, msg: 'Error occurred in saving history!'});

						return res.send({status: true, hash: hash, balance: balance});
					});
				}).on('error', function(err){
					if(!sent)
						return res.send({status: false, msg: 'Error occurred in sending transaction!'});
				});
			});
		});
	});

	/* Withdraw to external public wallet */
	app.post('/withdraw', async function(req, res){
		var key = '';
		if(req.headers['x-api-key'])
			key = req.headers['x-api-key'];

		if(key != app.key)
			return res.send({status: false, msg: 'You are not authorised!'});

		if(!flag)
			return res.send({status: false, msg: 'System is turned off!'});

		if(!req.body.address || !req.body.walletId)
			return res.send({status: false, msg: 'Parameters are missing!'});

		var walletId = req.body.walletId;
		if (!walletId.match(/^[0-9a-fA-F]{24}$/))
			return res.send({status: false, msg: 'Invalid wallet ID!'});

		var wallet = await Wallet.findOne({_id: walletId});
		var address = req.body.address;
		var amount = 0;
		
		if(!ethereum_address.isAddress(address))
			return res.send({status: false, msg: 'Invalid address!'});

		if(req.body.tokenAmount && !isNaN(req.body.tokenAmount)){
			amount = parseFloat(req.body.tokenAmount);

			if(amount == 0)
				return res.send({status: false, msg: 'Invalid amount value!'});
		}

		if(!wallet)
			return res.send({status: false, msg: 'Wallet doesn\'t exist!'});

		contractObj.methods.balanceOf(wallet.address).call({from: app.contract.owner_address})
		.then(async function(result){
			var balance = result / Math.pow(10, app.contract.decimals);

			if(balance == 0)
				return res.send({status: false, msg: 'Nothing to withdraw!'});

			if(amount != 0 && amount > balance)
				return res.send({status: false, msg: 'Check your balance and withdraw amount!'});

			if(amount == 0)
				amount = balance;

			var tokenAmount = new BigNumber(amount * Math.pow(10, app.contract.decimals));
			
			var txData = contractObj.methods.transfer(address, tokenAmount).encodeABI();

			/* Supply Gas */
			var ethAmount = new BigNumber(await web3.eth.getBalance(wallet.address));
			var gasPrice = await web3.eth.getGasPrice();

			var remainingGas = new BigNumber(ethAmount / gasPrice);
			var totalGas = new BigNumber(await contractObj.methods.transfer(address, tokenAmount).estimateGas({gas: 450000}));

			var remainingETH = parseFloat(remainingGas / Math.pow(10, 9));
			var totalETH = parseFloat(totalGas / Math.pow(10, 9));

			var giveETH = 0;
			var flag = false;

			if(remainingETH < totalETH){
				//giveETH = new BigNumber((totalETH - remainingETH).toFixed(9) * gasPrice * Math.pow(10, 9));
				giveETH = new BigNumber(totalGas.minus(remainingGas) * gasPrice);
				flag = true;
			}
			/* Supply Gas */

			/* Promise Start */
			payGasAsETH(wallet.address, giveETH, flag).then(async function(result){
				/* Withdraw Tokens */
				var privateKeyStr = stripHexPrefix(cryptr.decrypt(wallet.privateKey));
		
				var privateKey = new Buffer(privateKeyStr, 'hex');

				var nonce = await web3.eth.getTransactionCount(wallet.address).catch((error) => {
					return res.send({status: false, msg: 'Error occurred in getting transaction count!'});
				});

				var txParams = {
				  	nonce: web3.utils.toHex(nonce),
				  	gasPrice: web3.utils.toHex(gasPrice),
				  	gasLimit: totalGas,
				  	from: wallet.address,
				  	to: contractObj._address,
				  	value: '0x00',
				  	chainId: app.chainId,
				  	data: txData
				};

				var tx = new Tx(txParams);
				tx.sign(privateKey);

				var serializedTx = tx.serialize();

				var sent = false;
				web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
				.on('transactionHash', function(hash){
					balance = parseFloat(balance) - parseFloat(amount);

					History.create({
						from: wallet._id,
						to: address,
						amount: tokenAmount,
						hash: hash,
						action: 'export'
					}, async function(err, history){
						sent = true;

						if(err)
							return res.send({status: false, msg: 'Error occurred in saving history!'});
						
						return res.send({status: true, hash: hash, balance: balance});
					});
				}).on('error', function(err){
					if(!sent)
						return res.send({status: false, msg: err.message});
				});
			}, function(err){
				return res.send({status: false, msg: err.message});
			});
			/* Promise End */
		});
	});

	importedWallets = [];

	function handleWalletByOffset(index, items){
	    return new Promise((resolve, reject) => {
	    	Wallet.findOne({userId: items[index].id}, function(err, wallet){
		    	if(wallet || err)
		    		resolve(null);

				var account = web3.eth.accounts.create(web3.utils.randomHex(32));
				
				if(!account)
					resolve(null);
				
				Wallet.create({
					userId: items[index].id,
					address: account.address,
					privateKey: cryptr.encrypt(account.privateKey)
				}, function(err, wallet){
					if(!err && wallet){
						var temp = items[index];
						temp.walletId = wallet._id;
						temp.walletAddress = wallet.address;
						temp.privateKey = wallet.privateKey;

						resolve(temp);
					}else{
						console.log(err);
					}
				});
			});
	    });
	}

	function handleNextWalletDB(index, items){
	    return handleWalletByOffset(index, items).then((result) => {
	        if(result)
	        	importedWallets.push(result);

	        index++;
	        if(index < items.length){
	        	return handleNextWalletDB(index, items);
	        	/* Process Data End */
	        }else{
	            return Promise.resolve();
	        }
	    });
	}

	function handleWalletDB(items){
	    return handleNextWalletDB(0, items).then(() => {
	    	return Promise.resolve();
	    });
	}

	/* Create multiple internal wallets for users */
	app.post('/batchWallet', function(req, res){
		var key = '';
		if(req.headers['x-api-key'])
			key = req.headers['x-api-key'];

		if(key != app.key)
			return res.send({status: false, msg: 'You are not authorised!'});
		
		if(!flag)
			return res.send({status: false, msg: 'System is turned off!'});

		if(!req.body.users)
			return res.send({status: false, msg: 'Users are missing!'});

		var users = [];
		try{
			users = JSON.parse(req.body.users);
		}catch(e){
			return res.send({status: false, msg: 'Users are missing!'});
		}

		if(users.length == 0)
			return res.send({status: false, msg: 'Users are missing!'});

		handleWalletDB(users).then(() => {
			var newItems = importedWallets;
			importedWallets = [];

			if(newItems.length == 0)
				return res.send({status: false, msg: 'Nothing to import!'});
			
			return res.send({status: true, items: newItems});
		});
	});

	/* Badge Request */
	app.post('/batchRequest', async function(req, res){
		if(!req.body.fromWalletId)
			return res.send({status: false, msg: 'Parameters are missing!'});

		var items = [];

		try{
			items = JSON.parse(req.body.items);
		}catch(e){
			return res.send({status: false, msg: 'Invalid parameters!'});
		}

		if(!items || items.length == 0)
			return res.send({status: false, msg: 'Parameters are missing!'});

		/* ID Check */
		var fromWalletId = req.body.fromWalletId;
		if (!fromWalletId.match(/^[0-9a-fA-F]{24}$/))
			return res.send({status: false, msg: 'Invalid wallet id!'});
		/* ID Check End */

		var fromWallet = await Wallet.findOne({_id: fromWalletId});
		if(!fromWallet)
			return res.send({status: false, msg: 'Wallet doesn\'t exist!'});

		/* Check Balance */
		contractObj.methods.balanceOf(fromWallet.address).call({from: app.contract.owner_address})
		.then(async function(result){
			var batch = new web3.BatchRequest();
			var balance = result / Math.pow(10, app.contract.decimals);
			
			var nonce = await web3.eth.getTransactionCount(fromWallet.address).catch((error) => {
				return res.send({status: false, msg: 'Error occurred in getting transaction count!'});
			});

			var privateKeyStr = stripHexPrefix(cryptr.decrypt(fromWallet.privateKey));
			var privateKey = new Buffer(privateKeyStr, 'hex');
				
			var gasPrice = await web3.eth.getGasPrice();
			
			var processed = 0; // Total count of transactions that have been processed in real.
			
			var newItems = [];

			for(var i in items){ /* Begin For */
				if(items[i].action != 'spent') // If it is import or export
					continue;

				/* ID Check */
				if (!items[i].toWalletId.match(/^[0-9a-fA-F]{24}$/))
					continue;
				/* ID Check End */

				var toWallet = await Wallet.findOne({_id: items[i].toWalletId});
				if(!toWallet)
					continue;

				items[i].toWallet = toWallet;

				var tempResult = await contractObj.methods.balanceOf(toWallet.address).call({from: app.contract.owner_address});
				var tempBalance = tempResult / Math.pow(10, app.contract.decimals);

				var amount = parseFloat(items[i].amount);
				var amountFee = parseFloat(amount * app.percent / 100);
				var totalAmount = amount + amountFee;

				items[i].balance = parseFloat(tempBalance) + amount; //Fresh Balance

				if(totalAmount > balance)
					continue;

				balance -= totalAmount;

				newItems.push(items[i]);
			} /* End For */

			if(newItems.length == 0)
				return res.send({status: false, msg: 'Nothing to process!'});

			/* Supply Gas */
			var totalGas = new BigNumber(0);
			
			for(var i in newItems){
				var toWallet = newItems[i].toWallet;
				
				var amount = parseFloat(newItems[i].amount);
				var amountFee = parseFloat(amount * app.percent / 100);
				
				var tokenAmount = new BigNumber(amount * Math.pow(10, app.contract.decimals));
				var tokenAmountFee = new BigNumber(amountFee * Math.pow(10, app.contract.decimals));

				var tempGas = parseFloat(await contractObj.methods.transfer(toWallet.address, tokenAmount).estimateGas({gas: 450000}));
				var tempGasFee = parseFloat(await contractObj.methods.transfer(app.revenueWallet.address, tokenAmountFee).estimateGas({gas: 450000}));

				totalGas = totalGas.plus(tempGas);
				totalGas = totalGas.plus(tempGasFee);
				
				newItems[i].gas = tempGas;
				newItems[i].gasFee = tempGasFee;
				newItems[i].tokenAmount = tokenAmount;
				newItems[i].tokenAmountFee = tokenAmountFee;
			}

			var totalETH = parseFloat(totalGas / Math.pow(10, 9));
			var ethAmount = new BigNumber(await web3.eth.getBalance(fromWallet.address));

			var remainingGas = new BigNumber(ethAmount / gasPrice);
			var remainingETH = parseFloat(remainingGas / Math.pow(10, 9));

			var giveETH = 0;
			var flag = false;

			//console.log('total - ' + totalETH);
			//console.log('remaining - ' + remainingETH);
			//console.log('give - ' + (totalETH - remainingETH).toFixed(9));

			if(remainingETH < totalETH){
				//giveETH = new BigNumber((totalETH - remainingETH).toFixed(9) * gasPrice * Math.pow(10, 9));
				giveETH = new BigNumber(totalGas.minus(remainingGas) * gasPrice);
				flag = true;
			}

			console.log('giveETH - ' + giveETH);
			/* Supply Gas End */

			/* Promise Start */
			payGasAsETH(fromWallet.address, giveETH, flag).then(async function(result){
				for(var i in newItems){ /* Begin For */
					var tokenAmount = new BigNumber(newItems[i].tokenAmount);
					var tokenAmountFee = new BigNumber(newItems[i].tokenAmountFee);
					var gas = newItems[i].gas;
					var gasFee = newItems[i].gasFee;

					var txData = contractObj.methods.transfer(toWallet.address, tokenAmount).encodeABI();
					var txDataFee = contractObj.methods.transfer(app.revenueWallet.address, tokenAmountFee).encodeABI();

					/* Send Fee */
					var txParamsFee = {
					  	nonce: web3.utils.toHex(nonce++),
					  	gasPrice: web3.utils.toHex(gasPrice),
					  	gasLimit: gasFee,
					  	from: fromWallet.address,
					  	to: contractObj._address,
					  	value: '0x00',
					  	chainId: app.chainId,
					  	data: txDataFee
					};

					var txFee = new Tx(txParamsFee);
					txFee.sign(privateKey);

					var serializedTxFee = txFee.serialize();
					
					web3.eth.sendSignedTransaction('0x' + serializedTxFee.toString('hex'))
					.on('transactionHash', function(hash){
					}).on('error', function(err){
					});
					/* Send Fee End */

					var txParams = {
					  	nonce: web3.utils.toHex(nonce++),
					  	gasPrice: web3.utils.toHex(gasPrice),
					  	gasLimit: gas,
					  	from: fromWallet.address,
					  	to: contractObj._address,
					  	value: '0x00',
					  	chainId: app.chainId,
					  	data: txData
					};

					var tx = new Tx(txParams);
					tx.sign(privateKey);
					
					var serializedTx = tx.serialize();
					
					var transaction = web3.eth.sendSignedTransaction.request('0x' + serializedTx.toString('hex'), 'transactionHash', function(err, hash){
						processed++;

						if(err){
							newItems[processed-1].status = 'notprocessed';
						}else{
							newItems[processed-1].status = 'processed';
							newItems[processed-1].hash = hash;
		
							History.create({
								from: fromWallet._id,
								to: newItems[processed-1].toWallet._id,
								amount: newItems[processed-1].tokenAmount,
								hash: hash,
								action: 'spent'
							}, function(err, history){
								//console.log(history);
							});
						}

						if(processed == newItems.length)
							return res.send({status: true, items: newItems, balance: balance});
					});

					batch.add(transaction);
				} /* End For */

				batch.execute();
			}, function(err){
				return res.send({status: false, msg: err.message});
			});
			/* Promise End */
		});
		/* Check Balance End */
	});
	
	function payGasAsETH(toAddress, ethAmount, flag){
		return new Promise((resolve, reject) => {
			if(!flag)
				resolve();
			else{
				web3.eth.personal.unlockAccount(app.networkWallet.address, app.networkWallet.password, 0, (err, unlocked) => {
					if(err)
						reject();

					web3.eth.sendTransaction({
						from: app.networkWallet.address,
						to: toAddress,
						value: ethAmount
					}).then(function(receipt){
    					resolve();
					});
				});
			}
		});
	}

	/* Transfer tokens from one wallet to another wallet */
	app.post('/transferTokensInternally', async function(req, res){
		var key = '';
		if(req.headers['x-api-key'])
			key = req.headers['x-api-key'];

		if(key != app.key)
			return res.send({status: false, msg: 'You are not authorised!'});

		if(!flag)
			return res.send({status: false, msg: 'System is turned off!'});

		if(!req.body.fromWalletId || !req.body.toWalletId || !req.body.tokenAmount || isNaN(req.body.tokenAmount))
			return res.send({status: false, msg: 'Incorrect parameters!'});

		/* ID Check */
		var fromWalletId = req.body.fromWalletId;
		if (!fromWalletId.match(/^[0-9a-fA-F]{24}$/))
			return res.send({status: false, msg: 'Invalid wallet id!'});
		/* ID Check End */

		var fromWallet = await Wallet.findOne({_id: fromWalletId});
		if(!fromWallet)
			return res.send({status: false, msg: 'Wallet doesn\'t exist!'});

		/* ID Check */
		var toWalletId = req.body.toWalletId;
		if (!toWalletId.match(/^[0-9a-fA-F]{24}$/))
			return res.send({status: false, msg: 'Invalid wallet id!'});
		/* ID Check End */

		var toWallet = await Wallet.findOne({_id: toWalletId});
		if(!toWallet)
			return res.send({status: false, msg: 'Wallet doesn\'t exist!'});
		
		var amount = req.body.tokenAmount;
		if(amount == 0)
			return res.send({status: false, msg: 'Token amount shouldn\'t be equal to 0!'});

		var fee = parseFloat(amount * app.percent / 100); // Fee to Revenue Wallet
		var totalAmount = parseFloat(amount) + parseFloat(fee);

		/* Check Balance */
		contractObj.methods.balanceOf(fromWallet.address).call({from: app.contract.owner_address})
		.then(async function(result){
			var balance = result / Math.pow(10, app.contract.decimals);

			if(balance == 0)
				return res.send({status: false, msg: 'Nothing to transfer!'});

			if(totalAmount > balance)
				return res.send({status: false, msg: 'Insufficient balance!'});

			contractObj.methods.balanceOf(toWallet.address).call({from: app.contract.owner_address})
			.then(async function(result){
				var toBalance = result / Math.pow(10, app.contract.decimals);

				var tokenAmount = new BigNumber(amount * Math.pow(10, app.contract.decimals));
				var feeAmount = new BigNumber(fee * Math.pow(10, app.contract.decimals));

				var privateKeyStr = stripHexPrefix(cryptr.decrypt(fromWallet.privateKey));
				var privateKey = new Buffer(privateKeyStr, 'hex');
				
				/* Supply Gas */
				var txDataFee = contractObj.methods.transfer(app.revenueWallet.address, feeAmount).encodeABI();
				var txData = contractObj.methods.transfer(toWallet.address, tokenAmount).encodeABI();

				var gasESTFee = parseFloat(await contractObj.methods.transfer(app.revenueWallet.address, feeAmount).estimateGas({gas: 450000}));
				var gasEST = parseFloat(await contractObj.methods.transfer(toWallet.address, tokenAmount).estimateGas({gas: 450000}));
				var totalGas = new BigNumber(gasEST + gasESTFee);

				var ethAmount = new BigNumber(await web3.eth.getBalance(fromWallet.address));
				var gasPrice = await web3.eth.getGasPrice();

				var remainingGas = new BigNumber(ethAmount / gasPrice);
				
				var remainingETH = parseFloat(remainingGas / Math.pow(10, 9));
				var totalETH = parseFloat(totalGas / Math.pow(10, 9));

				var giveETH = 0;
				var flag = false;

				if(remainingETH < totalETH){
					//giveETH = new BigNumber((totalETH - remainingETH).toFixed(9) * gasPrice * Math.pow(10, 9));
					giveETH = new BigNumber(totalGas.minus(remainingGas) * gasPrice);
					flag = true;
				}

				console.log('giveETH - ' + giveETH);
				/* Supply Gas End */

				/* Promise Start */
				payGasAsETH(fromWallet.address, giveETH, flag).then(async function(result){
					var nonce = await web3.eth.getTransactionCount(fromWallet.address).catch((error) => {
						return res.send({status: false, msg: 'Error occurred in getting transaction count!'});
					});
					
					/* Send Fee */
					var txParamsFee = {
					  	nonce: web3.utils.toHex(nonce),
					  	gasPrice: web3.utils.toHex(gasPrice),
					  	gasLimit: gasESTFee,
					  	from: fromWallet.address,
					  	to: contractObj._address,
					  	value: '0x00',
					  	chainId: app.chainId,
					  	data: txDataFee
					};

					var txFee = new Tx(txParamsFee);
					txFee.sign(privateKey);

					var serializedTxFee = txFee.serialize();
					
					web3.eth.sendSignedTransaction('0x' + serializedTxFee.toString('hex'))
					.on('transactionHash', function(hash){
					}).on('error', function(err){
					});
					/* Send Fee End */

					var txParams = {
					  	nonce: web3.utils.toHex((nonce+1)),
					  	gasPrice: web3.utils.toHex(gasPrice),
					  	gasLimit: gasEST,
					  	from: fromWallet.address,
					  	to: contractObj._address,
					  	value: '0x00',
					  	chainId: app.chainId,
					  	data: txData
					};

					var tx = new Tx(txParams);
					tx.sign(privateKey);
					
					var serializedTx = tx.serialize();
					
					var sent = false;
					web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
					.on('transactionHash', function(hash){
						var fromBalance = parseFloat(balance) - parseFloat(totalAmount);
						toBalance = parseFloat(toBalance) + parseFloat(amount);

						History.create({
							from: fromWallet._id,
							to: toWallet._id,
							amount: tokenAmount,
							hash: hash,
							action: 'spent'
						}, async function(err, history){
							sent = true;
							if(err)
								return res.send({status: false, msg: 'Error occurred in saving history!'});
							
							return res.send({status: true, hash: hash, fromBalance: fromBalance, toBalance: toBalance});
						});
					}).on('error', function(err){
						if(!sent)
							return res.send({status: false, msg: 'Error occurred in sending transaction!'});
					});
				}, function(err){
					return res.send({status: false, msg: err.message});
				});
				/* Promise End */
			});
		});
		/* Check Balance End */
	});

	/* Get history of wallet by wallet ID */
	app.post('/history', async function(req, res){
		var key = '';
		if(req.headers['x-api-key'])
			key = req.headers['x-api-key'];

		if(key != app.key)
			return res.send({status: false, msg: 'You are not authorised!'});

		if(!flag)
			return res.send({status: false, msg: 'System is turned off!'});

		if(!req.body.walletId)
			return res.send({status: false, msg: 'Wallet is missing!'});

		var walletId = req.body.walletId;
		var history = await History.find({$or: [{from: walletId}, {to: walletId}]});

		return res.send({status: true, history: history});
	});
}