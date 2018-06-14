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
      address: '0x01913950144EDd792d392eF76C2fC178f45638d6',
      privateKey:
        'be1dff8a579b278e3c96aaca82b78a36ce5cc409a8a8a477c7d1f6a5792c3dbf23c73b2449e5b8e714c8a4f614cacfaba1cb08878a2b973042727b6f78130878d2d1d43341a50bd1c6aa5dca1b877697'
    },
    {
      _id: '5b17f7b559ca19001477408e',
      userId: '2',
      address: '0x855c85C8eFdcb23f082bB5C75A3d7ceff92c230B',
      privateKey:
        'da72b8ebc79b934c36a6ad0f98458dca54d6c7362e236cdcef1bdb99cde06f5a'
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
    it('should respond with a transaction when authenticated', done => {
      request(app)
        .post('/api/v1/transactions')
        .set('x-api-key', `${config.key}`)
        .send({
          account: 1,
          txId: '5b17f7a059ca190014773f8d',
          from: '5b17f7a059ca190014773f8c',
          to: '5b17f7b559ca19001477408e',
          amount: '1000',
          status: 'starting'
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

  describe('GET /api/v1/transactions/:id', () => {
    it('should respond with a 503 error when authenticated', done => {
      request(app)
        .get('/api/v1/transactions/1')
        .set('x-api-key', `${config.key}`)
        .expect(200)
        .end(done);
    });

    it('should respond with a 401 error when wrong authentication is set', done => {
      request(app)
        .get('/api/v1/transactions/1')
        .set('x-api-key', '123123123')
        .expect(401)
        .end(done);
    });
  });
});
