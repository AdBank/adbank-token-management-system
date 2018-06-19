'use strict';
import config from '../config/environment';
import compose from 'composable-middleware';


/**
 * Attaches the user object to the request if authenticated
 * Otherwise returns 403
 */
export function isAuthenticated() {
  return (
    compose()
      // Validate jwt
      .use((req, res, next) => {
        if (req.headers['x-api-key'] != config.key) {
          return res.sendStatus(401).end();
        }
        next();
      })
      // Attach user to request
      .use((req, res, next) => {
        next();
      })
  );
}
