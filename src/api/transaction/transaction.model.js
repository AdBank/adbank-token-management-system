'use strict';

import mongoose from 'mongoose';
// var Schema = mongoose.Schema;
import { registerEvents } from './transaction.events';

// Transaction Schema
var TransactionSchema = new mongoose.Schema(
  {
    account: {
      type: String,
      required: true
    },
    txId: {
      type: String,
      required: true
    },
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
    },
    receiptId: {
      type: String
    }
  },
  { timestamps: true }
);

registerEvents(TransactionSchema);
export default mongoose.model('Transaction', TransactionSchema);
