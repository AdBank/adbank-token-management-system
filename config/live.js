module.exports = {
  db: {
    url : 'mongodb://localhost:27017/adbank'
  },
  web3: {
    provider: '/home/ubuntu/.ethereum/testnet/geth.ipc' // Network IPC Provider
  },
  contract: {
    abi: "abi.json", // Contract ABI
    owner_address: '0xf3399d84571fac96eed37cd4b50baee807b67360', // Contract Owner Address
    address: '0xb33493741ebb166a29ed471746e03dd113074722', // Address where contract is deployed
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