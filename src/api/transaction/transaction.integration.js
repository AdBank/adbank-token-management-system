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
  //   var transaction;

  //   // Clear transactions before testing
  //   before(() =>
  //     Transaction.remove()
  //       .then(Wallet.remove())
  //       .then(() => genWallet())
  //       .catch(err => console.log('before err', err))
  //   );

  //   // Clear transactions after testing
  //   after(() => Transaction.remove());

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

          // expect(mongoose.Types.ObjectId.isValid(res.body._id)).to.equal(true);
          // expect(mongoose.Types.ObjectId.isValid(res.body.from)).to.equal(true);
          // expect(mongoose.Types.ObjectId.isValid(res.body.to)).to.equal(true);
          // expect(res.body.amount).to.equal(1000);
        });
    }).timeout(100000);

    //     it('should respond with a 401 when not authenticated', done => {
    //       request(app)
    //         .post('/api/v1/transactions')
    //         .set('x-api-key', 'abc123')
    //         .send()
    //         .expect(401)
    //         .end(done);
    //     });
    //   });

    //   describe('GET /api/v1/transactions/:id', () => {
    //     it('should respond with a 503 error when authenticated', done => {
    //       request(app)
    //         .get('/api/v1/transactions/1')
    //         .set('x-api-key', `${config.key}`)
    //         .expect(200)
    //         .end(done);
    //     });

    //     it('should respond with a 401 error when wrong authentication is set', done => {
    //       request(app)
    //         .get('/api/v1/transactions/1')
    //         .set('x-api-key', '123123123')
    //         .expect(401)
    //         .end(done);
    //     });
    //   });

    //   describe('POST /batchRequest', () => {
    //     it('should respond 201 and batch multiple transactions when authenticated', done => {
    //       request(app)
    //         .post('/batchRequest')
    //         .set('x-api-key', `${config.key}`)
    //         .send([{
    //           txId: '5b253b7f7724004c2c04d775',
    //           account: '1',
    //           sender: 'advertiser test advertiser',
    //           receiver: 'publisher test publisher',
    //           from: '5b17f7a059ca190014773f8c',
    //           to: '5b17f7b559ca19001477408e',
    //           amount: 30,
    //           action: 'spent',
    //           status: 'Starting',
    //           createdAt: '2018-06-16T16:31:59.219Z',
    //           updatedAt: '2018-06-16T16:31:59.219Z',
    //         },
    //         {
    //           txId: '5b253b7f7724004c2c04d776',
    //           account: '1',
    //           sender: 'advertiser test advertiser',
    //           receiver: 'publisher test publisher',
    //           from: '5b17f7b559ca19001477408e ',
    //           to: '5b17f7a059ca190014773f8c',
    //           amount: 30,
    //           action: 'spent',
    //           status: 'Starting',
    //           createdAt: '2018-06-16T16:31:59.219Z',
    //           updatedAt: '2018-06-16T16:31:59.219Z',
    //         }])
    //         .expect(201)
    //         .expect('Content-Type', /json/)
    //         .end((err, res) => {
    //           // console.log('res', res.body);
    //           expect(mongoose.Types.ObjectId.isValid(res.body._id)).to.equal(true);
    //           expect(mongoose.Types.ObjectId.isValid(res.body.from)).to.equal(true);
    //           expect(mongoose.Types.ObjectId.isValid(res.body.to)).to.equal(true);
    //           expect(res.body.amount).to.equal(1000);
    //           done();
    //         });
    //     });

    //     it('should respond with a 401 when not authenticated', done => {
    //       request(app)
    //         .post('/api/v1/transactions')
    //         .set('x-api-key', 'abc123')
    //         .send()
    //         .expect(401)
    //         .end(done);
    //     });
  });
});
