'use strict';
// const mongoose = require('mongoose');
// const bcrypt = require('bcrypt');
const Web3 = require('web3');
const Cryptr = require('cryptr');
const Wallet = require('../wallet/wallet.model');
// const History = require('../history/history.model');
const BigNumber = require('bignumber.js');
// const net = require('net');
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
// var flag = true; // System flag

var cryptr = new Cryptr('AdBankTokenNetwork');

/* Web3 Initialization */
var web3 = new Web3(new Web3.providers.HttpProvider(config.web3.rpc.provider));

/* Gas Price For Fast & Safe Transaction */
var gasPriceGlobal = new BigNumber(45000000000);

/* Contract Initialization */
/*var contract = new web3.eth.Contract(
  JSON.parse(abi),
  config.contract.address
);*/
var contract = new web3.eth.Contract(abi, config.contract.address);

contract.options.from = config.contract.ownerAddress;
// let importedWallets = [];

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
  Transaction.findOneAndUpdate({ _id: id }, _data, {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
    runValidators: true
  })
    .exec()
    .then(result =>
      // console.log('Transaction updated result', result);
      result.save()
    )
    .catch(err => console.log('update tx err', err));
}

function respondWithResult(res, statusCode, action) {
  statusCode = statusCode || 200;
  action = action || 'get';
  return entity => {
    if(entity) {
      if(action === 'create') {
        validateTransaction(entity);
      } else if(action == 'withdraw') {
        handleExportTransaction(entity);
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

/**
 * create transactions handler
 *
 *
 *
 */

export async function create(req, res) {
  // console.log('req.body', req.body);
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

/**
 * withdraw/export transactions handler
 *
 *
 *
 */

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
    .then(respondWithResult(res, 201, 'withdraw'))
    .catch(handleError(res));
}

/**
 * Private functions
 *
 *
 *
 */

async function handleExportTransaction(entity) {
  /* ID Check */
  let walletId = entity.from;
  // validate walletId is 12-byte ObjectId value
  if(!walletId.match(/^[0-9a-fA-F]{24}$/)) {
    console.log('Invalid wallet id!');

    entity.status = 'Invalid wallet id!';
    return updateTransaction(entity);
  }
  /* ID Check End */

  let wallet = await Wallet.findOne({ _id: walletId });
  if(!wallet) {
    console.log('Wallet doesn\'t exist!');

    entity.status = 'Wallet doesn\'t exist!';
    return updateTransaction(entity);
  }

  let address = entity.receiver;

  if(!ethereumAddress.isAddress(address)) {
    console.log('Invalid address!');

    entity.status = 'Invalid address!';
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

  //calculate total amount to be transfered
  let totalAmount = parseFloat(amount);

  // Check balance of wallet account
  contract.methods
    .balanceOf(wallet.address)
    .call({ from: config.contract.ownerAddress })
    .then(async result => {
      // console.log('result', result);
      var balance = result / Math.pow(10, config.contract.decimals);
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

      var tokenAmount = new BigNumber(
        (amount * Math.pow(10, config.contract.decimals)).toString()
      );

      var privateKeyStr = stripHexPrefix(cryptr.decrypt(wallet.privateKey));
      const privateKey = Buffer.from(privateKeyStr, 'hex');

      /* Supply Gas */
      var txData = contract.methods.transfer(address, tokenAmount).encodeABI();

      console.log('Payment Token Amount', tokenAmount);

      /* Estimate gas by doubling. Because sometimes, gas is not estimated correctly and transaction fails! */
      var gasEST
        = 2
        * parseInt(
          await contract.methods
            .transfer(address, tokenAmount)
            .estimateGas({ gas: 450000 })
        );

      var totalGas = new BigNumber(gasEST);
      console.log('Payment Gas EST = Total Gas EST', gasEST, totalGas);

      /* Calculate ideal gas */
      var gasPriceWeb3 = await web3.eth.getGasPrice();
      var gasPrice = new BigNumber(gasPriceGlobal);

      if(gasPrice.isLessThan(gasPriceWeb3)) {
        gasPrice = gasPriceWeb3;
      }
      /* Calculate ideal gas end */

      var totalETH = new BigNumber(totalGas.times(gasPrice));
      console.log(`Total ETH Estimated - ${totalETH}`);

      var ethAmount = new BigNumber(await web3.eth.getBalance(wallet.address));
      console.log(`Current ETH - ${ethAmount}`);

      var giveETH = 0;
      // var flag = false;

      if(totalETH.isGreaterThan(ethAmount)) {
        // flag = true;
        giveETH = new BigNumber(totalETH.minus(ethAmount));
      }

      console.log(`Give ETH - ${giveETH}`);
      /* Supply Gas End */

      /* Promise Start */
      payGasAsETH(wallet.address, giveETH).then(
        async function(result) {
          var nonce = await web3.eth
            .getTransactionCount(wallet.address)
            .catch(err => {
              console.log('Error occurred in getting transaction count!', err);
              return;
            });

          var txParams = {
            nonce: web3.utils.toHex(nonce),
            gasPrice: web3.utils.toHex(gasPrice),
            gasLimit: gasEST,
            from: wallet.address,
            to: contract._address,
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
            .once('transactionHash', hash => {
              // console.info(
              //   'transactionHash',
              //   `https://ropsten.etherscan.io/tx/${hash}`
              // );
              entity.status = 'Pending';
              entity.hash = hash;
              return updateTransaction(entity);
            })
            .once('receipt', receipt => {
              console.log('receipt', receipt);
              Receipt.create(receipt).then(recipetResult => {
                entity.status = 'Complete';
                entity.receiptId = recipetResult._id;
                return updateTransaction(entity);
              });
              // we should persist these to keep a papertrail.
            })
            .on('confirmation', (confirmationNumber, receipt) => {
              console.info('confirmation', confirmationNumber, receipt);
            })

            .on('error', err => {
              entity.status = 'Error';
              console.log('sendSignedTransaction err', err);
              return updateTransaction(entity);
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
      console.log('balanceOf from err', err);
      entity.status = 'Error: Decrypting key';
      return updateTransaction(entity);
    });
  /* Check Balance End */
}

/**
 * validateTransaction checks single transactions
 *
 *
 *
 */

async function validateTransaction(entity) {
  console.log('validateTransaction', entity);

  /* ID Check */
  let fromWalletId = entity.from;
  // validate fromWalletId is 12-byte ObjectId value
  if(!fromWalletId.match(/^[0-9a-fA-F]{24}$/)) {
    console.log('Invalid wallet id!');
    entity.status = 'Error: Invalid wallet id!';
    return updateTransaction(entity);
  }
  /* ID Check End */

  let fromWallet = await Wallet.findOne({ _id: fromWalletId });
  if(!fromWallet) {
    console.log('Wallet doesn\'t exist!');
    entity.status = 'Error: Wallet does not exist!';
    return updateTransaction(entity);
  }

  /* ID Check */
  let toWalletId = entity.to;
  // validate toWalletId is 12-byte ObjectId value
  if(!toWalletId.match(/^[0-9a-fA-F]{24}$/)) {
    console.log('Invalid wallet id!');
    entity.status = 'Error: Invalid wallet id!';
    return updateTransaction(entity);
  }
  /* ID Check End */

  // find toWalletId in tms db
  let toWallet = await Wallet.findOne({ _id: toWalletId });
  if(!toWallet) {
    console.log('Wallet does not exist!');
    entity.status = 'Error: Wallet does not exist!';
    return updateTransaction(entity);
  }
  // set the amount to be transfered as a floating point number
  let amount = parseFloat(entity.amount);

  // verify the amount is greater than 0
  if(amount <= 0) {
    console.log('Token amount should not be equal to 0!');
    entity.status = 'token amount error!';
    return updateTransaction(entity);
  }

  // set floating point number to 2 decimal places
  amount = parseFloat(amount.toFixed(2));

  // calculate fee based
  // var fee = parseFloat(amount * config.percent / 100); // Fee to Revenue Wallet
  // trim fee to two decimal places
  // fee = parseFloat(fee.toFixed(2));
  //calculate total amount to be transfered
  //  let totalAmount = parseFloat(amount) + parseFloat(fee);
  let totalAmount = parseFloat(amount);
  // Check balance of fromWallet account
  contract.methods
    .balanceOf(fromWallet.address)
    .call({ from: config.contract.ownerAddress })
    .then(fromWalletBalance =>
      checkfromWallet(
        fromWalletBalance,
        toWallet,
        fromWallet,
        amount,
        totalAmount,
        entity
      )
    )
    .catch(err => {
      console.log('balaceof err', err);
      entity.status = 'Error: Decrypting key';
      return updateTransaction(entity);
    });
  /* Check Balance End */
}

async function checkfromWallet(
  fromWalletBalance,
  toWallet,
  fromWallet,
  amount,
  totalAmount,
  entity
) {
  // console.log('balanceOf result', fromWalletBalance);
  var balance = fromWalletBalance / Math.pow(10, config.contract.decimals);
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

  contract.methods
    .balanceOf(toWallet.address)
    .call({ from: config.contract.ownerAddress })
    .then(async function(balanceResult) {
      var toBalance = balanceResult / Math.pow(10, config.contract.decimals);

      var tokenAmount = new BigNumber(
        (amount * Math.pow(10, config.contract.decimals)).toString()
      );
      // var feeAmount = new BigNumber(
      //   (fee * Math.pow(10, config.contract.decimals)).toString()
      // );

      /*var privateKeyStr = stripHexPrefix(
        cryptr.decrypt(fromWallet.privateKey)
      );
      var privateKey = new Buffer(privateKeyStr, 'hex');*/

      var privateKeyStr = stripHexPrefix(cryptr.decrypt(fromWallet.privateKey));
      const privateKey = Buffer.from(privateKeyStr, 'hex');

      /* Supply Gas */
      // var txDataFee = contract.methods
      //   .transfer(config.revenueWallet.address, feeAmount)
      //   .encodeABI();
      var txData = contract.methods
        .transfer(toWallet.address, tokenAmount)
        .encodeABI();

      // console.log(
      //   'Fee Token Amount, Payment Token Amount',
      //   feeAmount,
      //   tokenAmount
      // );

      /* Estimate gas by doubling. Because sometimes, gas is not estimated correctly and transaction fails! */
      // var gasESTFee
      //   = 2
      //   * parseInt(
      //     await contract.methods
      //       .transfer(config.revenueWallet.address, feeAmount)
      //       .estimateGas({ gas: 450000 }),
      //     10
      //   );
      var gasEST
        = 2
        * parseInt(
          await contract.methods
            .transfer(toWallet.address, tokenAmount)
            .estimateGas({ gas: 450000 }),
          10
        );

      // var totalGas = new BigNumber(gasEST + gasESTFee);
      var totalGas = new BigNumber(gasEST);
      // console.log(
      //   'Fee Gas EST + Payment Gas EST = Total Gas EST',
      //   gasESTFee,
      //   gasEST,
      //   totalGas
      // );

      /* Calculate ideal gas */
      var gasPriceWeb3 = await web3.eth.getGasPrice();
      var gasPrice = new BigNumber(gasPriceGlobal);

      if(gasPrice.isLessThan(gasPriceWeb3)) {
        gasPrice = gasPriceWeb3;
      }
      /* Calculate ideal gas end */

      // console.log(`Gas Price Web 3 - ${gasPriceWeb3}`);

      var totalETH = new BigNumber(totalGas.times(gasPrice));
      // console.log(`Total ETH Estimated - ${totalETH}`);

      var ethAmount = new BigNumber(
        await web3.eth.getBalance(fromWallet.address)
      );
      // console.log(`Current ETH - ${ethAmount}`);

      var giveETH = 0;
      // var flag = false;

      if(totalETH.isGreaterThan(ethAmount)) {
        // flag = true;
        giveETH = new BigNumber(totalETH.minus(ethAmount));
      }

      // console.log(`Give ETH - ${giveETH}`);
      /* Supply Gas End */

      payGasAsETH(fromWallet.address, giveETH).then(result =>
        doTranscation(
          result,
          entity,
          fromWallet,
          gasPrice,
          gasEST,
          txData,
          privateKey,
          toBalance,
          amount
        )
      );
    })
    .catch(err => {
      console.log('balanceOf to err', err);
      entity.status = 'Error: Decrypting key';
      return updateTransaction(entity);
    });
}

async function doTranscation(
  result,
  entity,
  fromWallet,
  gasPrice,
  gasEST,
  txData,
  privateKey,
  toBalance,
  amount
) {
  console.log('payGasAsETH result', result);
  var nonce = await web3.eth
    .getTransactionCount(fromWallet.address)
    .catch(err => {
      console.log('Error occurred in getting transaction count!', err);
      entity.status = 'Error occurred in getting transaction count';
      return updateTransaction(entity);
    });

  // /* Send Fee */
  // var txParamsFee = {
  //   nonce: web3.utils.toHex(nonce),
  //   gasPrice: web3.utils.toHex(gasPrice),
  //   gasLimit: gasESTFee,
  //   from: fromWallet.address,
  //   to: contract._address,
  //   value: '0x00',
  //   chainId: config.chainId,
  //   data: txDataFee
  // };

  // var txFee = new Tx(txParamsFee);
  // txFee.sign(privateKey);

  // var serializedTxFee = txFee.serialize();

  // web3.eth
  //   .sendSignedTransaction(`0x${serializedTxFee.toString('hex')}`)
  //   .on('transactionHash', hash => {
  //     // should update mongo here
  //     console.log('transactionHash for tx Fee', hash);
  //   })
  //   .on('recipet', recipet => {
  //     // update mongo here
  //     console.log('recipet for tx fee', recipet);
  //   })
  //   .on('error', err => {
  //     console.log('sendSignedTransaction for tx fee err', err);
  //   });
  // /* Send Fee End */

  var rawTransaction = {
    nonce: web3.utils.toHex(nonce),
    gasPrice: web3.utils.toHex(gasPrice),
    gasLimit: gasEST,
    from: fromWallet.address,
    to: contract._address,
    value: '0x00',
    chainId: config.chainId,
    data: txData
  };

  var tx = new Tx(rawTransaction);
  tx.sign(privateKey);

  var serializedTx = tx.serialize();

  // var sent = false;
  web3.eth
    .sendSignedTransaction(`0x${serializedTx.toString('hex')}`)
    .once('transactionHash', hash => {
      toBalance = parseFloat(toBalance) + parseFloat(amount);
      entity.status = 'Pending';
      entity.hash = hash;
      return updateTransaction(entity);
    })
    .once('receipt', receipt => {
      Receipt.create(receipt).then(recipetResult => {
        entity.status = 'Complete';
        entity.receiptId = recipetResult._id;
        return updateTransaction(entity);
      });
    })
    .on('confirmation', (confirmationNumber, receipt) => {
      console.info('confirmation', confirmationNumber);
    })
    .on('error', err => {
      entity.status = 'Error';
      console.log('sendSignedTransaction err', err);
      return updateTransaction(entity);
    });
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

    console.log(`Gas Price - ${gasPrice}`);
    //var privateKeyStr = stripHexPrefix(config.networkWallet.privateKey);
    //var privateKey = new Buffer(privateKeyStr, 'hex');

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
