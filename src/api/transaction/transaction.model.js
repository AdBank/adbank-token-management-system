'use strict';

import mongoose from 'mongoose';
// var Schema = mongoose.Schema;
import { registerEvents } from './transaction.events';

// the only difference between this and ecigmedia mongo db
// is the txId here is the _id on the ecig mongo db

// Transaction Schema
var TransactionSchema = new mongoose.Schema(
  {
    txId: {
      type: String,
      required: true
    },
    account: {
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
    },
    status: {
      type: String,
      required: true
    },
    sender: {
      type: String,
      required: true
    },
    receiver: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

registerEvents(TransactionSchema);
export default mongoose.model('Transaction', TransactionSchema);
