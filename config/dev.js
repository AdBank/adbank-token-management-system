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
      provider: 'localhost:8545'
    }
  },
  contract: {
    abi: 'abi.json', // Contract ABI
    owner_address: '0xf3399d84571fac96eed37cd4b50baee807b67360', // Contract Owner Address
    address: '0x69c215f4d9940948c257ad45a28032b4b3d5cafd', // Address where contract is deployed
    privateKey:
      'f5fac598ccd8c44771b6d4c5fe3bb055ee9b36d990d62181a1f9b859b595b307', // Contract owner address private key
    decimals: 18 // Token decimals
  },
  networkWallet: {
    // Gas Holder
    address: '0xf3399d84571fac96eed37cd4b50baee807b67360', // Typically used to send eth to internal wallet
    privateKey: '' // Network Wallet Private Key
  },
  revenueWallet: {
    address: '0xf3399d84571fac96eed37cd4b50baee807b67360', // Typically used to get fee from interal wallet
    privateKey: '' // Revenue Wallet Private Key
  },
  chainId: 1337, // Network Chain ID,
  key: '&6831IlYmK33d', // Security Key
  percent: 25 // Fee Percentage
};
