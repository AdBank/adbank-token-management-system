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

	/* Return Any Holder Token Balance */
	app.post('/holderTokenBalance', async function(req, res){
		var key = '';
		if(req.headers['x-api-key'])
			key = req.headers['x-api-key'];

		if(key != app.key)
			return res.send({status: false, msg: 'you are not authorised!'});

		if(!req.body.address)
			return res.send({status: false, msg: 'error occurred!'});

		var address = req.body.address;

		if(!ethereum_address.isAddress(address))
			return res.send({status: false, msg: 'invalid address!'});

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
			return res.send({status: false, msg: 'you are not authorised!'});

		if(!req.body.walletId)
			return res.send({status: false, msg: 'error occurred!'});
		
		var walletId = req.body.walletId;
		if (!walletId.match(/^[0-9a-fA-F]{24}$/))
			return res.send({status: false, msg: 'invalid wallet id!'});

		var wallet = await Wallet.findOne({_id: walletId});

		if(!wallet)
			return res.send({status: false, msg: 'wallet doesn\'t exist!'});

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
			return res.send({status: false, msg: 'you are not authorised!'});
		
		if(!flag)
			return res.send({status: false, msg: 'system is turned off!'});

		if(!req.body.userId)
			return res.send({status: false, msg: 'error occurred!'});

		var wallet = await Wallet.findOne({userId: req.body.userId});

		if(wallet)
			return res.send({status: false, msg: 'already registered!', walletId: wallet._id});

		var account = web3.eth.accounts.create(web3.utils.randomHex(32));

		if(!account)
			return res.send({status: false, msg: 'error occurred in creating new account!'});

		Wallet.create({
			userId: req.body.userId,
			address: account.address,
			privateKey: cryptr.encrypt(account.privateKey)
		}, async function(err, wallet){
			if(err)
				return res.send({status: false, msg: 'error occurred in creating wallet!'});

			var gasPrice = await web3.eth.getGasPrice();

			/* We need to send some eth from our gas wallet to created internal wallet */
			web3.eth.personal.unlockAccount(app.networkWallet.address, app.networkWallet.password, 0, (err, unlocked) => {
				if(err)
					return res.send({status: false, msg: 'unlock failed!', err: err});

				web3.eth.sendTransaction({
					from: app.networkWallet.address,
					to: account.address,
					value: web3.utils.toWei('0.01', 'ether'),
					gasPrice: web3.utils.toHex(gasPrice),
			  		gas: web3.utils.toHex(400000)
				}).then(function(done){
					var status = done.status == '0x1'?true:false;
					
					if(!status)
						return res.send({status: false, msg: 'error occurred!'});

					return res.send({status: true, msg: 'wallet created successfully!', walletId: wallet._id});
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

		if(!req.body.walletId || !req.body.tokenAmount || isNaN(req.body.tokenAmount))
			return res.send({status: false, msg: 'error occurred!'});
		
		var walletId = req.body.walletId;
		if (!walletId.match(/^[0-9a-fA-F]{24}$/))
			return res.send({status: false, msg: 'invalid wallet id!'});

		var wallet = await Wallet.findOne({_id: walletId});

		if(!wallet)
			return res.send({status: false, msg: 'wallet doesn\'t exist!'});
		
		web3.eth.personal.unlockAccount(app.contract.owner_address, app.contract.password, 0, (err, unlocked) => {
			if(err)
				return res.send({status: false, msg: 'unlock failed!', err: err});

			var tokenAmount = new BigNumber(req.body.tokenAmount * Math.pow(10, app.contract.decimals));
			
			contractObj.methods.transfer(wallet.address, tokenAmount).send({
				from: app.contract.owner_address
			}).on('transactionHash', function(hash){
			}).on('confirmation', function(confirmationNumber, receipt){
			}).on('receipt', function(receipt){
			}).on('error', function(err){
				return res.send({status: false, msg: 'error occurred in sending transaction!'});
			}).then(function(done){
				var status = done.status == '0x1'?true:false;
				var hash = done.transactionHash;
				var gas = done.gasUsed;

				if(!status)
					return res.send({status: false, msg: 'error occurred!'});

				History.create({
					from: app.contract.owner_address,
					to: wallet._id,
					amount: tokenAmount,
					hash: hash,
					gas: gas,
					action: 'import'
				}, async function(err, history){
					if(err)
						return res.send({status: false, msg: 'error occurred in saving history!'});

					return res.send({status: true, hash: hash});
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
			return res.send({status: false, msg: 'you are not authorised!'});

		if(!flag)
			return res.send({status: false, msg: 'system is turned off!'});

		if(!req.body.address || !req.body.walletId)
			return res.send({status: false, msg: 'error occurred!'});

		var walletId = req.body.walletId;
		if (!walletId.match(/^[0-9a-fA-F]{24}$/))
			return res.send({status: false, msg: 'invalid wallet id!'});

		var wallet = await Wallet.findOne({_id: walletId});
		var address = req.body.address;
		var amount = 0;
		
		if(!ethereum_address.isAddress(address))
			return res.send({status: false, msg: 'invalid address!'});

		if(req.body.tokenAmount && !isNaN(req.body.tokenAmount)){
			amount = parseFloat(req.body.tokenAmount);

			if(amount == 0)
				return res.send({status: false, msg: 'error occurred!'});
		}

		if(!wallet)
			return res.send({status: false, msg: 'wallet doesn\'t exist!'});

		contractObj.methods.balanceOf(wallet.address).call({from: app.contract.owner_address})
		.then(async function(result){
			var balance = result / Math.pow(10, app.contract.decimals);

			if(balance == 0)
				return res.send({status: false, msg: 'nothing to withdraw!'});

			if(amount != 0 && amount > balance)
				return res.send({status: false, msg: 'check your balance and withdraw amount!'});

			if(amount == 0)
				amount = balance;

			var tokenAmount = new BigNumber(amount * Math.pow(10, app.contract.decimals));

			/* Withdraw Tokens */
			var privateKeyStr = stripHexPrefix(cryptr.decrypt(wallet.privateKey));
		
			var privateKey = new Buffer(privateKeyStr, 'hex');

			var nonce = await web3.eth.getTransactionCount(wallet.address).catch((error) => {
				return res.send({status: false, msg: 'error occurred!'});
			});

			var gasPrice = await web3.eth.getGasPrice();
			
			var txData = contractObj.methods.transfer(address, tokenAmount).encodeABI();

			var txParams = {
			  	nonce: web3.utils.toHex(nonce),
			  	gasPrice: web3.utils.toHex(gasPrice),
			  	gasLimit: web3.utils.toHex(400000),
			  	from: wallet.address,
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
			}).on('error', function(err){
				return res.send({status: false, msg: 'error occurred in sending transaction!'});
			}).then(function(done){
				var status = done.status == '0x1'?true:false;
				var hash = done.transactionHash;
				var gas = done.gasUsed;

				if(!status)
					return res.send({status: false, msg: 'error occurred!'});

				History.create({
					from: wallet._id,
					to: address,
					amount: tokenAmount,
					hash: hash,
					gas: gas,
					action: 'export'
				}, async function(err, history){
					if(err)
						return res.send({status: false, msg: 'error occurred in saving history!'});
					
					return res.send({status: true, hash: hash});
				});
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

		if(!req.body.fromWalletId || !req.body.toWalletId || !req.body.tokenAmount || isNaN(req.body.tokenAmount))
			return res.send({status: false, msg: 'incorrect parameters!'});

		/* ID Check */
		var fromWalletId = req.body.fromWalletId;
		if (!fromWalletId.match(/^[0-9a-fA-F]{24}$/))
			return res.send({status: false, msg: 'invalid wallet id!'});
		/* ID Check End */

		var fromWallet = await Wallet.findOne({_id: fromWalletId});
		if(!fromWallet)
			return res.send({status: false, msg: 'from doesn\'t exist!'});

		/* ID Check */
		var toWalletId = req.body.toWalletId;
		if (!toWalletId.match(/^[0-9a-fA-F]{24}$/))
			return res.send({status: false, msg: 'invalid wallet id!'});
		/* ID Check End */

		var toWallet = await Wallet.findOne({_id: toWalletId});
		if(!toWallet)
			return res.send({status: false, msg: 'to doesn\'t exist!'});
		
		var amount = req.body.tokenAmount;
		if(amount == 0)
			return res.send({status: false, msg: 'token amount shouldn\'t be equal to 0!'});

		/* Check Balance */
		contractObj.methods.balanceOf(fromWallet.address).call({from: app.contract.owner_address})
		.then(async function(result){
			var balance = result / Math.pow(10, app.contract.decimals);

			if(balance == 0)
				return res.send({status: false, msg: 'nothing to transfer!'});

			if(amount > balance)
				return res.send({status: false, msg: 'insufficient balance!'});

			var tokenAmount = new BigNumber(amount * Math.pow(10, app.contract.decimals));
		
			var privateKeyStr = stripHexPrefix(cryptr.decrypt(fromWallet.privateKey));
			var privateKey = new Buffer(privateKeyStr, 'hex');
			
			var nonce = await web3.eth.getTransactionCount(fromWallet.address).catch((error) => {
				return res.send({status: false, msg: 'error occurred!'});
			});
			
			var gasPrice = await web3.eth.getGasPrice();
			
			var txData = contractObj.methods.transfer(toWallet.address, tokenAmount).encodeABI();
			
			var txParams = {
			  	nonce: web3.utils.toHex(nonce),
			  	gasPrice: web3.utils.toHex(gasPrice),
			  	gasLimit: web3.utils.toHex(400000),
			  	from: fromWallet.address,
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
			}).on('error', function(err){
				return res.send({status: false, msg: 'error occurred in sending transaction!'});
			}).then(function(done){
				var status = done.status == '0x1'?true:false;
				var hash = done.transactionHash;
				var gas = done.gasUsed;

				if(!status)
					return res.send({status: false, msg: 'error occurred!'});

				History.create({
					from: fromWallet._id,
					to: toWallet._id,
					amount: tokenAmount,
					hash: hash,
					gas: gas,
					action: 'spent'
				}, async function(err, history){
					if(err)
						return res.send({status: false, msg: 'error occurred in saving history!'});
					
					return res.send({status: true, hash: hash});
				});
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
			return res.send({status: false, msg: 'you are not authorised!'});

		if(!flag)
			return res.send({status: false, msg: 'system is turned off!'});

		if(!req.body.walletId)
			return res.send({status: false, msg: 'error occurred!'});

		var walletId = req.body.walletId;
		var history = await History.find({$or: [{from: walletId}, {to: walletId}]});

		return res.send({status: true, history: history});
	});
}