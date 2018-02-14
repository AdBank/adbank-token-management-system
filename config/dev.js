module.exports = {
  db: {
    url : 'mongodb://localhost:27017/adbank'
  },
  web3: {
    provider: '/Projects/adbank-token-network/devnet/geth.ipc' // Network IPC Provider
  },
  contract: {
    abi: "abi.json", // Contract ABI
    owner_address: '0x54292a3cf1acd751e0ef528bdc34953234e5bc89', // Contract Owner Address
    address: '0x002d29074b0c9716ace7251e551cbe15c5d7cb6b', // Address where contract is deployed
    password: 'a', // Contract owner address password
    decimals: 18 // Token decimals
  },
  wallet: {
    address: '0x54292a3cf1acd751e0ef528bdc34953234e5bc89', // Typically used to send eth to internal wallet
    password: 'a' // Master ETH Wallet Password ( You can use contract owner as master eth account )
  },
  chainId: 1337, // Network Chain ID,
  key: '&6831IlYmK33d' // Security Key
};