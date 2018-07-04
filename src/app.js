'use strict';
// Dependencies
var mongoose = require('mongoose');
var express = require('express');
var http = require('http');
// Configs
// var config = require(`./config/${process.env.NODE_ENV || 'dev'}.js`);
const config = require('./config/environment');
import seedDatabaseIfNeeded from './config/seed';
import terminus from '@godaddy/terminus';
import nats from './config/nats';
// set the uri to mongo depending on environment
let uri = '';
if(process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
  uri = `mongodb://${config.mongo.uri}:${config.mongo.port}/${config.mongo.db}`;
} else {
  uri = `mongodb://${config.mongo.username}:${config.mongo.password}@${
    config.mongo.uri
  }/${config.mongo.db}${config.mongo.args}`;
}

// Connect to the DB
// console.log(uri);
mongoose.connect(uri);

// Initialize the Express App
var app = express();
var server = http.createServer(app);

require('./config/express').default(app);
require('./routes').default(app);

// Start server
function startServer() {
  // Start the app with listen and a port number
  app.api = server.listen(config.port, config.ip, () => {
    console.log(
      `[Express] ${config.name} server listening on ${
        config.port
      }, in ${app.get('env')} mode`
    );
  });
}

// var producer = require('./api/transaction/transaction.socket').register;
require('./api/transaction/transaction.socket').register;

// graceful shutdown before shutdown
function onSignal() {
  console.log('[express] server is starting cleanup');
  return Promise.all([
    // Add any promises here for processes that need to be closed before the tests can finish
    new Promise(resolve => {
      console.log('[mongo] client shutting down');
      mongoose.connection.close(resolve);
    }),
    new Promise(resolve => {
      console.log('[express] api shutting down');
      app.api.close(resolve);
    }),
    new Promise(resolve => {
      console.log('[nats] shutting down');
      nats.flush(() => resolve);
    })
  ]);
}

// config for terminus
const options = {
  logger: console.log,
  signal: 'SIGINT',
  healthChecks: {
    '/healthcheck': Promise.resolve()
  },
  onSignal
};
// mke node.js k8s friendly
terminus(server, options);

seedDatabaseIfNeeded()
  .then(startServer)
  .catch(err => console.log('[Express] error starting server', err));

export default app;
