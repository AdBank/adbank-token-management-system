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
      provider:
        process.env.ETH_RPC_URI
        || 'https://mainnet.infura.io/4j5O9eS3JbK1oetIOMTq'
    }
  },
  contract: {
    address:
      process.env.CONTRACT_ADDRESS
      || '0x2baac9330cf9ac479d819195794d79ad0c7616e3', // Address where contract is deployed
    ownerAddress:
      process.env.CONTRACT_OWNER_ADDRESS
      || '0x2baac9330cf9ac479d819195794d79ad0c7616e3',
    // Contract Owner Address
    decimals: 18 // Token decimals
  },
  networkWallet: {
    // Gas Holder
    address: process.env.NETWORK_WALLET_ADDRESS || '', // Typically used to send eth to internal wallet
    privateKey: process.env.NETWORK_WALLET_PK || '' // Network Wallet private key ( You can use contract owner as master eth account )
  },
  revenueWallet: {
    address:
      process.env.REVENUE_WALLET || '0xe8C0A55e44324e8aF6B3fa8e1729200d8b80B539'
  },
  chainId: process.env.CHAINID || 1, // Network Chain ID,
  key: process.env.KEY || '&6831IlYmK33d', // Security Key
  percent: 25, // Fee Percentage
  nats: {
    servers: [
      'nats://adbank-nats-cluster-2.adbank-nats-cluster-mgmt.nats-io.svc:4222',
      'nats://adbank-nats-cluster-3.adbank-nats-cluster-mgmt.nats-io.svc:4222'
    ]
  },
  seedDB: false
};
