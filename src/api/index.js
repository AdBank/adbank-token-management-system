'use strict';

import { Router } from 'express';
import * as controller from './api.controller';
// import * as auth from '../../auth/auth.service';

var router = Router();

router.get('/', controller.index);

module.exports = router;

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
