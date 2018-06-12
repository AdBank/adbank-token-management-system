// Dependencies
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var express = require('express');
var morgan = require('morgan');
var errorHandler = require('errorhandler');
var http = require('http');
// Configs
// var config = require(`./config/${process.env.NODE_ENV || 'dev'}.js`);
const config = require('./config/environment');

// set the uri to mongo depending on environment
let uri = '';
if(process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
  uri = `mongodb://${config.mongo.uri}:${config.mongo.port}/${config.mongo.db}`;
} else {
  uri = `mongodb://${config.mongo.username}:${config.mongo.password}@${
    config.mongo.uri
  }/${config.mongo.db}${config.mongo.args}`;
}

// Connect to the DB
console.log(uri);
mongoose.connect(uri);

// Initialize the Express App
var app = express();
var server = http.createServer(app);

// web3 configuration
app.web3 = config.web3;

// Contract Configuration
app.contract = {};
// app.contract.abi = require(`../config/${config.contract.abi}`);
app.contract.address = config.contract.address;
app.contract.owner_address = config.contract.owner_address;
app.contract.decimals = config.contract.decimals;

// Wallet Configuration.
app.networkWallet = {};
app.networkWallet.address = config.networkWallet.address;
app.networkWallet.privateKey = config.networkWallet.privateKey;

app.revenueWallet = {};
app.revenueWallet.address = config.revenueWallet.address;

// ChainID Configuration
app.chainId = config.chainId;

// Fee Percentage
app.percent = config.percent;

// App Key
app.key = config.key;

// For parsing HTTP responses
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);
app.use(morgan('dev'));
app.use(errorHandler());
//. require('./api')(app);
require('./config/express').default(app);
require('./routes').default(app);

// Start server
function startServer() {
  // Start the app with listen and a port number
  app.tms = server.listen(config.port, config.ip, () => {
    console.log(
      `[Express] ${config.name} server listening on ${
        config.port
      }, in ${app.get('env')} mode`
    );
  });
}

setImmediate(startServer);
