'use strict';
/*eslint no-process-env:0*/

// Test specific configuration
// =================================

module.exports = {
  ip: process.env.IP || '0.0.0.0',

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
        || 'https://ropsten.infura.io/4j5O9eS3JbK1oetIOMTq'
    }
  },
  contract: {
    ownerAddress:
      process.env.CONTRACT_OWNER_ADDRESS
      || '0xf3399d84571fac96eed37cd4b50baee807b67360',
    address:
      process.env.CONTRACT_ADDRESS
      || '0x69c215f4d9940948c257ad45a28032b4b3d5cafd', // Address where contract is deployed

    // Contract Owner Address
    decimals: 18 // Token decimals
  },
  networkWallet: {
    // Gas Holder
    address:
      process.env.NETWORK_WALLET_ADDRESS
      || '0xf3399d84571fac96eed37cd4b50baee807b67360', // Typically used to send eth to internal wallet
    privateKey:
      process.env.NETWORK_WALLET_PK
      || 'f5fac598ccd8c44771b6d4c5fe3bb055ee9b36d990d62181a1f9b859b595b307' // Network Wallet private key ( You can use contract owner as master eth account )
  },
  revenueWallet: {
    address:
      process.env.REVENUE_WALLET || '0xf3399d84571fac96eed37cd4b50baee807b67360'
  },
  chainId: process.env.CHAINID || 3, // Network Chain ID,
  key: process.env.KEY || '&6831IlYmK33d', // Security Key
  percent: 25, // Fee Percentage
  nats: {
    servers: ['nats://nats-nodeport.nats.svc.cluster.local:4222']
  },
  seedDB: false
};
