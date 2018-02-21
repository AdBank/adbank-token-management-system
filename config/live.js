module.exports = {
  db: {
    url : 'mongodb://localhost:27017/adbank'
  },
  web3: {
    provider: '~/.ethereum/testnet/geth.ipc' // Network IPC Provider
  },
  contract: {
    abi: "abi.json", // Contract ABI
    owner_address: '0xf3399d84571fac96eed37cd4b50baee807b67360', // Contract Owner Address
    address: '0x69c215f4d9940948c257ad45a28032b4b3d5cafd', // Address where contract is deployed
    password: 'a', // Contract owner address password
    decimals: 18 // Token decimals
  },
  wallet: {
    address: '0xf3399d84571fac96eed37cd4b50baee807b67360', // Typically used to send eth to internal wallet
    password: 'a' // Master ETH Wallet Password ( You can use contract owner as master eth account )
  },
  chainId: 1, // Network Chain ID,
  key: '&6831IlYmK33d' // Security Key
};