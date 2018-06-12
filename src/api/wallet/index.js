'use strict';

import { Router } from 'express';
// import * as controller from './history.controller';
// import * as auth from '../../auth/auth.service';

var router = Router();

router.get('/', auth.isAuthenticated(), controller.index);

module.exports = router;
