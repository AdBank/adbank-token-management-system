module.exports = {
  db: {
    url: 'mongodb://mongo:27017/adbank'
  },
  web3: {
    provider: '/Projects/adbank-token-network-production/devnet/geth.ipc' // Network IPC Provider
  },
  contract: {
    abi: 'abi.json', // Contract ABI
    owner_address: '0x8a21fabb3f79b3803df08ac180205f5a22ad4dd3', // Contract Owner Address
    address: '0x3174ab9928a85e1f3635be19f1f59ad63fba03e2', // Address where contract is deployed
    password: '', // Contract owner address password
    decimals: 18 // Token decimals
  },
  networkWallet: {
    // Gas Holder
    address: '0x8a21fabb3f79b3803df08ac180205f5a22ad4dd3', // Typically used to send eth to internal wallet
    password: '' // Network Wallet Password ( You can use contract owner as master eth account )
  },
  revenueWallet: {
    address: '0x8a21fabb3f79b3803df08ac180205f5a22ad4dd3', // Typically used to get fee from interal wallet
    password: '' // Revenue Wallet Password
  },
  chainId: 1337, // Network Chain ID,
  key: '&6831IlYmK33d', // Security Key
  percent: 25 // Fee Percentage
};
