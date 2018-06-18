'use strict';
// const mongoose = require('mongoose');
// const bcrypt = require('bcrypt');
const Web3 = require('web3');
const Cryptr = require('cryptr');
const Wallet = require('../wallet/wallet.model');
const History = require('../history/history.model');
const BigNumber = require('bignumber.js');
const net = require('net');
const Tx = require('ethereumjs-tx');
const stripHexPrefix = require('strip-hex-prefix');
const ethereumAddress = require('ethereum-address');
import Transaction from './transaction.model';
import Receipt from '../receipt/receipt.model';
import config from '../../config/environment';

// import abi from '../../config/abi.json';
import fs from 'fs';

var appRoot = process.cwd();
const abi = require(`${appRoot}/abi.json`);
// let abi = fs.readFileSync(`${appRoot}/abi.json`);

BigNumber.config({ ERRORS: false });

// this is always going to be te same no need to drag it through envVars
var flag = true; // System flag

var cryptr = new Cryptr('AdBankTokenNetwork');

/* Web3 Initialization */
var web3 = new Web3(new Web3.providers.HttpProvider(config.web3.rpc.provider));

/* Gas Price For Fast & Safe Transaction */
var gasPriceGlobal = new BigNumber(20000000000);

/* Contract Initialization */
/*var contractObj = new web3.eth.Contract(
  JSON.parse(abi),
  config.contract.address
);*/
var contractObj = new web3.eth.Contract(
  abi,
  config.contract.address
);

contractObj.options.from = config.contract.ownerAddress;
let importedWallets = [];

function updateTransaction(data) {
  let id = data._id;
  let _data = {
    account: data.account,
    txId: data.txId,
    from: data.from,
    to: data.to,
    amount: data.amount,
    action: data.action,
    status: data.status,
    hash: data.hash || ''
  };
  // console.log('id', id);
  // Reflect.deleteProperty(data, '_id');
  // // Reflect.deleteProperty(data, 'txId');
  // Reflect.deleteProperty(data, 'createdAt');
  // Reflect.deleteProperty(data, 'updatedAt');
  // Reflect.deleteProperty(data, '__v');
  // delete _data._id;
  // delete _data.__v;
  // delete _data.updatedAt;
  // delete _data.createdAt;
  console.log('updateTransaction', data);
  // console.log('data', data);
  Transaction.findOneAndUpdate({ _id: id }, _data, {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
    runValidators: true
  })
    .exec()
    .then(result => {
      console.log('Transaction updated result', result);
      return result.save();
    })
    .catch(err => console.log('update tx err', err));
}

function respondWithResult(res, statusCode, action) {
  statusCode = statusCode || 200;
  action = action || 'get';
  return entity => {
    if(entity) {
      if(action === 'create') {
        handleTransaction(entity);
      }
      return res.status(statusCode).json(entity);
    }
    return null;
  };
}

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return err => {
    console.log('handleError err', err);
    res.status(statusCode).send(err);
  };
}

export async function index(req, res) {
  return res.sendStatus(503);
}

export async function show(req, res) {
  return res.sendStatus(200);
}

export async function create(req, res) {
  console.log('req.body', req.body);
  if(
    !req.body.account
    || !req.body.txId
    || !req.body.from
    || !req.body.to
    || !req.body.sender
    || !req.body.receiver
    || !req.body.amount
    || isNaN(req.body.amount)
  ) {
    // 422 means invalid data
    return res.sendStatus(422);
  }

  return Transaction.create({
    sender: req.body.sender,
    receiver: req.body.receiver,
    account: req.body.account,
    txId: req.body.txId,
    from: req.body.from,
    to: req.body.to,
    amount: req.body.amount,
    action: 'Spent',
    status: 'Processing'

  })
    .then(respondWithResult(res, 201, 'create'))
    .catch(handleError(res));
}

// req.body { address: '0xf3399d84571fac96eed37cd4b50baee807b67360',
//   walletId: '5b17f7a059ca190014773f8c',
//   tokenAmount: '30' }

export async function withdraw(req, res) {
  console.log('req.body', req.body);
  if(
    !req.body.account
    || !req.body.sender
    || !req.body.receiver
    || !req.body.address
    || !req.body.walletId
    || !req.body.amount
    || isNaN(req.body.amount)
  ) {
    // 422 means invalid data
    return res.sendStatus(422);
  }

  return Transaction.create({
    account: req.body.account,
    sender: req.body.sender,
    receiver: req.body.receiver,
    txId: req.body.txId,
    from: req.body.from,
    to: req.body.to,
    amount: req.body.amount,
    action: 'Export',
    status: 'Processing'
  })
    .then(respondWithResult(res, 201, 'create'))
    .catch(handleError(res));
}

async function handleTransaction(entity) {
  /* ID Check */
  let fromWalletId = entity.from;
  // validate fromWalletId is 12-byte ObjectId value
  if(!fromWalletId.match(/^[0-9a-fA-F]{24}$/)) {
    console.log('Invalid wallet id!');

    entity.status = 'Invalid wallet id!';
    return updateTransaction(entity);
  }
  /* ID Check End */

  let fromWallet = await Wallet.findOne({ _id: fromWalletId });
  if(!fromWallet) {
    console.log('Wallet doesn\'t exist!');

    entity.status = 'Wallet doesn\'t exist!';
    return updateTransaction(entity);
  }

  /* ID Check */
  let toWalletId = entity.to;
  // validate toWalletId is 12-byte ObjectId value
  if(!toWalletId.match(/^[0-9a-fA-F]{24}$/)) {
    console.log('Invalid wallet id!');

    entity.status = 'Invalid wallet id!';
    return updateTransaction(entity);
  }
  /* ID Check End */

  // find toWalletId in tms db
  let toWallet = await Wallet.findOne({ _id: toWalletId });
  if(!toWallet) {
    console.log('Wallet doesn\'t exist!');

    entity.status = 'Wallet doesn\t exist!';
    return updateTransaction(entity);
  }
  // set the amount to be transfered as a floating point number
  let amount = parseFloat(entity.amount);

  // verify the amount is greater than 0
  if(amount <= 0) {
    console.log('Token amount shouldn\'t be equal to 0!');

    entity.status = 'token amount error!';
    return updateTransaction(entity);
  }

  // set floating point number to 2 decimal places
  amount = parseFloat(amount.toFixed(2));

  // calculate fee based
  var fee = parseFloat(amount * config.percent / 100); // Fee to Revenue Wallet
  // trim fee to two decimal places
  fee = parseFloat(fee.toFixed(2));
  //calculate total amount to be transfered
  let totalAmount = parseFloat(amount) + parseFloat(fee);

  // Check balance of fromWallet account
  contractObj.methods
    .balanceOf(fromWallet.address)
    .call({ from: config.contract.ownerAddress })
    .then(async result => {
      // console.log('result', result);
      var balance = result / Math.pow(10, config.contract.decimals);
      console.log(
        'balance',
        balance,
        fromWallet.address,
        config.contract.ownerAddress
      );
      // check if balance is 0
      if(balance === 0) {
        console.log('err', 'Nothing to transfer!');

        entity.status = 'Nothing to transfer!';
        return updateTransaction(entity);
      }
      // check if totalAmount is greater than balance and reject if true
      if(totalAmount > balance) {
        console.log('err', 'Insufficient balance!');

        entity.status = 'failed : Insufficient balance!';
        return updateTransaction(entity);
      }

      contractObj.methods
        .balanceOf(toWallet.address)
        .call({ from: config.contract.ownerAddress })
        .then(async function(balanceResult) {
          var toBalance
            = balanceResult / Math.pow(10, config.contract.decimals);

          var tokenAmount = new BigNumber(
            (amount * Math.pow(10, config.contract.decimals)).toString()
          );
          var feeAmount = new BigNumber(
            (fee * Math.pow(10, config.contract.decimals)).toString()
          );

          var privateKeyStr = stripHexPrefix(
            cryptr.decrypt(fromWallet.privateKey)
          );
          var privateKey = new Buffer(privateKeyStr, 'hex');

          /* Supply Gas */
          var txDataFee = contractObj.methods
            .transfer(config.revenueWallet.address, feeAmount)
            .encodeABI();
          var txData = contractObj.methods
            .transfer(toWallet.address, tokenAmount)
            .encodeABI();

          console.log(
            'Fee Token Amount, Payment Token Amount',
            feeAmount,
            tokenAmount
          );

          /* Estimate gas by doubling. Because sometimes, gas is not estimated correctly and transaction fails! */
          var gasESTFee
            = 2
            * parseInt(
              await contractObj.methods
                .transfer(config.revenueWallet.address, feeAmount)
                .estimateGas({ gas: 450000 })
            );
          var gasEST
            = 2
            * parseInt(
              await contractObj.methods
                .transfer(toWallet.address, tokenAmount)
                .estimateGas({ gas: 450000 })
            );

          var totalGas = new BigNumber(gasEST + gasESTFee);
          console.log(
            'Fee Gas EST + Payment Gas EST = Total Gas EST',
            gasESTFee,
            gasEST,
            totalGas
          );

          /* Calculate ideal gas */
          var gasPriceWeb3 = await web3.eth.getGasPrice();
          var gasPrice = new BigNumber(gasPriceGlobal);

          if(gasPrice.isLessThan(gasPriceWeb3)) {
            gasPrice = gasPriceWeb3;
          }
          /* Calculate ideal gas end */

          var totalETH = new BigNumber(totalGas.times(gasPrice));
          console.log(`Total ETH Estimated - ${totalETH}`);

          var ethAmount = new BigNumber(
            await web3.eth.getBalance(fromWallet.address)
          );
          console.log(`Current ETH - ${ethAmount}`);

          var giveETH = 0;
          var flag = false;

          if(totalETH.isGreaterThan(ethAmount)) {
            flag = true;
            giveETH = new BigNumber(totalETH.minus(ethAmount));
          }

          console.log(`Give ETH - ${giveETH}`);
          /* Supply Gas End */

          /* Promise Start */
          payGasAsETH(fromWallet.address, giveETH, flag).then(
            async function(result) {
              var nonce = await web3.eth
                .getTransactionCount(fromWallet.address)
                .catch(err => {
                  console.log(
                    'Error occurred in getting transaction count!',
                    err
                  );
                  return;
                });

              /* Send Fee */
              var txParamsFee = {
                nonce: web3.utils.toHex(nonce),
                gasPrice: web3.utils.toHex(gasPrice),
                gasLimit: gasESTFee,
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
                  console.log('transactionHash for tx Fee', hash);
                  return;
                })
                .on('recipet', recipet => {
                  // update mongo here
                  console.log('recipet for tx fee', recipet);
                  return;
                })
                .on('error', err => {
                  console.log('sendSignedTransaction for tx fee err', err);
                  return;
                });
              /* Send Fee End */

              var txParams = {
                nonce: web3.utils.toHex(nonce + 1),
                gasPrice: web3.utils.toHex(gasPrice),
                gasLimit: gasEST,
                from: fromWallet.address,
                to: contractObj._address,
                value: '0x00',
                chainId: config.chainId,
                data: txData
              };

              var tx = new Tx(txParams);
              tx.sign(privateKey);

              var serializedTx = tx.serialize();

              var sent = false;
              web3.eth
                .sendSignedTransaction(`0x${serializedTx.toString('hex')}`)
                .on('transactionHash', function(hash) {
                  var fromBalance
                    = parseFloat(balance) - parseFloat(totalAmount);
                  toBalance = parseFloat(toBalance) + parseFloat(amount);
                  console.log(
                    'sendSignedTransaction success',
                    fromWallet._id,
                    toWallet._id,
                    tokenAmount,
                    hash,
                    'spent'
                  );
                  entity.status = 'Pending';
                  entity.hash = hash;
                  return updateTransaction(entity);

                  // update mongo here
                  // do this as Transaction
                  // History.create({
                  //   from: fromWallet._id,
                  //   to: toWallet._id,
                  //   amount: tokenAmount,
                  //   hash,
                  //   action: 'spent'
                  // })
                  //   .then(result =>
                  //     res.status(201).send({
                  //       status: true,
                  //       hash,
                  //       fromBalance,
                  //       toBalance
                  //     })
                  //   )
                  //   .catch(err => {
                  //     console.log('err', err);
                  //     return res.status(400).send({
                  //       status: false,
                  //       msg: 'Error occurred in saving history!'
                  //     });
                  //   });
                })
                .on('receipt', receipt => {
                  console.log('receipt', receipt);
                  Receipt.create(receipt).then(recipetResult => {
                    entity.status = 'Complete';
                    entity.receiptId = recipetResult._id;
                    return updateTransaction(entity);
                  });
                  // we should persist these to keep a papertrail.
                })
                .on('error', err => {
                  entity.status = 'Error';
                  console.log('sendSignedTransaction err', err);
                  // update mongo here
                  return updateTransaction(entity);
                  // return res
                  //   .status(400)
                  //   .send({ status: false, msg: err.message });
                });
            },
            function(err) {
              console.log('payGasAsETH err', err);
              // return res.status(400).send({ status: false, msg: err.message });
              return;
            }
          );
          /* Promise End */
        })
        .catch(err => {
          console.log('balanceOf to err', err);
          entity.status = 'Error: Decrypting key';
          return updateTransaction(entity);
        });
    })
    .catch(err => {
      console.log('balanceOf from err', err);
      entity.status = 'Error: Decrypting key';
      return updateTransaction(entity);
    });
  /* Check Balance End */
}

function payGasAsETH(toAddress, ethAmount, flag) {
  return new Promise(async (resolve, reject) => {
    if(!flag) resolve();
    else {
      /* Calculate ideal gas */
      var gasPriceWeb3 = await web3.eth.getGasPrice();
      var gasPrice = new BigNumber(gasPriceGlobal);

      if(gasPrice.isLessThan(gasPriceWeb3)) {
        gasPrice = gasPriceWeb3;
      }
      /* Calculate ideal gas end */

      ethAmount = new BigNumber(3565040000000000);

      console.log('We are in PayGasASETH function');
      console.log('Gas Price: ' + gasPrice);
      console.log('Network Wallet Address: ' + config.networkWallet.address);
      console.log('Network Wallet PrivateKey: ' + config.networkWallet.privateKey);
      console.log('To Address: ' + toAddress);
      
      var privateKeyStr = stripHexPrefix(config.networkWallet.privateKey);
      var privateKey = new Buffer(privateKeyStr, 'hex');

      var nonce = await web3.eth
        .getTransactionCount(config.networkWallet.address)
        .catch(error => {
          console.log('getTransactionCount error', error);
          reject();
        });

      console.log('Nonce:' + nonce);

      var txParams = {
        nonce: web3.utils.toHex(nonce),
        gasPrice: web3.utils.toHex(gasPrice),
        gasLimit: web3.utils.toHex(21000),
        from: config.networkWallet.address,
        to: toAddress,
        value: web3.utils.toHex(ethAmount),
        chainId: config.chainId
      };

      console.log('ETH Amount: ' + ethAmount);
      console.log('Chain ID: ' + config.chainId);

      var tx = new Tx(txParams);
      tx.sign(privateKey);

      var serializedTx = tx.serialize();

      web3.eth
        .sendSignedTransaction(`0x${serializedTx.toString('hex')}`)
        .then(receipt => {
          console.log('sendSignedTransaction receipt', receipt);
          Promise.resolve();
        })
        .catch(err => {
          console.log('sendSignedTransaction error', err);
          Promise.reject(err);
        });
    }
  });
}
