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

  // Private key: f7403dc60b846901fb8554240f2bdb455c3363c467504bf54f73dfb95bfeed8d
  // Publlic key: be1dff8a579b278e3c96aaca82b78a36ce5cc409a8a8a477c7d1f6a5792c3dbf23c73b2449e5b8e714c8a4f614cacfaba1cb08878a2b973042727b6f78130878d2d1d43341a50bd1c6aa5dca1b877697
  //  Address: 0x01913950144EDd792d392eF76C2fC178f45638d6

  // Private key: 229b2f12de272a2d96e307f9df67425ad84c07979e7e7ebc6ed62604e07adf34
  // Public key:  bca5bfea37978f48ea407312470e147ef215fe68c3de4f100fd9c58247878e9074ce7762111cc97933217c3efdd50c4ac04ed6b1e69a4d0f016375563b2b75ef
  // Address:     0xC8443418c1D1a74b4984E60a31fA85fdD8328c31

  let walletPromise = Wallet.find({})
    .remove()
    .then(() =>
      Wallet.create(
        {
          _id: '5b17f7a059ca190014773f8c',
          userId: '1',
          address: '0x01913950144EDd792d392eF76C2fC178f45638d6',
          privateKey:
            'be1dff8a579b278e3c96aaca82b78a36ce5cc409a8a8a477c7d1f6a5792c3dbf23c73b2449e5b8e714c8a4f614cacfaba1cb08878a2b973042727b6f78130878d2d1d43341a50bd1c6aa5dca1b877697'
        },
        {
          _id: '5b17f7b559ca19001477408e',
          userId: '2',
          address: '0xC8443418c1D1a74b4984E60a31fA85fdD8328c31',
          privateKey:
            'bca5bfea37978f48ea407312470e147ef215fe68c3de4f100fd9c58247878e9074ce7762111cc97933217c3efdd50c4ac04ed6b1e69a4d0f016375563b2b75ef'
        }
      )
        .then(() => console.log('[SEED] finished populating wallets'))
        .catch(err => console.log('[SEED] error populating wallets', err))
    );

  let tansactionPromise = Transaction.find({})
    .remove();
  // .then(() =>
  //   Transaction.create(
  //     {
  //       _id: '5b1ac68f94f5ab0013c0707a',
  //       account: 1,
  //       txId: '5b1ac68f94f5ab0013c0707d',
  //       from: '5b17f7a059ca190014773f8c',
  //       to: '5b17f7b559ca19001477408e',
  //       amount: 200,
  //       hash:
  //         '0x0420240d2f8e95a08814afd4175491a904279534655c69055e64bd4f2b15a1a9',
  //       action: 'spent',
  //       status: 'complete',
  //       sender: 'test advertiser',
  //       receiver: 'test publisher',
  //     },
  //     {
  //       _id: '5b1ac7ee94f5ab0013c0707b',
  //       account: 1,
  //       txId: '5b1ac7ee94f5ab0013c0707d',
  //       from: '5b17f7a059ca190014773f8c',
  //       to: '5b17f7b559ca19001477408e',
  //       amount: 250,
  //       hash:
  //         '0xab06174456070c79ffdfcbe197b64895f97afe22ef8f0c2e13e4ffe7fe6c33a5',
  //       action: 'spent',
  //       status: 'complete',
  //       sender: 'test advertiser',
  //       receiver: 'test publisher',
  //     }
  //   )
  //     .then(() => console.log('[SEED] finished populating transactions'))
  //     .catch(err => console.log('[SEED] error populating transactions', err))
  // );

  let receiptsPromise = Receipt.find({})
    .remove()
    .then(() =>
      Receipt.create()
        .then(() => console.log('[SEED] finished populating receipts'))
        .catch(err => console.log('[SEED] error populating receipts', err))
    );

  return Promise.all(promises);
}
