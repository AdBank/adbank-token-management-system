'use strict';
/*eslint no-process-env:0*/

// Test specific configuration
// =================================

module.exports = {
  // db: {
  //   url: process.env.MONGO_URI || 'mongodb://mongo:27017/adbank'
  // },
  // Server IP
  ip: process.env.IP || '0.0.0.0',

  name: 'token-management-server',
  port: process.env.PORT || 8080,
  mongo: {
    username: process.env.MONGODB_USER || '',
    password: process.env.MONGODB_PW || '',
    uri: process.env.MONGODB_URI || 'mongo',
    port: process.env.MONGODB_PORT || 27017,
    db: process.env.MONGODB_DB || 'adbank-tms-prod',
    args: process.env.MONGODB_ARGS || ''
  },
  web3: {
    rpc: {
      provider: 'https://mainnet.infura.io/4j5O9eS3JbK1oetIOMTq'
    }
  },
  contract: {
    address: '0x2baac9330cf9ac479d819195794d79ad0c7616e3', // Address where contract is deployed
    ownerAddress: '0x2baac9330cf9ac479d819195794d79ad0c7616e3',
    // Contract Owner Address
    decimals: 18 // Token decimals
  },
  networkWallet: {
    // Gas Holder
    address: '0x1B45faD4B8Ff0896Ca099E4cafa2fC9223b5B999', // Typically used to send eth to internal wallet
    privateKey:
      '3c3722fc2152dcb93492e01e843b006a2b7219a78fcde77d8b19e6bf73371d32' // Network Wallet private key ( You can use contract owner as master eth account )
  },
  revenueWallet: {
    address: '0xe8C0A55e44324e8aF6B3fa8e1729200d8b80B539'
  },
  chainId: 1, // Network Chain ID,
  key: '&6831IlYmK33d', // Security Key
  percent: 25, // Fee Percentage
  nats: {
    servers: ['nats://gnatsd:4222']
  },
  seedDB: false
};
