'use strict';

const chai = require('chai');

// Load Chai assertions
const expect = chai.expect;
chai.should();

// Initialize Chai plugins
chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));
chai.use(require('chai-things'));

// // import io from 'socket.io-client';
// import Promise from 'bluebird';
// var join = Promise.join;

import app from '../index';
import Transaction from './transaction/transaction.model';
// import Wallet from './wallet/wallet.model';
import request from 'supertest';
import config from '../config/environment';
import nats from '../config/nats';
// import mongoose from 'mongoose';
// import ethereumAddress from 'ethereum-address';

// async function genWallet() {
//   let promises = [];

//   let walletPromise = Wallet.create(
//     {
//       userId: '1',
//       address: '0x01913950144EDd792d392eF76C2fC178f45638d6',
//       privateKey:
//         'be1dff8a579b278e3c96aaca82b78a36ce5cc409a8a8a477c7d1f6a5792c3dbf23c73b2449e5b8e714c8a4f614cacfaba1cb08878a2b973042727b6f78130878d2d1d43341a50bd1c6aa5dca1b877697'
//     },
//     {
//       userId: '2',
//       address: '0xC8443418c1D1a74b4984E60a31fA85fdD8328c31',
//       privateKey:
//         'bca5bfea37978f48ea407312470e147ef215fe68c3de4f100fd9c58247878e9074ce7762111cc97933217c3efdd50c4ac04ed6b1e69a4d0f016375563b2b75ef'
//     },

//     {
//       userId: '3',
//       address: '0x570D675E696d54f3815b5aD13639893C3a87ab67',
//       privateKey:
//         '8eb150cb35856dc5281e9da1ca6b3d20ed4b75ec568b5e1397c5c52b418467071757b65bb22415156841edfbf2ac3d95096bf44eada98a03908de1fdd995af4b584c0550d8f8d10d4fad977db7754eec'
//     }
//   )
//     .then(() => console.log('[SEED] finished populating wallets'))
//     .catch(err => console.log('[SEED] error populating wallets', err));

//   promises.push(walletPromise);
//   return Promise.all(promises);
// }

describe('Batch Transaction API:', () => {
  var transaction;

  // Clear transactions before testing
  //before(() =>
  // Transaction.remove()
  // .then(() => genWallet())
  // .catch(err => console.log('before err', err))
  //);

  // Clear transactions after testing
  after(() => Transaction.remove());

  describe('POST /batchRequest', () => {
    it('should respond with a transaction when authenticated', done => {
      request(app)
        .post('/batchRequest')
        .set('x-api-key', `${config.key}`)
        .send({
          fromWalletId: '5b17f7a059ca190014773f8c',
          items:
            '[{"_id":"5b3d295f74d4e37ae24d7156","account":"1","sender":"advertiser test advertiser","receiver":"3 pub","from":"5b17f7a059ca190014773f8c","to":"5b3d27d808f3ec784b1d9548","status":"Starting","action":"Spent","amount":5,"queueId":"5b3d295474d4e37ae24d7154","createdAt":"2018-07-04T20:09:03.778Z","updatedAt":"2018-07-04T20:09:03.778Z","__v":0},{"_id":"5b3d295f74d4e37ae24d7157","account":"1","sender":"advertiser test advertiser","receiver":"publisher test publisher","from":"5b17f7a059ca190014773f8c","to":"5b17f7b559ca19001477408e","status":"Starting","action":"Spent","amount":6,"queueId":"5b3d295a74d4e37ae24d7155","createdAt":"2018-07-04T20:09:03.778Z","updatedAt":"2018-07-04T20:09:03.778Z","__v":0}]'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if(err) {
            console.log('err', err);
            done(err);
          }

          // sets the listener to capture events from tms only for this specific account though.
          nats.subscribe(`transaction.save.${config.account}`, msg => {
            console.log('msg', msg);
          });

          // done();
        });
    }).timeout(100000);
  });
});
