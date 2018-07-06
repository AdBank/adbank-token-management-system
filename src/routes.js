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
