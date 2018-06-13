'use strict';

import { Router } from 'express';
import * as controller from './transaction.controller';
import * as auth from '../../auth/auth.service';

var router = Router();

router.get('/', auth.isAuthenticated(), controller.index);
router.post('/', auth.isAuthenticated(), controller.create);

module.exports = router;
