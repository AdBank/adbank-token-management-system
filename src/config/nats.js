/**
 * Transaction model events
 */

'use strict';

import NATS from 'nats';
const config = require('./environment');

var url = config.nats.url;
const nats = NATS.connect({ url, port: 4222, json: true });
console.log(`[NATS] Connected to ${nats.currentServer.url.host}`);

nats.on('error', err => {
  console.log('[NATS] error', err);
});

nats.on('connect', nc => {
  console.log('[NATS] connected');
});

nats.on('disconnect', () => {
  console.log('[NATS] disconnect');
});

nats.on('reconnecting', () => {
  console.log('[NATS] reconnecting');
});

nats.on('reconnect', nc => {
  console.log('[NATS] reconnect');
});

nats.on('close', () => {
  console.log('[NATS] close');
});

export default nats;
