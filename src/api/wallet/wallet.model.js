'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Wallet Schema
var WalletSchema = new Schema(
  {
    userId: {
      type: String
    },
    address: {
      type: String
    },
    privateKey: {
      type: String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Wallet', WalletSchema);
