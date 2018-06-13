'use strict';
// const mongoose = require('mongoose');
// const bcrypt = require('bcrypt');
const Web3 = require('web3');
const Cryptr = require('cryptr');
const Wallet = require('../wallet/wallet.model');
const History = require('../history/history.model');
const Transaction = require('./transaction.model');
const BigNumber = require('bignumber.js');
const net = require('net');
const Tx = require('ethereumjs-tx');
const stripHexPrefix = require('strip-hex-prefix');
const ethereumAddress = require('ethereum-address');
import config from '../../config/environment';
import abi from '../../config/abi.json';

import NATS from 'nats';
const uuidv4 = require('uuid/v4');
const nats = NATS.connect({ servers: config.nats.servers, json: true });

BigNumber.config({ ERRORS: false });

// this is always going to be te same no need to drag it through envVars
var flag = true; // System flag

var cryptr = new Cryptr('AdBankTokenNetwork');
var client = new net.Socket();

/* Web3 Initialization */
var web3 = new Web3(new Web3.providers.HttpProvider(config.web3.rpc.provider));

/* Contract Initialization */
var contractObj = new web3.eth.Contract(abi, config.contract.address);
contractObj.options.from = config.contract.ownerAddress;
let importedWallets = [];

function respondWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return entity => {
    if (entity) {
      return res.status(statusCode).json(entity);
    }
    return null;
  };
}

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return err => {
    res.status(statusCode).send(err);
  };
}

export async function index(req, res) {
  return res.sendStatus(503);
}

export async function create(req, res) {
  if (
    !req.body.account
    || !req.body.txId
    || !req.body.from
    || !req.body.to
    || !req.body.amount
    || isNaN(req.body.amount)
  ) {
    // 422 means invalid data
    return res.sendStatus(422);
  }

  Transaction.create({
    account: req.body.account,
    txId: req.body.txId,
    from: req.body.to,
    to: req.body.from,
    amount: req.body.amount,
    action: 'spent'
  }).then(respondWithResult(res, 201))
    .catch(handleError(res));
}

  // /* ID Check */
  // var fromWalletId = req.body.fromWalletId;
  // // validate fromWalletId is 12-byte ObjectId value
  // if (!fromWalletId.match(/^[0-9a-fA-F]{24}$/)) {
  //   console.log('Invalid wallet id!');
  //   return res.status(400).send({ status: false, msg: 'Invalid wallet id!' });
  // }
  // /* ID Check End */

  // var fromWallet = await Wallet.findOne({ _id: fromWalletId });
  // if (!fromWallet) {
  //   console.log('Wallet doesn\'t exist!');
  //   return res
  //     .status(400)
  //     .send({ status: false, msg: 'Wallet doesn\'t exist!' });
  // }

  // /* ID Check */
  // var toWalletId = req.body.toWalletId;
  // // validate toWalletId is 12-byte ObjectId value
  // if (!toWalletId.match(/^[0-9a-fA-F]{24}$/)) {
  //   return res.status(400).send({ status: false, msg: 'Invalid wallet id!' });
  // }
  // /* ID Check End */

  // // find toWalletId in tms db
  // var toWallet = await Wallet.findOne({ _id: toWalletId });
  // if (!toWallet) {
  //   return res
  //     .status(400)
  //     .send({ status: false, msg: 'Wallet doesn\'t exist!' });
  // }
  // // set the amount to be transfered as a floating point number
  // var amount = parseFloat(req.body.tokenAmount);

  // // verify the amount is greater that 0
  // if (amount == 0) {
  //   return res.status(400).send({
  //     status: false,
  //     msg: 'Token amount shouldn\'t be equal to 0!'
  //   });
  // }

  // // set floating point number to 2 decimal places
  // amount = parseFloat(amount.toFixed(2));
  // // calculate fee based
  // var fee = parseFloat(amount * config.percent / 100); // Fee to Revenue Wallet
  // // trim fee to two decimal places
  // fee = parseFloat(fee.toFixed(2));
  // //calculate total amount to be transfered
  // var totalAmount = parseFloat(amount) + parseFloat(fee);

  // // Check balance of fromWallet account
  // contractObj.methods
  //   .balanceOf(fromWallet.address)
  //   .call({ from: config.contract.ownerAddress })
  //   .then(async result => {
  //     // console.log('result', result);
  //     var balance = result / Math.pow(10, config.contract.decimals);
  //     console.log('balance', balance, fromWallet.address, config.contract.ownerAddress);
  //     // check if balance is 0
  //     // console.log('balance', balance);
  //     if (balance === 0) {
  //       console.log('err', 'Nothing to transfer!');
  //       return res
  //         .status(400)
  //         .send({ status: false, msg: 'Nothing to transfer!' });
  //     }
  //     // check if totalAmount is greater than balance and reject if true
  //     if (totalAmount > balance) {
  //       console.log('err', 'Insufficient balance!');
  //       return res
  //         .status(400)
  //         .send({ status: false, msg: 'Insufficient balance!' });
  //     }

  //     contractObj.methods
  //       .balanceOf(toWallet.address)
  //       .call({ from: config.contract.ownerAddress })
  //       .then(async function (result) {
  //         var toBalance = result / Math.pow(10, config.contract.decimals);

  //         var tokenAmount = new BigNumber(
  //           (amount * Math.pow(10, config.contract.decimals)).toString()
  //         );
  //         var feeAmount = new BigNumber(
  //           (fee * Math.pow(10, config.contract.decimals)).toString()
  //         );

  //         var privateKeyStr = stripHexPrefix(
  //           cryptr.decrypt(fromWallet.privateKey)
  //         );
  //         var privateKey = new Buffer(privateKeyStr, 'hex');

  //         /* Supply Gas */
  //         var txDataFee = contractObj.methods
  //           .transfer(config.revenueWallet.address, feeAmount)
  //           .encodeABI();
  //         var txData = contractObj.methods
  //           .transfer(toWallet.address, tokenAmount)
  //           .encodeABI();
  //         console.log(
  //           'toWallet.address, tokenAmount',
  //           toWallet.address,
  //           tokenAmount
  //         );
  //         /* Estimate gas by doubling. Because sometimes, gas is not estimated correctly and transaction fails! */
  //         var gasESTFee
  //           = 2
  //           * parseInt(
  //             await contractObj.methods
  //               .transfer(config.revenueWallet.address, feeAmount)
  //               .estimateGas({ gas: 450000 })
  //           );
  //         console.log(
  //           'toWallet.address, tokenAmount',
  //           toWallet.address,
  //           tokenAmount
  //         );
  //         var gasEST
  //           = 2
  //           * parseInt(
  //             await contractObj.methods
  //               .transfer(toWallet.address, tokenAmount)
  //               .estimateGas({ gas: 450000 })
  //           );
  //         console.log('gasESTFee', gasESTFee);
  //         var totalGas = new BigNumber(gasEST + gasESTFee);

  //         var ethAmount = new BigNumber(
  //           await web3.eth.getBalance(fromWallet.address)
  //         );
  //         var gasPrice = await web3.eth.getGasPrice();

  //         console.log(`gasPrice - ${gasPrice}`);

  //         var remainingGas = new BigNumber((ethAmount / gasPrice).toString());
  //         // console.log('remainingGas - ' + remainingGas);
  //         var remainingETH = parseFloat(remainingGas / Math.pow(10, 9));
  //         var totalETH = parseFloat(totalGas / Math.pow(10, 9));

  //         var giveETH = 0;
  //         var flag = false;

  //         if (remainingETH < totalETH) {
  //           // need to supply gas
  //           giveETH = new BigNumber(totalGas.minus(remainingGas) * gasPrice);

  //           flag = true;
  //         }

  //         console.log(`giveETH - ${giveETH}`);
  //         /* Supply Gas End */

  //         /* Promise Start */
  //         payGasAsETH(fromWallet.address, giveETH, flag).then(
  //           async function (result) {
  //             var nonce = await web3.eth
  //               .getTransactionCount(fromWallet.address)
  //               .catch(error =>
  //                 res.status(400).send({
  //                   status: false,
  //                   msg: 'Error occurred in getting transaction count!'
  //                 })
  //               );

  //             /* Send Fee */
  //             var txParamsFee = {
  //               nonce: web3.utils.toHex(nonce),
  //               gasPrice: web3.utils.toHex(gasPrice),
  //               gasLimit: gasESTFee,
  //               from: fromWallet.address,
  //               to: contractObj._address,
  //               value: '0x00',
  //               chainId: config.chainId,
  //               data: txDataFee
  //             };

  //             var txFee = new Tx(txParamsFee);
  //             txFee.sign(privateKey);

  //             var serializedTxFee = txFee.serialize();

  //             web3.eth
  //               .sendSignedTransaction(`0x${serializedTxFee.toString('hex')}`)
  //               .on('transactionHash', hash => {
  //                 console.log('transactionHash', hash);
  //               })
  //               .on('recipet', recipet => {
  //                 console.log('recipet', recipet);
  //               })
  //               .on('error', err => {
  //                 console.log('sendSignedTransaction err', err);
  //               });
  //             /* Send Fee End */

  //             var txParams = {
  //               nonce: web3.utils.toHex(nonce + 1),
  //               gasPrice: web3.utils.toHex(gasPrice),
  //               gasLimit: gasEST,
  //               from: fromWallet.address,
  //               to: contractObj._address,
  //               value: '0x00',
  //               chainId: config.chainId,
  //               data: txData
  //             };

  //             var tx = new Tx(txParams);
  //             tx.sign(privateKey);

  //             var serializedTx = tx.serialize();

  //             var sent = false;
  //             web3.eth
  //               .sendSignedTransaction(`0x${serializedTx.toString('hex')}`)
  //               .on('transactionHash', function (hash) {
  //                 var fromBalance
  //                   = parseFloat(balance) - parseFloat(totalAmount);
  //                 toBalance = parseFloat(toBalance) + parseFloat(amount);

  //                 History.create({
  //                   from: fromWallet._id,
  //                   to: toWallet._id,
  //                   amount: tokenAmount,
  //                   hash,
  //                   action: 'spent'
  //                 })
  //                   .then(result =>
  //                     res.status(201).send({
  //                       status: true,
  //                       hash,
  //                       fromBalance,
  //                       toBalance
  //                     })
  //                   )
  //                   .catch(err => {
  //                     console.log('err', err);
  //                     return res.status(400).send({
  //                       status: false,
  //                       msg: 'Error occurred in saving history!'
  //                     });
  //                   });
  //               })
  //               .on('receipt', receipt => {
  //                 // we should persist these to keep a papertrail.
  //                 console.log('receipt', receipt);
  //               })
  //               .on('error', err => {
  //                 if (!sent) console.log('err', err);
  //                 console.log('err', err);
  //                 return res
  //                   .status(400)
  //                   .send({ status: false, msg: err.message });
  //               });
  //           },
  //           function (err) {
  //             console.log('err', err);
  //             return res.status(400).send({ status: false, msg: err.message });
  //           }
  //         );
  //         /* Promise End */
  //       })
  //       .catch(err => {
  //         console.log('err', err);
  //         res.status(400).send({ status: false, msg: err });
  //       });
  //   })
  //   .catch(err => {
  //     console.log('err', err);
  //     res.status(400).send({ status: false, msg: err });
  //   });
  // /* Check Balance End */