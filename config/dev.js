module.exports = {
  db: {
    url : 'mongodb://localhost:27017/adbank'
  },
  web3: {
    provider: '/Projects/adbank-token-network/devnet/geth.ipc' // Network IPC Provider
  },
  contract: {
    abi: "abi.json", // Contract ABI
    owner_address: '0x8c1e29fda9f61b9beec58ac3808bb2a11eb4838c', // Contract Owner Address
    address: '0xf67532908655f261bc2a14a57790e9e015b62d69', // Address where contract is deployed
    password: '', // Contract owner address password
    decimals: 18 // Token decimals
  },
  wallet: {
    address: '0x8c1e29fda9f61b9beec58ac3808bb2a11eb4838c', // Typically used to send eth to internal wallet
    password: '' // Master ETH Wallet Password ( You can use contract owner as master eth account )
  },
  chainId: 1337, // Network Chain ID,
  key: '&6831IlYmK33d' // Security Key
};