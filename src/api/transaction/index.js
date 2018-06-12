'use strict';

import { Router } from 'express';
import * as controller from './transaction.controller';
// import * as auth from '../../auth/auth.service';

var router = Router();

router.get('/', controller.index);
router.post('/', controller.create);

module.exports = router;
