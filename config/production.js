module.exports = {
  db: {
    url: process.env.MONGO_URI || 'mongodb://mongo:27017/adbank'
  },
  web3: {
    provider:
      process.env.WEB3_PROVIDER || '/home/ubuntu/.ethereum/testnet/geth.ipc' // Network IPC Provider
  },
  contract: {
    abi: process.env.CONTRACT_ABI || 'abi.json', // Contract ABI
    owner_address:
      process.env.CONTRCT_OWNER_ADDRESS ||
      '0xf3399d84571fac96eed37cd4b50baee807b67360', // Contract Owner Address
    address:
      process.env.CONTRACT_ADDRESS ||
      '0x69c215f4d9940948c257ad45a28032b4b3d5cafd', // Address where contract is deployed
    password: process.env.CONTRACT_PW || 'a', // Contract owner address password
    decimals: process.env.CONTRACT_DEC || 18 // Token decimals
  },
  networkWallet: {
    // Gas Holder
    address:
      process.env.NET_WALLET_ADDRESS ||
      '0xf3399d84571fac96eed37cd4b50baee807b67360', // Typically used to send eth to internal wallet
    password: process.env.NET_WALLET_PW || 'a' // Network Wallet Password ( You can use contract owner as master eth account )
  },
  revenueWallet: {
    address:
      process.env.REV_WALLET_ADDRESS ||
      '0xf3399d84571fac96eed37cd4b50baee807b67360',
    password: process.env.REV_WALLET_PW || 'a'
  },
  chainId: process.env.CHAIN_ID || 3, // Network Chain ID,
  key: process.env.KEY || '&6831IlYmK33d', // Security Key
  percent: process.env.FEE_PERCENT || 25 // Fee Percentage
};
