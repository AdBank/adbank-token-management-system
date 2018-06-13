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

import app from '../..';
import Transaction from './transaction.model';
import Wallet from '../wallet/wallet.model';
import request from 'supertest';
import config from '../../config/environment';

import mongoose from 'mongoose';

import ethereumAddress from 'ethereum-address';

async function genWallet() {
  return await Wallet.create(
    {
      _id: '5b17f7a059ca190014773f8c',
      userId: '1',
      address: '0xcad96402cB0612C173e850DFfe60c0a606c9fEB7',
      privateKey:
        '3e90e479c03d2948f2609d2657a3ce4d37838ea742ddbcdf817c04e2604d6691c741f8f995cc58694db60179f9e4eeea702e39519289aa36b626071cb2460c86ce4fb8a0ef1ee446f14d9a98cf06118e'
    },
    {
      _id: '5b17f7b559ca19001477408e',
      userId: '2',
      address: '0x69833CF0D1324aA939EaF0AD2424ECcCc3d03D73',
      privateKey:
        'f8d756728853484c828e03901044aa55ced992f21edc3841dac30e265a39af09f609327a8e00ad0a7d188b84ce40246f25a9fe99fbf5f7da3fa08a05f378349a31896c775b3ab39142693a668f9369e2'
    }
  );
}

describe('Transaction API:', () => {
  var transaction;

  // Clear transactions before testing
  before(() =>
    Transaction.remove()
      .then(() => {
        // transaction = new Transaction({});
        // return transaction.save();
        return;
      })
      .then(Wallet.remove())
      .catch(err => console.log('before err', err))
  );

  // Clear transactions after testing
  after(() => Transaction.remove());

  describe('POST /api/v1/transactions', () => {
    it('should respond with a transaction profile when authenticated', done => {
      request(app)
        .post('/api/v1/transactions')
        .set('x-api-key', `${config.key}`)
        .send({
          account: 1,
          txId: '5b17f7a059ca190014773f8d',
          from: '5b17f7a059ca190014773f8c',
          to: '5b17f7b559ca19001477408e',
          amount: '1000'
        })
        .expect(201)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          // console.log('res', res.body);
          expect(mongoose.Types.ObjectId.isValid(res.body._id)).to.equal(true);
          expect(mongoose.Types.ObjectId.isValid(res.body.from)).to.equal(true);
          expect(mongoose.Types.ObjectId.isValid(res.body.to)).to.equal(true);
          expect(res.body.amount).to.equal(1000);
          done();
        });
    });

    it('should respond with a 401 when not authenticated', done => {
      request(app)
        .post('/api/v1/transactions')
        .set('x-api-key', 'abc123')
        .send()
        .expect(401)
        .end(done);
    });
  });
});
