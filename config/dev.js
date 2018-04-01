module.exports = {
  db: {
    url : 'mongodb://localhost:27017/adbank'
  },
  web3: {
    provider: '/Projects/adbank-token-network-production/devnet/geth.ipc' // Network IPC Provider
  },
  contract: {
    abi: "abi.json", // Contract ABI
    owner_address: '0x8a21fabb3f79b3803df08ac180205f5a22ad4dd3', // Contract Owner Address
    address: '0x3174ab9928a85e1f3635be19f1f59ad63fba03e2', // Address where contract is deployed
    password: '', // Contract owner address password
    decimals: 18 // Token decimals
  },
  wallet: {
    address: '0x8a21fabb3f79b3803df08ac180205f5a22ad4dd3', // Typically used to send eth to internal wallet
    password: '' // Master ETH Wallet Password ( You can use contract owner as master eth account )
  },
  chainId: 1337, // Network Chain ID,
  key: '&6831IlYmK33d' // Security Key
};