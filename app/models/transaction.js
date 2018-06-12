'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Transaction Schema
var TransactionSchema = new Schema({
  from: {
    type: String
  },
  to: {
    type: String
  },
  amount: {
    type: Number
  },
  hash: {
    type: String
  },
  action: {
    type: String
  },
  gas: {
    type: Number
  }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', TransactionSchema);
