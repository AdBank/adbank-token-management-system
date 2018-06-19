'use strict';

import { Router } from 'express';
import * as controller from './api.controller';
import * as auth from '../auth/auth.service';

var router = Router();

router.get('/', controller.index);

router.post('/system', auth.isAuthenticated(), controller.system);
router.post(
  '/ownerTokenBalance',
  auth.isAuthenticated(),
  controller.ownerTokenBalance
);
router.post(
  '/holderTokenBalance',
  auth.isAuthenticated(),
  controller.holderTokenBalance
);
router.post(
  '/walletTokenBalance',
  auth.isAuthenticated(),
  controller.walletTokenBalance
);
router.post('/wallet', auth.isAuthenticated(), controller.wallet);
router.post('/withdraw', auth.isAuthenticated(), controller.withdraw);
router.post('/batchWallet', auth.isAuthenticated(), controller.batchWallet);
router.post('/batchRequest', auth.isAuthenticated(), controller.batchRequest);
router.post(
  '/transferTokensInternally',
  auth.isAuthenticated(),
  controller.transferTokensInternally
);
router.post('/history', auth.isAuthenticated(), controller.history);

module.exports = router;
