module.exports = function(app) {
	var mongoose = require('mongoose'),
		bcrypt  = require('bcrypt'),
		Web3    = require('web3'),
		Cryptr = require('cryptr'),
		Wallet = require('../models/wallet'),
		BigNumber = require("bignumber.js"),
		net = require('net'),
		Tx = require('ethereumjs-tx'),
		stripHexPrefix = require('strip-hex-prefix');

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
			return res.send({status: false, msg: 'you are not authorised!'});

		if(!req.body.action)
			return res.send({status: false, msg: 'error occurred!'});

		var action = req.body.action;

		if(action != 'on' && action != 'off')
			return res.send({status: false, msg: 'undefined action!'});

		if(action == 'on'){
			flag = true;
			return res.send({status: true, msg: 'system is turned on!'});
		}else{
			flag = false;
			return res.send({status: true, msg: 'system is turned off!'});
		}
	});

	/* Return Owner Token Balance */
	app.post('/ownerTokenBalance', async function(req, res){
		var key = '';
		if(req.headers['x-api-key'])
			key = req.headers['x-api-key'];

		if(key != app.key)
			return res.send({status: false, msg: 'you are not authorised!'});

		contractObj.methods.balanceOf(app.contract.owner_address).call({from: app.contract.owner_address})
		.then(function(result){
			var balance = result / Math.pow(10, app.contract.decimals);

			return res.send({status: true, balance: balance});
		});
	});

	/* Return User Token Balance */
	app.post('/userTokenBalance', async function(req, res){
		var key = '';
		if(req.headers['x-api-key'])
			key = req.headers['x-api-key'];

		if(key != app.key)
			return res.send({status: false, msg: 'you are not authorised!'});

		if(!req.body.userId)
			return res.send({status: false, msg: 'error occurred!'});
		
		var user = await Wallet.findOne({userId: req.body.userId});

		if(!user)
			return res.send({status: false, msg: 'user doesn\'t exist!'});

		contractObj.methods.balanceOf(user.address).call({from: app.contract.owner_address})
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
			return res.send({status: false, msg: 'you are not authorised!'});
		
		if(!flag)
			return res.send({status: false, msg: 'system is turned off!'});

		if(!req.body.userId)
			return res.send({status: false, msg: 'error occurred!'});

		var wallet = await Wallet.findOne({userId: req.body.userId});

		if(wallet)
			return res.send({status: false, msg: 'already registered!'});

		var account = web3.eth.accounts.create(web3.utils.randomHex(32));

		if(!account)
			return res.send({status: false, msg: 'error occurred in creating new account!'});

		Wallet.create({
			userId: req.body.userId,
			address: account.address,
			privateKey: cryptr.encrypt(account.privateKey)
		}, async function(err, wallet){
			if(err)
				return res.send({status: false, msg: err});

			/* We need to send some eth from our master wallet to created internal wallet */
			web3.eth.personal.unlockAccount(app.wallet.address, app.wallet.password, 0, (err, unlocked) => {
				if(err)
					return res.send({status: false, msg: 'unlock failed!', err: err});

				web3.eth.sendTransaction({
					from: app.wallet.address,
					to: account.address,
					value: web3.utils.toWei('0.1', 'ether')
				}).on('transactionHash', function(hash){
					return res.send({status: true, msg: 'wallet created successfully!', walletId: wallet._id});
				}).on('error', function(err){
					return res.send({status: false, message: err});
				}).then(function(done){
					//return res.send({status: true, msg: 'wallet created successfully!', walletId: wallet._id});
				});
			});
		});
	});

	/* Transfer tokens from contract to internal wallet */
	app.post('/transferTokens', async function(req, res){
		var key = '';
		if(req.headers['x-api-key'])
			key = req.headers['x-api-key'];

		if(key != app.key)
			return res.send({status: false, msg: 'you are not authorised!'});

		if(!flag)
			return res.send({status: false, msg: 'system is turned off!'});

		if(!req.body.userId || !req.body.tokenAmount || isNaN(req.body.tokenAmount))
			return res.send({status: false, msg: 'error occurred!'});
	
		var user = await Wallet.findOne({userId: req.body.userId});

		if(!user)
			return res.send({status: false, msg: 'user doesn\'t exist!'});
		
		web3.eth.personal.unlockAccount(app.contract.owner_address, app.contract.password, 0, (err, unlocked) => {
			if(err)
				return res.send({status: false, msg: 'unlock failed!'});

			var tokenAmount = req.body.tokenAmount * Math.pow(10, app.contract.decimals);
			
			contractObj.methods.transfer(user.address, tokenAmount).send({
				from: app.contract.owner_address
			}).on('transactionHash', function(hash){
				return res.send({status: true, hash: hash});
			}).on('confirmation', function(confirmationNumber, receipt){
			}).on('receipt', function(receipt){
			}).on('error', function(err){
				return res.send({status: false, msg: err});
			}).then(function(done){
			});
		});
	});

	/* Withdraw to external public wallet */
	app.post('/withdraw', async function(req, res){
		var key = '';
		if(req.headers['x-api-key'])
			key = req.headers['x-api-key'];

		if(key != app.key)
			return res.send({status: false, msg: 'you are not authorised!'});

		if(!flag)
			return res.send({status: false, msg: 'system is turned off!'});

		if(!req.body.address || !req.body.userId)
			return res.send({status: false, msg: 'error occurred!'});

		var user = await Wallet.findOne({userId: req.body.userId});
		var address = req.body.address;
		var amount = 0;

		if(req.body.tokenAmount && !isNaN(req.body.tokenAmount)){
			amount = parseInt(req.body.tokenAmount);

			if(amount == 0)
				return res.send({status: false, msg: 'error occurred!'});
		}

		if(amount != 0)
			amount = amount * Math.pow(10, app.contract.decimals);

		if(!user)
			return res.send({status: false, msg: 'user doesn\'t exist!'});

		contractObj.methods.balanceOf(user.address).call({from: app.contract.owner_address})
		.then(async function(result){
			var tokenAmount = new BigNumber(result);

			if(tokenAmount == 0)
				return res.send({status: false, msg: 'nothing to withdraw!'});

			if(amount != 0 && amount > tokenAmount)
				return res.send({status: false, msg: 'check your balance and withdraw amount!'});

			if(amount == 0)
				amount = tokenAmount;

			/* Withdraw Tokens */
			var privateKeyStr = stripHexPrefix(cryptr.decrypt(user.privateKey));
		
			var privateKey = new Buffer(privateKeyStr, 'hex');

			var nonce = await web3.eth.getTransactionCount(user.address).catch((error) => {
				return res.send({status: false, msg: 'error occurred!'});
			});

			var gasPrice = await web3.eth.getGasPrice();
			
			var txData = contractObj.methods.transfer(address, amount).encodeABI();

			var txParams = {
			  	nonce: web3.utils.toHex(nonce),
			  	gasPrice: web3.utils.toHex(gasPrice),
			  	gasLimit: web3.utils.toHex(400000),
			  	from: user.address,
			  	to: contractObj._address,
			  	value: '0x00',
			  	chainId: app.chainId,
			  	data: txData
			};

			var tx = new Tx(txParams);
			tx.sign(privateKey);

			var serializedTx = tx.serialize();

			web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
			.on('transactionHash', function(hash){
				return res.send({status: true, hash: hash});
			}).on('error', function(err){
				return res.send({status: false, msg: err});
			}).then(function(done){
				//return res.send({status: true, hash: done.transactionHash});
			});
		});
	});

	/* Transfer tokens from one wallet to another wallet */
	app.post('/transferTokensInternally', async function(req, res){
		var key = '';
		if(req.headers['x-api-key'])
			key = req.headers['x-api-key'];

		if(key != app.key)
			return res.send({status: false, msg: 'you are not authorised!'});

		if(!flag)
			return res.send({status: false, msg: 'system is turned off!'});

		if(!req.body.fromUserId || !req.body.toUserId || !req.body.tokenAmount)
			return res.send({status: false, msg: 'incorrect parameters!'});

		var fromUser = await Wallet.findOne({userId: req.body.fromUserId});
		if(!fromUser)
			return res.send({status: false, msg: 'from doesn\'t exist!'});

		var toUser = await Wallet.findOne({userId: req.body.toUserId});
		if(!toUser)
			return res.send({status: false, msg: 'to doesn\'t exist!'});

		var tokenAmount = req.body.tokenAmount * Math.pow(10, app.contract.decimals);

		var privateKeyStr = stripHexPrefix(cryptr.decrypt(fromUser.privateKey));
		
		var privateKey = new Buffer(privateKeyStr, 'hex');

		var nonce = await web3.eth.getTransactionCount(fromUser.address).catch((error) => {
			return res.send({status: false, msg: 'error occurred!'});
		});

		var gasPrice = await web3.eth.getGasPrice();
		
		var txData = contractObj.methods.transfer(toUser.address, tokenAmount).encodeABI();

		var txParams = {
		  	nonce: web3.utils.toHex(nonce),
		  	gasPrice: web3.utils.toHex(gasPrice),
		  	gasLimit: web3.utils.toHex(400000),
		  	from: fromUser.address,
		  	to: contractObj._address,
		  	value: '0x00',
		  	chainId: app.chainId,
		  	data: txData
		};

		var tx = new Tx(txParams);
		tx.sign(privateKey);

		var serializedTx = tx.serialize();

		web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
		.on('transactionHash', function(hash){
			return res.send({status: true, hash: hash});
		}).on('error', function(err){
			return res.send({status: false, msg: err});
		}).then(function(done){
			//return res.send({status: true, hash: done.transactionHash});
		});
	});
}