// const mongoose = require('mongoose');
// const bcrypt = require('bcrypt');
const Web3 = require('web3');
const Cryptr = require('cryptr');
const Wallet = require('./wallet/wallet.model');
// const History = require('./history/history.model');

const BigNumber = require('bignumber.js');
const net = require('net');
const Tx = require('ethereumjs-tx');
const stripHexPrefix = require('strip-hex-prefix');
const ethereumAddress = require('ethereum-address');
import Transaction from './transaction/transaction.model';
import config from '../config/environment';
import abi from '../config/abi.json';

BigNumber.config({ ERRORS: false });

// this is always going to be te same no need to drag it through envVars
var flag = true; // System flag

var cryptr = new Cryptr('AdBankTokenNetwork');
var client = new net.Socket();

/* Web3 Initialization */
var web3 = new Web3(new Web3.providers.HttpProvider(config.web3.rpc.provider));

/* Gas Price For Fast & Safe Transaction */
var gasPriceGlobal = new BigNumber(45000000000);

/* Contract Initialization */
var contractObj = new web3.eth.Contract(abi, config.contract.address);
contractObj.options.from = config.contract.ownerAddress;
let importedWallets = [];

// function checkAuth(req) {
//   var key = '';
//   if(req.headers['x-api-key']) key = req.headers['x-api-key'];

//   if(key != config.key) return 'You are not authorized!';

//   if(!flag) return 'System is turned off!';

//   return '';
// }

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function(err) {
    res.status(statusCode).send(err);
  };
}

export async function batchRequest(req, res) {
  if(!req.body.fromWalletId) {
    return res
      .status(400)
      .send({ status: false, msg: 'Parameters are missing!' });
  }

  let items = req.body.items;

  try {
    items = JSON.parse(req.body.items);
  } catch(e) {
    return res.status(400).send({ status: false, msg: 'Invalid parameters!' });
  }

  if(!items || items.length == 0) {
    console.log('Parameters are missing!');
    return res
      .status(400)
      .send({ status: false, msg: 'Parameters are missing!' });
  }

  /* ID Check */
  var fromWalletId = req.body.fromWalletId;
  // validate wallet Id is
  if(!fromWalletId.match(/^[0-9a-fA-F]{24}$/)) {
    console.log('Invalid wallet id!');
    return res.status(400).send({ status: false, msg: 'Invalid wallet id!' });
  }
  /* ID Check End */

  var fromWallet = await Wallet.findOne({ _id: fromWalletId });
  if(!fromWallet) {
    console.log('Wallet doesn\'t exist!');
    return res
      .status(400)
      .send({ status: false, msg: 'Wallet doesn\'t exist!' });
  }

  /* Check Balance */
  return contractObj.methods
    .balanceOf(fromWallet.address)
    .call({ from: config.contract.ownerAddress })
    .then(handleBatchRequest(fromWallet, items, res))
    .catch(handleError(res, 400));
  // .catch(err => {
  //   console.log('err', err);
  //   res.status(400).send({ status: false, msg: err });
  // });
  /* Check Balance End */
}

async function handleBatchRequest(fromWallet, items, res) {
  return async result => {
    let batch = new web3.BatchRequest();
    let balance = result / Math.pow(10, config.contract.decimals);
    // .catch(error => {
    //   console.log('Error occurred in getting transaction count!');
    //   return res.status(400).send({
    //     status: false,
    //     msg: 'Error occurred in getting transaction count!'
    //   });
    // });

    // var privateKeyStr = stripHexPrefix(cryptr.decrypt(fromWallet.privateKey));
    // const privateKey = Buffer.from(privateKeyStr, 'hex');

    /* Calculate ideal gas */
    var gasPriceWeb3 = await web3.eth.getGasPrice();
    var gasPrice = new BigNumber(gasPriceGlobal);

    if(gasPrice.isLessThan(gasPriceWeb3)) gasPrice = gasPriceWeb3;
    /* Calculate ideal gas end */

    // var processed = 0; // Total count of transactions that have been processed in real.

    var newItems = [];

    for(var i in items) {
      // console.log('i', items[i]);
      /* Begin For */
      if(items[i].action != 'spent' && items[i].action != 'Spent') {
        // If it is import or export
        continue;
      }

      console.log('items[i].to', items[i].to);
      /* ID Check */
      if(!items[i].to.match(/^[0-9a-fA-F]{24}$/)) continue;
      /* ID Check End */

      var toWallet = await Wallet.findOne({ _id: items[i].to });
      console.log('toWallet', toWallet);
      if(!toWallet) continue;

      items[i].toWallet = toWallet;

      var amount = parseFloat(items[i].amount);
      var amountFee = parseFloat(amount * config.percent / 100);
      var totalAmount = amount + amountFee;

      if(totalAmount > balance) continue;

      balance -= totalAmount;

      newItems.push(items[i]);
    } /* End For */

    if(newItems.length == 0) {
      console.log('Nothing to process!');
      return handleError(res, 400);
      // return res.status(400).send({ status: false, msg: 'Nothing to process!' });
    }

    /* Supply Gas */
    var totalGas = new BigNumber(0);

    for(var i in newItems) {
      var toWallet = newItems[i].toWallet;

      var amount = parseFloat(newItems[i].amount);
      var amountFee = parseFloat(amount * config.percent / 100);

      var tokenAmount = new BigNumber(
        (amount * Math.pow(10, config.contract.decimals)).toString()
      );
      var tokenAmountFee = new BigNumber(
        (amountFee * Math.pow(10, config.contract.decimals)).toString()
      );

      /* Estimate gas by doubling. Because sometimes, gas is estimated incorrectly and transaction fails. */
      var tempGas
        = 2
        * parseInt(
          await contractObj.methods
            .transfer(toWallet.address, tokenAmount)
            .estimateGas({ gas: 450000 }),
          10
        );
      var tempGasFee
        = 2
        * parseInt(
          await contractObj.methods
            .transfer(config.revenueWallet.address, tokenAmountFee)
            .estimateGas({ gas: 450000 }),
          10
        );

      totalGas = totalGas.plus(tempGas);
      totalGas = totalGas.plus(tempGasFee);

      newItems[i].gas = tempGas;
      newItems[i].gasFee = tempGasFee;
      newItems[i].tokenAmount = tokenAmount;
      newItems[i].tokenAmountFee = tokenAmountFee;
    }

    var totalETH = new BigNumber(totalGas.times(gasPrice));
    // console.log(`Total ETH Estimated - ${totalETH}`);

    var ethAmount = new BigNumber(
      await web3.eth.getBalance(fromWallet.address)
    );
    // console.log(`Current ETH - ${ethAmount}`);

    var giveETH = 0;
    var flag = false;

    if(totalETH.isGreaterThan(ethAmount)) {
      flag = true;
      giveETH = new BigNumber(totalETH.minus(ethAmount));
    }

    console.log(`Give ETH - ${giveETH}`);
    /* Supply Gas End */

    // pay gas
    return payGasAsETH(fromWallet.address, giveETH, flag)
      .then(handleTransaction(fromWallet, newItems, gasPrice, res))
      .catch(handleError(res, 400));
    // .catch(err => {
    //   console.log('err', err);
    //   res.status(400).send({ status: false, msg: err });
    // });
  };
}

async function handleTransaction(fromWallet, newItems, gasPrice, res) {
  return async function(result) {
    var privateKeyStr = stripHexPrefix(cryptr.decrypt(fromWallet.privateKey));
    const privateKey = Buffer.from(privateKeyStr, 'hex');
    // generate nonce
    let nonce = await web3.eth
      .getTransactionCount(fromWallet.address)
      .catch(handleError(res, 400));

    let processed = 0; // Total count of transactions that have been processed in real.

    for(var i in newItems) {
      /* Begin For */
      var tokenAmount = new BigNumber(newItems[i].tokenAmount);
      var tokenAmountFee = new BigNumber(newItems[i].tokenAmountFee);
      var gas = newItems[i].gas;
      var gasFee = newItems[i].gasFee;

      var toWallet = newItems[i].toWallet;

      var txData = contractObj.methods
        .transfer(toWallet.address, tokenAmount)
        .encodeABI();
      var txDataFee = contractObj.methods
        .transfer(config.revenueWallet.address, tokenAmountFee)
        .encodeABI();

      /* Send Fee */
      var txParamsFee = {
        nonce: web3.utils.toHex(nonce++),
        gasPrice: web3.utils.toHex(gasPrice),
        gasLimit: gasFee,
        from: fromWallet.address,
        to: contractObj._address,
        value: '0x00',
        chainId: config.chainId,
        data: txDataFee
      };

      var txFee = new Tx(txParamsFee);
      txFee.sign(privateKey);

      var serializedTxFee = txFee.serialize();

      web3.eth
        .sendSignedTransaction(`0x${serializedTxFee.toString('hex')}`)
        .on('transactionHash', hash => {
          console.log('batchRequest item transactionHash', hash);
        })
        .on('receipt', receipt => {
          // we should persist these to keep a papertrail.
          console.log('batchRequest item receipt', receipt);
        })
        .on('error', err => {
          console.log('batchRequest item err', err);
        });
      /* Send Fee End */

      var txParams = {
        nonce: web3.utils.toHex(nonce++),
        gasPrice: web3.utils.toHex(gasPrice),
        gasLimit: gas,
        from: fromWallet.address,
        to: contractObj._address,
        value: '0x00',
        chainId: config.chainId,
        data: txData
      };

      var tx = new Tx(txParams);
      tx.sign(privateKey);

      var serializedTx = tx.serialize();

      web3.eth
        .sendSignedTransaction(`0x${serializedTx.toString('hex')}`)
        .on('transactionHash', hash => {
          processed++;
          // console.log(`Processed - ${processed}`);
          // console.log('batchRequest item transactionHash', hash);
          newItems[processed - 1].status = 'processed';
          newItems[processed - 1].hash = hash;
          // console.log('newItems[processed - 1]', newItems);
          Transaction.create({
            account: newItems[processed - 1].account,
            sender: newItems[processed - 1].sender,
            receiver: newItems[processed - 1].receiver,
            txId: newItems[processed - 1]._id,
            from: fromWallet._id,
            to: newItems[processed - 1].toWallet._id,
            amount: newItems[processed - 1].amount,
            action: 'spent',
            status: 'Complete',
            hash
          })
            .then(result => {
              console.log('Transaction create result', result);
            })
            .catch(err => {
              console.log('Transaction create err', err);
            });

          if(processed == newItems.length) {
            return res.send({
              status: true,
              items: newItems,
              balance
            });
          }
        })
        .on('receipt', receipt => {
          // we should persist these to keep a papertrail.
          console.log('batchRequest item receipt', receipt);
        })
        .on('error', err => {
          console.log('batchRequest item err', err);
        });
      /* Send Token */
    }
  }; /* End For */
}

function payGasAsETH(toAddress, ethAmount) {
  return new Promise(async (resolve, reject) => {
    /* Calculate ideal gas */
    var gasPriceWeb3 = await web3.eth.getGasPrice();
    var gasPrice = new BigNumber(gasPriceGlobal);

    if(gasPrice.isLessThan(gasPriceWeb3)) {
      gasPrice = gasPriceWeb3;
    }
    /* Calculate ideal gas end */

    const privateKey = Buffer.from(config.networkWallet.privateKey, 'hex');

    var nonce = await web3.eth
      .getTransactionCount(config.networkWallet.address)
      .catch(err => reject(err));

    var txParams = {
      nonce: web3.utils.toHex(nonce),
      gasPrice: web3.utils.toHex(gasPrice),
      gasLimit: web3.utils.toHex(400000),
      from: config.networkWallet.address,
      to: toAddress,
      value: web3.utils.toHex(ethAmount),
      chainId: config.chainId
    };

    var tx = new Tx(txParams);
    tx.sign(privateKey);

    var serializedTx = tx.serialize();

    web3.eth
      .sendSignedTransaction(`0x${serializedTx.toString('hex')}`)
      .then(receipt => resolve(receipt))
      .catch(err => reject(err));
  });
}

function createTransactionRecord() {
  processed++;
  // console.log(`Processed - ${processed}`);
  // console.log('batchRequest item transactionHash', hash);
  newItems[processed - 1].status = 'processed';
  newItems[processed - 1].hash = hash;
  // console.log('newItems[processed - 1]', newItems);
  Transaction.create({
    account: newItems[processed - 1].account,
    sender: newItems[processed - 1].sender,
    receiver: newItems[processed - 1].receiver,
    txId: newItems[processed - 1]._id,
    from: fromWallet._id,
    to: newItems[processed - 1].toWallet._id,
    amount: newItems[processed - 1].amount,
    action: 'spent',
    status: 'Complete',
    hash
  })
    .then(result => {
      console.log('Transaction create result', result);
    })
    .catch(err => {
      console.log('Transaction create err', err);
    });

  if(processed == newItems.length) {
    return res.send({
      status: true,
      items: newItems,
      balance
    });
  }
}
