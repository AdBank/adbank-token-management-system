'use strict';
/*eslint no-process-env:0*/

// Development specific configuration
// =================================
import fs from 'fs';

module.exports = {
  // db: {
  //   url: 'mongodb://localhost:27017/adbank'
  // },
  // Server IP
  ip: process.env.IP || '0.0.0.0',

  name: 'token-management-server',
  port: process.env.PORT || 3000,
  mongo: {
    username: process.env.MONGODB_USER || '',
    password: process.env.MONGODB_PW || '',
    uri: process.env.MONGODB_URI || 'localhost',
    port: process.env.MONGODB_PORT || 27017,
    db: process.env.MONGODB_DB || 'adbank-tms-dev'
  },
  web3: {
    rpc: {
      provider: 'https://ropsten.infura.io/4j5O9eS3JbK1oetIOMTq'
    }
  },
  contract: {
    //owner_address: '0xf3399d84571fac96eed37cd4b50baee807b67360', // Contract Owner Address
    ownerAddress: '0x2baac9330cf9ac479d819195794d79ad0c7616e3',
    //address: '0x69c215f4d9940948c257ad45a28032b4b3d5cafd', // Address where contract is deployed
    address: '0x2baac9330cf9ac479d819195794d79ad0c7616e3',
    decimals: 18 // Token decimals
  },
  networkWallet: {
    // Gas Holder
    address: '0xf3399d84571fac96eed37cd4b50baee807b67360', // Typically used to send eth to internal wallet
    privateKey: '' // Network Wallet Private Key
  },
  revenueWallet: {
    address: '0xf3399d84571fac96eed37cd4b50baee807b67360' // Typically used to get fee from interal wallet
  },
  //chainId: 1337, // Network Chain ID,
  chainId: 1,
  key: '&6831IlYmK33d', // Security Key
  percent: 25, // Fee Percentage,
  // seed the db in development mode

  nats: {
    servers: ['nats://gnatsd:4222']
  },
  seedDB: true
};
