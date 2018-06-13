'use strict';

import Wallet from './wallet.model';
import Web3 from 'web3';
import config from '../../config/environment';
import abi from '../../config/abi.json';
import Cryptr from 'cryptr';

/* Web3 Initialization */
var web3 = new Web3(new Web3.providers.HttpProvider(config.web3.rpc.provider));
/* Contract Initialization */
var contractObj = new web3.eth.Contract(abi, config.contract.address);
contractObj.options.from = config.contract.ownerAddress;

var cryptr = new Cryptr('AdBankTokenNetwork');

/**
 * @api {post} /api/v1/wallets Create a watllet
 * @apiVersion 1.0.0
 * @apiName Create
 * @apiGroup Wallet
 * @apiPermission authenticated user
 *
 * @apiParam (Request body) {String} userId The userId of the wallet owner
 *
 * @apiExample {js} Example usage:
 * const data = {
 *   "userId": "123"
 * }
 *
 * $http.defaults.headers.common["Authorization"] = token;
 * $http.post(url, data)
 *   .success((res, status) => doSomethingHere())
 *   .error((err, status) => doSomethingHere());
 *
 * @apiSuccess (Success 201) {String} message Task saved successfully!
 * @apiSuccess (Success 201) {String} id The campaign id
 *
 * @apiSuccessExample {json} Success response:
 *     HTTPS 201 OK
 *     {
 *      "message": "Task saved successfully!",
 *      "id": "57e903941ca43a5f0805ba5a"
 *    }
 *
 * @apiUse UnauthorizedError
 */

export async function create(req, res) {
  if (!req.body.userId) {
    return res.status(400).send({ status: false, msg: 'User is missing!' });
  }

  let result = await Wallet.findOne({ userId: req.body.userId });
  if (result) {
    return res.status(400).send({
      status: false,
      msg: 'Already registered!',
      _id: result._id
    });
  }

  let account = web3.eth.accounts.create(web3.utils.randomHex(32));

  if (!account) {
    return res.status(400).send({
      status: false,
      msg: 'Error occurred in creating new account!'
    });
  }

  Wallet.create({
    userId: req.body.userId,
    address: account.address,
    privateKey: cryptr.encrypt(account.privateKey)
  })
    .then(wallet =>
      res.status(201).send({
        _id: wallet._id,
        address: account.address
      })
    )
    .catch(err => {
      console.log('create wallet err', err);
      res.status(400).send({
        status: false,
        msg: 'Error occurred in creating wallet!'
      });
    });
}

export async function walletTokenBalance(req, res) {
  /* Auth Begin */
  var msg = checkAuth(req);
  if (msg != '') return res.send({ status: false, msg });
  /* Auth End */

  if (!req.body.walletId) {
    return res.send({ status: false, msg: 'Wallet ID is missing!' });
  }

  var walletId = req.body.walletId;
  if (!walletId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.send({ status: false, msg: 'Invalid wallet id!' });
  }

  var wallet = await Wallet.findOne({ _id: walletId });

  if (!wallet) {
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
