'use strict';

import { Router } from 'express';
import * as controller from './api.controller';
import * as auth from '../auth/auth.service';

var router = Router();

router.post('/wallet', auth.isAuthenticated(), controller.wallet);
router.post('/batchWallet', auth.isAuthenticated(), controller.batchWallet);
router.post('/batchRequest', auth.isAuthenticated(), controller.batchRequest);

module.exports = router;
