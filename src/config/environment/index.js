'use strict';
/*eslint no-process-env:0*/

const path = require('path');
const _ = require('lodash');

// All configurations will extend these options
// ============================================
var all = {
  // Root path of server
  root: path.normalize(`${__dirname}/../../..`),

  // Server port
  port: process.env.PORT || 9000,

  // Server IP
  ip: process.env.IP || '0.0.0.0',

  // Should we populate the DB with sample data?
  seedDB: false,

  name: 'tokekn-management-api',
  // MongoDB connection options
  mongo: {
    options: {}
  }
};

// Export the config object based on the NODE_ENV
// ==============================================
module.exports = _.merge(all, require(`./${process.env.NODE_ENV}.js`) || {});
