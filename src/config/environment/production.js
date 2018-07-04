'use strict';
/*eslint no-process-env:0*/

// Test specific configuration
// =================================

module.exports = {
  ip: process.env.IP || '0.0.0.0',

  port: parseInt(process.env.PORT, 10),
  mongo: {
    username: process.env.MONGODB_USER,
    password: process.env.MONGODB_PW,
    uri: process.env.MONGODB_URI,
    port: parseInt(process.env.MONGODB_PORT, 10),
    db: process.env.MONGODB_DB,
    args: process.env.MONGODB_ARGS
  },
  web3: {
    rpc: {
      provider: process.env.ETH_RPC_URI
    }
  },
  contract: {
    ownerAddress: process.env.CONTRACT_OWNER_ADDRESS, // Contract Owner Address
    address: process.env.CONTRACT_ADDRESS, // Address where contract is deployed
    decimals: parseInt(process.env.CONTRACT_DECIMALS, 10) || parseInt(18, 10) // Token decimals
  },
  networkWallet: {
    // Gas Holder
    address: process.env.NETWORK_WALLET_ADDRESS, // Typically used to send eth to internal wallet
    privateKey: process.env.NETWORK_WALLET_PK // Network Wallet private key ( You can use contract owner as master eth account )
  },
  revenueWallet: {
    address: process.env.REVENUE_WALLET
  },
  chainId: parseInt(process.env.CHAIN_ID, 10), // Network Chain ID,
  key: process.env.KEY, // Security Key
  percent: parseInt(process.env.FEE_PERCENT, 10) || parseInt(0, 10), // Fee Percentage
  nats: {
    servers: process.env.NATS_SERVERS, // nats cluster
    url: process.env.NATS_SERVER_URL // nats single instance
  },
  seedDB: false
};
