// Dependencies
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var express = require('express');

// Configs
var config = require("./config/"+(process.env.NODE_ENV || 'dev')+".js");

// Connect to the DB
mongoose.connect(config.db.url);

// Initialize the Express App
var app = express();

// web3 configuration
app.web3 = config.web3;

// Contract Configuration
app.contract = {};
app.contract.abi = require("./app/resources/" + config.contract.abi);
app.contract.address = config.contract.address;
app.contract.owner_address = config.contract.owner_address;
app.contract.password = config.contract.password;
app.contract.decimals = config.contract.decimals;

// Wallet Configuration.
app.networkWallet = {};
app.networkWallet.address = config.networkWallet.address;
app.networkWallet.password = config.networkWallet.password;

app.revenueWallet = {};
app.revenueWallet.address = config.revenueWallet.address;
app.revenueWallet.password = config.revenueWallet.password;

// ChainID Configuration
app.chainId = config.chainId;

// Fee Percentage
app.percent = config.percent;

// App Key
app.key = config.key;

// For parsing HTTP responses
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

require('./app/routes/api')(app);

// Start the app with listen and a port number
app.listen(3000, function(){
	console.log(`Listening at http://localhost:3000`)
});