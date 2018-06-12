/**
 * Express configuration
 */

'use strict';

const morgan = require('morgan');
const compression = require('compression');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const errorHandler = require('errorhandler');

exports.default = function(app) {
  var env = app.get('env');
  // app.use(shrinkRay());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(compression());
  app.use(methodOverride());

  if (env === 'development') {
  }

  if (env === 'development' || env === 'test' || env === 'production') {
    app.use(morgan('dev'));
    app.use(errorHandler()); // Error handler - has to be last
  }
};
