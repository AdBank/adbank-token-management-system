'use strict';

import { Router } from 'express';
import * as controller from './wallet.controller';
// import * as auth from '../../auth/auth.service';

var router = Router();

// router.get('/', auth.isAuthenticated(), controller.index);
router.post('/', controller.create);
router.post('/walletTokenBalance', controller.walletTokenBalance);

module.exports = router;
