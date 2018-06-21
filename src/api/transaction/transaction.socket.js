/**
 * Broadcast updates to client when the model changes
 */

'use strict';

import NATS from 'nats';
import config from '../../config/environment';
import TransactionEvents from './transaction.events';
var servers = config.nats.servers;
var url = config.nats.url;
console.log('nats url', url);
const nats = NATS.connect({ url, port: 4222, json: true });

// currentServer is the URL of the connected server.
console.log(`[NATS] Connected to ${nats.currentServer.url.host}`);

// Model events to emit
var events = ['save', 'remove'];

export function register() {
  // console.log('wat');
  // Bind model events to socket events
  for(let event of events) {
    var listener = createListener(`transaction:${event}`, nats);

    TransactionEvents.on(event, listener);
    nats.on('disconnect', removeListener(event, listener));
  }
}

function createListener(event, nats) {
  return function(doc) {
    // console.log(`transaction.save.${doc.account}`, doc);
    nats.publish(`transaction.save.${doc.account}`, doc);
    // spark.emit(event, doc);
  };
}

function removeListener(event, listener) {
  return function() {
    TransactionEvents.removeListener(event, listener);
  };
}

// turn on the socket here
register();
