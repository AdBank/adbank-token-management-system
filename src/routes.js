/**
 * Main application routes
 */

'use strict';

export default function(app) {
  app.use('/api/v1/wallets', require('./api/wallet'));
  app.use('/api/v1/transactions', require('./api/transaction'));
  app.use('/', require('./api/'));

  // All undefined asset or api routes should return a 404
  app
    .route('/:url(api|auth|components|app|bower_components|assets)/*')
    .get((req, res) => res.sendStatus(404));

  app.route('/').get((req, res) => res.sendStatus(200));
}

// /**
//  * Main application routes
//  */

// 'use strict';

// import { Router } from 'express';
// export const router = Router();

// // All routes go here.
// // router.get('/', controller.index);
// // router.post('/system', controller.system);
// // router.post('/ownerTokenBalance', controller.ownerTokenBalance);
// // router.post('/holderTokenBalance', controller.holderTokenBalance);
// // router.post('/walletTokenBalance', controller.walletTokenBalance);
// // router.post('/wallet', controller.wallet);
// // router.post('/withdraw', controller.withdraw);
// // router.post('/batchWallet', controller.batchWallet);
// // router.post('/batchRequest', controller.batchRequest);
// // router.post('/transferTokensInternally', controller.transferTokensInternally);
// // router.post('/history', controller.history);
// // All undefined asset or api routes should return a 404
// router
//   .route('/:url(api|auth|components|app|bower_components|assets)/*')
//   .get((req, res) => res.sendStatus(404));

// router.route('/').get((req, res) => res.sendStatus(200));
