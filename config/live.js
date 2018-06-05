module.exports = {
  db: {
    url : 'mongodb://localhost:27017/adbank'
  },
  web3: {
    ipc: {
      provider: '/home/ubuntu/.ethereum/testnet/geth.ipc' // Network IPC Provider
    },
    rpc: {
      provider: 'http://localhost:8545/'
    }
  },
  contract: {
    abi: "abi.json", // Contract ABI
    owner_address: '0xf3399d84571fac96eed37cd4b50baee807b67360', // Contract Owner Address
    address: '0x69c215f4d9940948c257ad45a28032b4b3d5cafd', // Address where contract is deployed
    privateKey: 'f5fac598ccd8c44771b6d4c5fe3bb055ee9b36d990d62181a1f9b859b595b307', // Contract owner address private key,
    decimals: 18 // Token decimals
  },
  networkWallet: { // Gas Holder
    address: '0xf3399d84571fac96eed37cd4b50baee807b67360', // Typically used to send eth to internal wallet
    privateKey: 'f5fac598ccd8c44771b6d4c5fe3bb055ee9b36d990d62181a1f9b859b595b307', // Contract owner address private key,
  },
  revenueWallet: {
    address: '0xf3399d84571fac96eed37cd4b50baee807b67360',
    privateKey: 'f5fac598ccd8c44771b6d4c5fe3bb055ee9b36d990d62181a1f9b859b595b307', // Contract owner address private key,
  },
  chainId: 3, // Network Chain ID,
  key: '&6831IlYmK33d', // Security Key
  percent: 25 // Fee Percentage
};