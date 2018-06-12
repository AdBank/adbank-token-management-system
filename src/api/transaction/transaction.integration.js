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
  return await Wallet.create({});
}

describe('Transaction API:', () => {
  var transaction;

  // Clear transactions before testing
  before(() =>
    Transaction.remove()
      .then(() => {
        transaction = new Transaction({});
        return transaction.save();
      })
      .then(Wallet.remove())
      .then(genWallet)
      .then(genWallet)
  );

  // Clear transactions after testing
  after(() => Transaction.remove());

  describe('POST /api/v1/transactions', () => {
    it('should respond with a transaction profile when authenticated', done => {
      request(app)
        .post('/api/v1/transactions')
        .set('x-api-key', `${config.key}`)
        .send({
          fromWalletId: '1',
          toWalletId: '2',
          tokenAmount: '100'
        })
        .expect(201)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if(err) {
            done(err);
          }
          expect(mongoose.Types.ObjectId.isValid(res.body._id)).to.equal(true);
          expect(ethereumAddress.isAddress(res.body.address)).to.equal(true);
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
