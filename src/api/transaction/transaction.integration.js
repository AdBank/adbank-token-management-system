'use strict';

const chai = require('chai');

// Load Chai assertions
// const expect = chai.expect;
chai.should();

// Initialize Chai plugins
chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));
chai.use(require('chai-things'));

import app from '../..';

import request from 'supertest';
import config from '../../config/environment';
import nats from '../../config/nats';

describe('Transaction API:', () => {
  describe('POST /api/v1/transactions', () => {
    it('should respond with a transaction when authenticated', done => {
      let completeCount = 0;
      // sets the listener to capture events from tms only for this specific account though.
      nats.subscribe(`transaction.save.${config.account}`, msg => {
        console.log('[test] transaction.save', msg._id, msg.status);
        if(msg.status === 'Pending') {
          console.info(
            'transactionHash',
            `https://ropsten.etherscan.io/tx/${msg.hash}`
          );
        }
        if(msg.status === 'Complete') {
          completeCount++;
        }
        if(completeCount === 1) {
          done();
        }
      });

      request(app)
        .post('/api/v1/transactions')
        .set('x-api-key', `${config.key}`)
        .send({
          sender: 'advertiser test advertiser',
          receiver: 'publisher test publisher',
          account: 1,
          txId: '5b3f75936012a42a994a6cbb',
          from: '5b17f7a059ca190014773f8c',
          to: '5b17f7b559ca19001477408e',
          amount: 1
        })
        .expect(201)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if(err) {
            done(err);
          }
          console.log('res', res.body._id);
        });
    }).timeout(200000);


    describe('POST /api/v1/transactions', () => {
      it('should respond with a transaction when authenticated', done => {
        let completeCount = 0;
        // sets the listener to capture events from tms only for this specific account though.
        nats.subscribe(`transaction.save.${config.account}`, msg => {
          console.log('[test] transaction.save', msg._id, msg.status);
          if(msg.status === 'Pending') {
            console.info(
              'transactionHash',
              `https://ropsten.etherscan.io/tx/${msg.hash}`
            );
          }
          if(msg.status === 'Complete') {
            completeCount++;
          }
          if(completeCount === 1) {
            done();
          }
        });

        request(app)
          .post('/api/v1/transactions')
          .set('x-api-key', `${config.key}`)
          .send({
            sender: 'advertiser test advertiser',
            receiver: 'publisher test publisher',
            account: 1,
            txId: '5b3f75936012a42a994a6cbb',
            from: '5b17f7a059ca190014773f8c',
            to: '5b17f7b559ca19001477408e',
            amount: 1
          })
          .expect(201)
          .expect('Content-Type', /json/)
          .end((err, res) => {
            if(err) {
              done(err);
            }
            console.log('res', res.body._id);
          });
      }).timeout(200000);


  });
});
