/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';

import Wallet from '../api/wallet/wallet.model';
import Receipt from '../api/receipt/receipt.model';
import History from '../api/history/history.model';
import Transaction from '../api/transaction/transaction.model';
import config from './environment/';

export default function seedDatabaseIfNeeded() {
  if(!config.seedDB) {
    return Promise.resolve();
  }

  let promises = [];

  let walletPromise = Wallet.find({})
    .remove()
    .then(() =>
      Wallet.create(
        {
          _id: '5b17f7a059ca190014773f8c',
          userId: '1',
          address: '0xcad96402cB0612C173e850DFfe60c0a606c9fEB7',
          privateKey:
            '3e90e479c03d2948f2609d2657a3ce4d37838ea742ddbcdf817c04e2604d6691c741f8f995cc58694db60179f9e4eeea702e39519289aa36b626071cb2460c86ce4fb8a0ef1ee446f14d9a98cf06118e'
        },
        {
          _id: '5b17f7b559ca19001477408e',
          userId: '2',
          address: '0x69833CF0D1324aA939EaF0AD2424ECcCc3d03D73',
          privateKey:
            'f8d756728853484c828e03901044aa55ced992f21edc3841dac30e265a39af09f609327a8e00ad0a7d188b84ce40246f25a9fe99fbf5f7da3fa08a05f378349a31896c775b3ab39142693a668f9369e2'
        }
      )
        .then(() => console.log('[SEED] finished populating wallets'))
        .catch(err => console.log('[SEED] error populating wallets', err))
    );

  let tansactionPromise = Transaction.find({})
    .remove()
    .then(() =>
      Transaction.create(
        {
          _id: '5b1ac68f94f5ab0013c0707a',
          from: '5b17f7a059ca190014773f8c',
          to: '5b17f7b559ca19001477408e',
          amount: 20000000000000000000,
          hash:
            '0x0420240d2f8e95a08814afd4175491a904279534655c69055e64bd4f2b15a1a9',
          action: 'spent'
        },
        {
          _id: '5b1ac7ee94f5ab0013c0707b',
          from: '5b17f7a059ca190014773f8c',
          to: '5b17f7b559ca19001477408e',
          amount: 25000000000000000000,
          hash:
            '0xab06174456070c79ffdfcbe197b64895f97afe22ef8f0c2e13e4ffe7fe6c33a5',
          action: 'spent'
        }
      )
        .then(() => console.log('[SEED] finished populating transactions'))
        .catch(err => console.log('[SEED] error populating transactions', err))
    );

  let receiptsPromise = Receipt.find({})
    .remove()
    .then(() =>
      Receipt.create()
        .then(() => console.log('[SEED] finished populating receipts'))
        .catch(err => console.log('[SEED] error populating receipts', err))
    );

  return Promise.all(promises);
}
