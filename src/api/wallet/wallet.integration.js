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
import Wallet from './wallet.model';
import request from 'supertest';
import config from '../../config/environment';

import mongoose from 'mongoose';

import ethereumAddress from 'ethereum-address';

describe('Wallet API:', () => {
  var wallet;

  // Clear wallets before testing
  before(() =>
    Wallet.remove().then(() => {
      wallet = new Wallet({});

      return wallet.save();
    })
  );

  // Clear wallets after testing
  after(() => Wallet.remove());

  describe('POST /api/wallets', () => {
    it('should respond with a wallet profile when authenticated', done => {
      request(app)
        .post('/wallets')
        .set('x-api-key', `${config.key}`)
        .send({ userId: '123' })
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
        .post('/wallets')
        .set('x-api-key', 'abc123')
        .send({ userId: '123' })
        .expect(401)
        .end(done);
    });
  });
});
