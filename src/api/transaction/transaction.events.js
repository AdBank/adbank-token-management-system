/**
 * Transaction model events
 */

'use strict';

import { EventEmitter } from 'events';
var TransactionEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
TransactionEvents.setMaxListeners(0);

// Model events
var events = {
  save: 'save',
  remove: 'remove'
};

// Register the event emitter to the model events
function registerEvents(Transaction) {
  for(var e in events) {
    let event = events[e];
    Transaction.post(e, emitEvent(event));
  }
}

function emitEvent(event) {
  return function(doc) {
    console.log('doc', doc);
    TransactionEvents.emit(`${event}:${doc._id}`, doc);
    TransactionEvents.emit(event, doc);
  };
}

export { registerEvents };
export default TransactionEvents;
