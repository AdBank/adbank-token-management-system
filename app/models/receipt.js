'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Receipt Schema
var ReceiptSchema = new Schema({
  blockHash: {
    type: String
  },
  blockNumber: {
    type: Number
  },
  transactionHash: {
    type: String
  },
  transactionIndex: {
    type: Number
  },
  from: {
    type: String
  },
  to: {
    type: String
  },
  cumulativeGasUsed: {
    type: Number
  },
  gasUsed: {
    type: Number
  },
  contractAddress: {
    type: String
  },
  logs: {
    type: Array
  },
  status: {
    type: String
  },
}, { timestamps: true });

module.exports = mongoose.model('Receipt', ReceiptSchema);


