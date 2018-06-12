'use strict';

// Set default node environment to development
const env = process.env.NODE_ENV = process.env.NODE_ENV || 'development';
require = require('esm')(module /*, options*/);
module.exports = require('./app.js');
// Export the application
exports = module.exports = require('./app');
