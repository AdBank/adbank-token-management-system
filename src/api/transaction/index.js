'use strict';

import { Router } from 'express';
import * as controller from './transaction.controller';
import * as auth from '../../auth/auth.service';

var router = Router();

router.post('/', auth.isAuthenticated(), controller.create);
router.post('/withdraw', auth.isAuthenticated(), controller.withdraw);
router.get('/', auth.isAuthenticated(), controller.index);
// get a single transaction by transaction id (mongo bson id)
router.get('/:id', auth.isAuthenticated(), controller.show);

module.exports = router;
