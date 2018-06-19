// const mongoose = require('mongoose');
// const bcrypt = require('bcrypt');
const Web3 = require('web3');
const Cryptr = require('cryptr');
const Wallet = require('./wallet/wallet.model');
const History = require('./history/history.model');

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
var gasPriceGlobal = new BigNumber(20000000000);

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

function handleWalletByOffset(index, items) {
  return new Promise((resolve, reject) => {
    Wallet.findOne({ userId: items[index].id }, function(err, wallet) {
      if(wallet || err) resolve(null);

      var account = web3.eth.accounts.create(web3.utils.randomHex(32));

      if(!account) resolve(null);

      Wallet.create(
        {
          userId: items[index].id,
          address: account.address,
          privateKey: cryptr.encrypt(account.privateKey)
        },
        function(err, wallet) {
          if(!err && wallet) {
            var temp = items[index];
            temp.walletId = wallet._id;
            temp.walletAddress = wallet.address;
            temp.privateKey = wallet.privateKey;

            resolve(temp);
          } else {
            console.log(err);
            reject(err);
          }
        }
      );
    });
  });
}

function handleNextWalletDB(index, items) {
  return handleWalletByOffset(index, items)
    .then(result => {
      if(result) importedWallets.push(result);

      index++;
      if(index < items.length) {
        return handleNextWalletDB(index, items);
        /* Process Data End */
      } else {
        return Promise.resolve();
      }
    })
    .catch(err => {
      console.log('handleNextWalletDB err', err);
      Promise.reject(err);
    });
}

function handleWalletDB(items) {
  return handleNextWalletDB(0, items)
    .then(() => Promise.resolve())
    .catch(err => {
      console.log('handleWalletDB err', err);
      Promise.reject(err);
    });
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

      const privateKey = Buffer.from(config.networkWallet.privateKey, 'hex');

      var nonce = await web3.eth
        .getTransactionCount(config.networkWallet.address)
        .catch(error => {
          console.log('getTransactionCount error', error);
          reject();
        });

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
        .then(receipt => {
          console.log('sendSignedTransaction receipt', receipt);
          resolve();
        })
        .catch(err => {
          console.log('sendSignedTransaction error', err);
          reject(err);
        });
    }
  });
}

// added for health check
export async function index(req, res) {
  return res.sendStatus(200);
}

export async function system(req, res) {
  // var key = '';
  // if(req.headers['x-api-key']) key = req.headers['x-api-key'];

  // if(key != config.key) {
  //   return res.send({ status: false, msg: 'You are not authorised!' });
  // }

  if(!req.body.action) {
    return res.send({ status: false, msg: 'Undefined action!' });
  }

  var action = req.body.action;

  if(action != 'on' && action != 'off') {
    return res.send({ status: false, msg: 'Undefined action!' });
  }

  if(action == 'on') {
    flag = true;
    return res.send({ status: true, msg: 'System is turned on!' });
  } else {
    flag = false;
    return res.send({ status: true, msg: 'System is turned off!' });
  }
}
export async function ownerTokenBalance(req, res) {
  // /* Auth Begin */
  // var msg = checkAuth(req);
  // if(msg != '') return res.send({ status: false, msg });
  // /* Auth End */

  contractObj.methods
    .balanceOf(config.contract.ownerAddress)
    .call({ from: config.contract.ownerAddress })
    .then(function(result) {
      var balance = result / Math.pow(10, config.contract.decimals);

      return res.send({ status: true, balance });
    })
    .catch(err => res.status(400).send({ status: false, msg: err }));
}
export async function holderTokenBalance(req, res) {
  // /* Auth Begin */
  // var msg = checkAuth(req);
  // if(msg != '') return res.send({ status: false, msg });
  // /* Auth End */

  if(!req.body.address) {
    return res.send({ status: false, msg: 'Address is missing!' });
  }

  var address = req.body.address;

  if(!ethereumAddress.isAddress(address)) {
    return res.send({ status: false, msg: 'Invalid address!' });
  }

  contractObj.methods
    .balanceOf(address)
    .call({ from: config.contract.ownerAddress })
    .then(function(result) {
      var balance = result / Math.pow(10, config.contract.decimals);

      return res.send({ status: true, balance });
    })
    .catch(err => res.status(400).send({ status: false, msg: err }));
}
export async function walletTokenBalance(req, res) {
  // /* Auth Begin */
  // var msg = checkAuth(req);
  // if(msg != '') return res.send({ status: false, msg });
  // /* Auth End */

  if(!req.body.walletId) {
    return res.send({ status: false, msg: 'Wallet ID is missing!' });
  }

  var walletId = req.body.walletId;
  if(!walletId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.send({ status: false, msg: 'Invalid wallet id!' });
  }

  var wallet = await Wallet.findOne({ _id: walletId });

  if(!wallet) {
    return res.send({ status: false, msg: 'Wallet doesn\'t exist!' });
  }

  contractObj.methods
    .balanceOf(wallet.address)
    .call({ from: config.contract.ownerAddress })
    .then(result => {
      var balance = result / Math.pow(10, config.contract.decimals);

      return res.status(200).send({ status: true, balance });
    })
    .catch(err => res.status(400).send({ status: false, msg: err }));
}

export async function wallet(req, res) {
  // /* Auth Begin */
  // var msg = checkAuth(req);
  // if(msg != '') return res.send({ status: false, msg });
  // /* Auth End */

  if(!req.body.userId) {
    return res.send({ status: false, msg: 'User is missing!' });
  }

  var wallet = await Wallet.findOne({ userId: req.body.userId });

  if(wallet) {
    return res.send({
      status: false,
      msg: 'Already registered!',
      walletId: wallet._id
    });
  }

  var account = web3.eth.accounts.create(web3.utils.randomHex(32));

  if(!account) {
    return res.send({
      status: false,
      msg: 'Error occurred in creating new account!'
    });
  }

  Wallet.create(
    {
      userId: req.body.userId,
      address: account.address,
      privateKey: cryptr.encrypt(account.privateKey)
    },
    function(err, wallet) {
      if(err) {
        return res.send({
          status: false,
          msg: 'Error occurred in creating wallet!'
        });
      }

      return res.send({
        status: true,
        msg: 'Wallet created successfully!',
        walletId: wallet._id,
        walletAddress: account.address
      });
    }
  );
}
export async function withdraw(req, res) {
  // /* Auth Begin */
  // var msg = checkAuth(req);
  // if(msg != '') return res.send({ status: false, msg });
  // /* Auth End */

  if(!req.body.address || !req.body.walletId) {
    return res.send({ status: false, msg: 'Parameters are missing!' });
  }

  var walletId = req.body.walletId;
  if(!walletId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.send({ status: false, msg: 'Invalid wallet ID!' });
  }

  var wallet = await Wallet.findOne({ _id: walletId });
  var address = req.body.address;
  var amount = 0;

  if(!ethereumAddress.isAddress(address)) {
    return res.send({ status: false, msg: 'Invalid address!' });
  }

  if(req.body.tokenAmount && !isNaN(req.body.tokenAmount)) {
    amount = parseFloat(req.body.tokenAmount);

    if(amount == 0) {
      return res.send({ status: false, msg: 'Invalid amount value!' });
    }
  }

  if(!wallet) {
    return res.send({ status: false, msg: 'Wallet doesn\'t exist!' });
  }

  contractObj.methods
    .balanceOf(wallet.address)
    .call({ from: config.contract.ownerAddress })
    .then(async function(result) {
      var balance = result / Math.pow(10, config.contract.decimals);

      if(balance == 0) {
        return res.send({ status: false, msg: 'Nothing to withdraw!' });
      }

      if(amount != 0 && amount > balance) {
        return res.send({
          status: false,
          msg: 'Check your balance and withdraw amount!'
        });
      }

      if(amount == 0) amount = balance;

      var tokenAmount = new BigNumber(
        (amount * Math.pow(10, config.contract.decimals)).toString()
      );

      var txData = contractObj.methods
        .transfer(address, tokenAmount)
        .encodeABI();
      var privateKeyStr = stripHexPrefix(cryptr.decrypt(wallet.privateKey));
      var privateKey = new Buffer(privateKeyStr, 'hex');

      /* Supply Gas */
      var ethAmount = new BigNumber(await web3.eth.getBalance(wallet.address));
      var gasPrice = await web3.eth.getGasPrice();

      var remainingGas = new BigNumber(ethAmount / gasPrice);

      /* Estimate gas by doubling. Because sometimes gas is estimated incorrectly and transaction fails. */
      var totalGasT
        = 2
        * parseInt(
          await contractObj.methods
            .transfer(address, tokenAmount)
            .estimateGas({ gas: 450000 })
        );
      var totalGas = new BigNumber(totalGasT);

      var remainingETH = parseFloat(remainingGas / Math.pow(10, 9));
      var totalETH = parseFloat(totalGas / Math.pow(10, 9));

      var giveETH = 0;
      var flag = false;

      if(remainingETH < totalETH) {
        giveETH = new BigNumber(totalGas.minus(remainingGas) * gasPrice);
        flag = true;
      }
      /* Supply Gas */

      console.log(`giveETH - ${giveETH}`);

      /* Promise Start */
      payGasAsETH(wallet.address, giveETH, flag).then(
        async function(result) {
          /* Withdraw Tokens */
          var nonce = await web3.eth
            .getTransactionCount(wallet.address)
            .catch(error =>
              res.send({
                status: false,
                msg: 'Error occurred in getting transaction count!'
              })
            );

          var txParams = {
            nonce: web3.utils.toHex(nonce),
            gasPrice: web3.utils.toHex(gasPrice),
            gasLimit: totalGasT,
            from: wallet.address,
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
            .on('transactionHash', hash => {
              balance = parseFloat(balance) - parseFloat(amount);
              History.create(
                {
                  from: wallet._id,
                  to: address,
                  amount: tokenAmount,
                  hash,
                  action: 'export'
                },
                async function(err, history) {
                  sent = true;

                  if(err) {
                    return res.send({
                      status: false,
                      msg: 'Error occurred in saving history!'
                    });
                  }

                  return res.send({
                    status: true,
                    hash,
                    balance
                  });
                }
              );
            })
            .on('receipt', receipt => {
              // we should persist these to keep a papertrail.
              console.log('withdraw receipt', receipt);
            })
            .on('error', err => {
              console.log('withdraw err', err);
              if(!sent) return res.send({ status: false, msg: err.message });
            });
        },
        err => res.send({ status: false, msg: err.message })
      );
      /* Promise End */
    })
    .catch(err => res.status(400).send({ status: false, msg: err }));
}
export async function batchWallet(req, res) {
  // /* Auth Begin */
  // var msg = checkAuth(req);
  // if(msg != '') return res.send({ status: false, msg });
  // /* Auth End */

  if(!req.body.users) {
    return res.send({ status: false, msg: 'Users are missing!' });
  }

  var users = [];
  try {
    users = JSON.parse(req.body.users);
  } catch(e) {
    console.log('Users are missing!');
    return res.send({ status: false, msg: 'Users are missing!' });
  }

  if(users.length == 0) {
    return res.send({ status: false, msg: 'Users are missing!' });
  }

  handleWalletDB(users)
    .then(() => {
      var newItems = importedWallets;
      importedWallets = [];

      if(newItems.length == 0) {
        return res.send({ status: false, msg: 'Nothing to import!' });
      }

      return res.send({ status: true, items: newItems });
    })
    .catch(err => res.status(400).send({ status: false, msg: err }));
}

export async function batchRequest(req, res) {
  if(!req.body.fromWalletId) {
    return res
      .status(400)
      .send({ status: false, msg: 'Parameters are missing!' });
  }

  var items = req.body.items;

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
  contractObj.methods
    .balanceOf(fromWallet.address)
    .call({ from: config.contract.ownerAddress })
    .then(async function(result) {
      var batch = new web3.BatchRequest();
      var balance = result / Math.pow(10, config.contract.decimals);

      var nonce = await web3.eth
        .getTransactionCount(fromWallet.address)
        .catch(error => {
          console.log('Error occurred in getting transaction count!');
          return res.status(400).send({
            status: false,
            msg: 'Error occurred in getting transaction count!'
          });
        });

      var privateKeyStr = stripHexPrefix(cryptr.decrypt(fromWallet.privateKey));
      const privateKey = Buffer.from(privateKeyStr, 'hex');

      /* Calculate ideal gas */
      var gasPriceWeb3 = await web3.eth.getGasPrice();
      var gasPrice = new BigNumber(gasPriceGlobal);

      if(gasPrice.isLessThan(gasPriceWeb3)) gasPrice = gasPriceWeb3;
      /* Calculate ideal gas end */

      var processed = 0; // Total count of transactions that have been processed in real.

      var newItems = [];

      for(var i in items) {
        // console.log('i', items[i]);
        /* Begin For */
        if(items[i].action != 'spent') {
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

        var tempResult = await contractObj.methods
          .balanceOf(toWallet.address)
          .call({ from: config.contract.ownerAddress });
        var tempBalance = tempResult / Math.pow(10, config.contract.decimals);

        var amount = parseFloat(items[i].amount);
        var amountFee = parseFloat(amount * config.percent / 100);
        var totalAmount = amount + amountFee;

        items[i].balance = parseFloat(tempBalance) + amount; //Fresh Balance

        if(totalAmount > balance) continue;

        balance -= totalAmount;

        newItems.push(items[i]);
      } /* End For */

      if(newItems.length == 0) {
        console.log('Nothing to process!');
        return res
          .status(400)
          .send({ status: false, msg: 'Nothing to process!' });
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
              .estimateGas({ gas: 450000 })
          );
        var tempGasFee
          = 2
          * parseInt(
            await contractObj.methods
              .transfer(config.revenueWallet.address, tokenAmountFee)
              .estimateGas({ gas: 450000 })
          );

        totalGas = totalGas.plus(tempGas);
        totalGas = totalGas.plus(tempGasFee);

        newItems[i].gas = tempGas;
        newItems[i].gasFee = tempGasFee;
        newItems[i].tokenAmount = tokenAmount;
        newItems[i].tokenAmountFee = tokenAmountFee;
      }

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
      payGasAsETH(fromWallet.address, giveETH, flag)
        .then(
          async function(result) {
            for(var i in newItems) {
              /* Begin For */
              var tokenAmount = new BigNumber(newItems[i].tokenAmount);
              var tokenAmountFee = new BigNumber(newItems[i].tokenAmountFee);
              var gas = newItems[i].gas;
              var gasFee = newItems[i].gasFee;

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

              var transaction = web3.eth.sendSignedTransaction.request(
                `0x${serializedTx.toString('hex')}`,
                'transactionHash',
                function(err, hash) {
                  processed++;

                  if(err) {
                    newItems[processed - 1].status = 'notprocessed';
                  } else {
                    newItems[processed - 1].status = 'processed';
                    newItems[processed - 1].hash = hash;

                    console.log('newItems[processed - 1]', newItems);

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
                      hash,
                      queueId: newItems[processed - 1].queueId
                    })
                      .then(result => {
                        console.log('Transaction create result', result);
                      })
                      .catch(err => {
                        console.log('Transaction create err', err);
                      });
                    delete newItems[processed - 1].toWallet;
                    // History.create({
                    //   from: fromWallet._id,
                    //   to: newItems[processed - 1].toWallet._id,
                    //   amount: newItems[processed - 1].tokenAmount,
                    //   hash,
                    //   action: 'spent'
                    // })
                    //   .then(result => {
                    //     console.log('History create result', result);
                    //   })
                    //   .catch(err => {
                    //     console.log('err', err);
                    //   });
                  }

                  if(processed == newItems.length) {
                    return res.send({
                      status: true,
                      items: newItems,
                      balance
                    });
                  }
                }
              );

              batch.add(transaction);
            } /* End For */

            batch.execute();
          },
          function(err) {
            console.log('err', err);
            return res.status(400).send({ status: false, msg: err.message });
          }
        )
        .catch(err => {
          console.log('err', err);
          res.status(400).send({ status: false, msg: err });
        });
      /* Promise End */
    })
    .catch(err => {
      console.log('err', err);
      res.status(400).send({ status: false, msg: err });
    });
  /* Check Balance End */
}

export async function transferTokensInternally(req, res) {
  // /* Auth Begin */
  // var msg = checkAuth(req);
  // if(msg != '') return res.send({ status: false, msg });
  // /* Auth End */
  //console.log('req.body', req.body);
  if(
    !req.body.fromWalletId
    || !req.body.toWalletId
    || !req.body.tokenAmount
    || isNaN(req.body.tokenAmount)
  ) {
    return res.send({ status: false, msg: 'Incorrect parameters!' });
  }

  /* ID Check */
  var fromWalletId = req.body.fromWalletId;
  // validate fromWalletId is 12-byte ObjectId value
  if(!fromWalletId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.send({ status: false, msg: 'Invalid wallet id!' });
  }
  /* ID Check End */

  var fromWallet = await Wallet.findOne({ _id: fromWalletId });
  if(!fromWallet) {
    return res.send({ status: false, msg: 'Wallet doesn\'t exist!' });
  }

  /* ID Check */
  var toWalletId = req.body.toWalletId;
  // validate toWalletId is 12-byte ObjectId value
  if(!toWalletId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.send({ status: false, msg: 'Invalid wallet id!' });
  }
  /* ID Check End */

  // find toWalletId in tms db
  var toWallet = await Wallet.findOne({ _id: toWalletId });
  if(!toWallet) {
    return res.send({ status: false, msg: 'Wallet doesn\'t exist!' });
  }
  // set the amount to be transfered as a floating point number
  var amount = parseFloat(req.body.tokenAmount);

  // verify the amount is greater that 0
  if(amount == 0) {
    return res.send({
      status: false,
      msg: 'Token amount shouldn\'t be equal to 0!'
    });
  }

  // set floating point number to 2 decimal places
  amount = parseFloat(amount.toFixed(2));
  // calculate fee based
  var fee = parseFloat(amount * config.percent / 100); // Fee to Revenue Wallet
  // trim fee to two decimal places
  fee = parseFloat(fee.toFixed(2));
  //calculate total amount to be transfered
  var totalAmount = parseFloat(amount) + parseFloat(fee);

  // Check balance of fromWallet account
  contractObj.methods
    .balanceOf(fromWallet.address)
    .call({ from: config.contract.ownerAddress })
    .then(async result => {
      // console.log('result', result);
      var balance = result / Math.pow(10, config.contract.decimals);
      // check if balance is 0
      // console.log('balance', balance);
      if(balance === 0) {
        console.log('err', 'Nothing to transfer!');
        return res
          .status(400)
          .send({ status: false, msg: 'Nothing to transfer!' });
      }
      // check if totalAmount is greater than balance and reject if true
      if(totalAmount > balance) {
        console.log('err', 'Insufficient balance!');
        return res
          .status(400)
          .send({ status: false, msg: 'Insufficient balance!' });
      }

      contractObj.methods
        .balanceOf(toWallet.address)
        .call({ from: config.contract.ownerAddress })
        .then(async function(result) {
          var toBalance = result / Math.pow(10, config.contract.decimals);

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
            'toWallet.address, tokenAmount',
            toWallet.address,
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
          console.log(
            'toWallet.address, tokenAmount',
            toWallet.address,
            tokenAmount
          );
          var gasEST
            = 2
            * parseInt(
              await contractObj.methods
                .transfer(toWallet.address, tokenAmount)
                .estimateGas({ gas: 450000 })
            );
          console.log('gasESTFee', gasESTFee);
          var totalGas = new BigNumber(gasEST + gasESTFee);

          var ethAmount = new BigNumber(
            await web3.eth.getBalance(fromWallet.address)
          );
          var gasPrice = await web3.eth.getGasPrice();

          console.log(`gasPrice - ${gasPrice}`);

          var remainingGas = new BigNumber((ethAmount / gasPrice).toString());
          // console.log('remainingGas - ' + remainingGas);
          var remainingETH = parseFloat(remainingGas / Math.pow(10, 9));
          var totalETH = parseFloat(totalGas / Math.pow(10, 9));

          var giveETH = 0;
          var flag = false;

          if(remainingETH < totalETH) {
            // need to supply gas
            giveETH = new BigNumber(totalGas.minus(remainingGas) * gasPrice);

            flag = true;
          }

          console.log(`giveETH - ${giveETH}`);
          /* Supply Gas End */

          /* Promise Start */
          payGasAsETH(fromWallet.address, giveETH, flag).then(
            async function(result) {
              var nonce = await web3.eth
                .getTransactionCount(fromWallet.address)
                .catch(error =>
                  res.send({
                    status: false,
                    msg: 'Error occurred in getting transaction count!'
                  })
                );

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
                  console.log('transactionHash', hash);
                })
                .on('recipet', recipet => {
                  console.log('recipet', recipet);
                })
                .on('error', err => {
                  console.log('sendSignedTransaction err', err);
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

                  History.create({
                    from: fromWallet._id,
                    to: toWallet._id,
                    amount: tokenAmount,
                    hash,
                    action: 'spent'
                  })
                    .then(result =>
                      res.status(201).send({
                        status: true,
                        hash,
                        fromBalance,
                        toBalance
                      })
                    )
                    .catch(err => {
                      console.log('err', err);
                      return res.status(400).send({
                        status: false,
                        msg: 'Error occurred in saving history!'
                      });
                    });
                })
                .on('receipt', receipt => {
                  // we should persist these to keep a papertrail.
                  console.log('receipt', receipt);
                })
                .on('error', err => {
                  if(!sent) console.log('err', err);
                  console.log('err', err);
                  return res
                    .status(400)
                    .send({ status: false, msg: err.message });
                });
            },
            function(err) {
              console.log('err', err);
              return res.status(400).send({ status: false, msg: err.message });
            }
          );
          /* Promise End */
        })
        .catch(err => {
          console.log('err', err);
          res.status(400).send({ status: false, msg: err });
        });
    })
    .catch(err => {
      console.log('err', err);
      res.status(400).send({ status: false, msg: err });
    });
  /* Check Balance End */
}
export async function history(req, res) {
  // /* Auth Begin */
  // var msg = checkAuth(req);
  // if(msg != '') return res.send({ status: false, msg });
  // /* Auth End */

  if(!req.body.walletId) {
    return res.send({ status: false, msg: 'Wallet is missing!' });
  }

  var walletId = req.body.walletId;
  var history = await History.find({
    $or: [{ from: walletId }, { to: walletId }]
  });

  return res.send({ status: true, history });
}
