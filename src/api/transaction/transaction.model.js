'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Transaction Schema
var TransactionSchema = new Schema(
  {
    from: {
      type: String,
      required: true
    },
    to: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
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
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', TransactionSchema);
