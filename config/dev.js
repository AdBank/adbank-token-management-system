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
    uri: process.env.MONGODB_URI || 'mongo',
    port: process.env.MONGODB_PORT || 27017,
    db: process.env.MONGODB_DB || 'adbank-tms-dev'
  },
  web3: {
    ipc: {
      provider: '/Projects/adbank-token-network-production/devnet/geth.ipc' // Network IPC Provider
    },
    rpc: {
      provider: 'http://localhost:8545/'
    }
  },
  contract: {
    abi: 'abi.json', // Contract ABI
    owner_address: '0x8a21fabb3f79b3803df08ac180205f5a22ad4dd3', // Contract Owner Address
    address: '0x3174ab9928a85e1f3635be19f1f59ad63fba03e2', // Address where contract is deployed
    privateKey: '', // Contract owner address private key
    decimals: 18 // Token decimals
  },
  networkWallet: {
    // Gas Holder
    address: '0x8a21fabb3f79b3803df08ac180205f5a22ad4dd3', // Typically used to send eth to internal wallet
    privateKey: '' // Network Wallet Private Key
  },
  revenueWallet: {
    address: '0x8a21fabb3f79b3803df08ac180205f5a22ad4dd3', // Typically used to get fee from interal wallet
    privateKey: '' // Revenue Wallet Private Key
  },
  chainId: 1337, // Network Chain ID,
  key: '&6831IlYmK33d', // Security Key
  percent: 25 // Fee Percentage
};
