'use strict';
import config from '../config/environment';
import jwt from 'jsonwebtoken';
import expressJwt from 'express-jwt';
import compose from 'composable-middleware';
import User from '../api/user/user.model';

var validateJwt = expressJwt({
  secret: config.secret
});

/**
 * Attaches the user object to the request if authenticated
 * Otherwise returns 403
 */
export function isAuthenticated() {
  return (
    compose()
      // Validate jwt
      .use((req, res, next) => {
        // // console.log('req.headers', req.headers);
        // // allow access_token to be passed through query parameter as well
        // if (req.query && req.query.hasOwnProperty('access_token')) {
        //   req.headers.authorization = `Bearer ${req.query.access_token}`;
        // }
        // // No authorization header Bearer token? return 401
        // if (req.query && typeof req.headers.authorization === 'undefined') {
        //   return res.sendStatus(401).end();
        // }
        // validateJwt(req, res, next);

        var key = '';
        if (req.headers['x-api-key']) key = req.headers['x-api-key'];

        if (key != app.key) {
          return res.sendStatus(401).end();
        }
      })
      // Attach user to request
      .use((req, res, next) => {
        // console.log('req.user', req.user._id);
        User.findById(req.user._id)
          .exec()
          .then(user => {
            if (!user) {
              return res.sendStatus(401).end();
            }

            req.user = user;
            next();
            return null;
          })
          .catch(err => next(err));
      })
  );
}
