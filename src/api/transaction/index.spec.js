// 'use strict';

// var chai = require('chai');

// // Load Chai assertions
// var expect = chai.expect;
// // var assert = chai.assert;
// chai.should();

// // Load Sinon
// var sinon = require('sinon');

// // Initialize Chai plugins
// chai.use(require('sinon-chai'));
// chai.use(require('chai-as-promised'));
// chai.use(require('chai-things'));

// var proxyquire = require('proxyquire').noPreserveCache();

// var transactionCtrlStub = {
//   index: 'transactionCtrl.index',
//   show: 'transactionCtrl.show',
//   create: 'transactionCtrl.create'
// };

// var routerStub = {
//   get: sinon.spy(),
//   put: sinon.spy(),
//   patch: sinon.spy(),
//   post: sinon.spy(),
//   delete: sinon.spy()
// };

// var authServiceStub = {
//   isAuthenticated() {
//     return 'authService.isAuthenticated';
//   }
// };

// // require the index with our stubbed out modules
// var transactionIndex = proxyquire('./index.js', {
//   express: {
//     Router() {
//       return routerStub;
//     }
//   },
//   './transaction.controller': transactionCtrlStub,
//   '../../auth/auth.service': authServiceStub
// });

// describe('Transaction API Router:', () => {
//   it('should return an express router instance', () =>
//     expect(transactionIndex).to.equal(routerStub));

//   describe('GET /api/v1/transactions', function() {
//     it('should route to transaction.controller.index', function() {
//       expect(
//         routerStub.get.withArgs(
//           '/',
//           'authService.isAuthenticated',
//           'transactionCtrl.index'
//         )
//       ).to.have.been.calledOnce;
//     });
//   });

//   describe('GET /api/v1/transactions/:id', function() {
//     it('should route to transaction.controller.show', function() {
//       expect(
//         routerStub.get.withArgs(
//           '/:id',
//           'authService.isAuthenticated',
//           'transactionCtrl.show'
//         )
//       ).to.have.been.calledOnce;
//     });
//   });
// });
