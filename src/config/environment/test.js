'use strict';
/*eslint no-process-env:0*/

// Test specific configuration
// =================================

module.exports = {
  // db: {
  //   url : 'mongodb://localhost:27017/adbank'
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
    db: process.env.MONGODB_DB || 'adbank-tms-live',
    args: process.env.MONGODB_ARGS || ''
  },
  web3: {
    rpc: {
      provider: 'https://ropsten.infura.io/4j5O9eS3JbK1oetIOMTq'
    }
  },
  contract: {
    owner_address: '0xf3399d84571fac96eed37cd4b50baee807b67360', // Contract Owner Address
    address: '0x69c215f4d9940948c257ad45a28032b4b3d5cafd', // Address where contract is deployed
    privateKey:
      'f5fac598ccd8c44771b6d4c5fe3bb055ee9b36d990d62181a1f9b859b595b307', // Contract owner address private key,
    decimals: 18 // Token decimals
  },
  networkWallet: {
    // Gas Holder
    address: '0xf3399d84571fac96eed37cd4b50baee807b67360', // Typically used to send eth to internal wallet
    privateKey:
      'f5fac598ccd8c44771b6d4c5fe3bb055ee9b36d990d62181a1f9b859b595b307' // Contract owner address private key,
  },
  revenueWallet: {
    address: '0xf3399d84571fac96eed37cd4b50baee807b67360',
    privateKey:
      'f5fac598ccd8c44771b6d4c5fe3bb055ee9b36d990d62181a1f9b859b595b307' // Contract owner address private key,
  },
  chainId: 3, // Network Chain ID,
  key: '&6831IlYmK33d', // Security Key
  percent: 25, // Fee Percentage
  seedDB: false
};
