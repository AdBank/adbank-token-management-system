module.exports = {
  db: {
    url: process.env.MONGO_URI || 'mongodb://mongo:27017/adbank'
  },
  web3: {
    ipc: {
      provider: process.env.WEB3_PROVIDER || '/home/ubuntu/.ethereum/testnet/geth.ipc' // Network IPC Provider
    },
    rpc: {
      provider: process.env.WEB3_RPC_PROVIDER || 'http://localhost:8545/'
    }
  },
  contract: {
    abi: process.env.CONTRACT_ABI || 'abi.json', // Contract ABI
    owner_address:
      process.env.CONTRCT_OWNER_ADDRESS ||
      '0xf3399d84571fac96eed37cd4b50baee807b67360', // Contract Owner Address
    address:
      process.env.CONTRACT_ADDRESS ||
      '0xb33493741ebb166a29ed471746e03dd113074722', // Address where contract is deployed
    privateKey: process.env.CONTRACT_PK || 'f5fac598ccd8c44771b6d4c5fe3bb055ee9b36d990d62181a1f9b859b595b307', // Contract owner private key
    decimals: process.env.CONTRACT_DEC || 18 // Token decimals
  },
  networkWallet: {
    // Gas Holder
    address:
      process.env.NET_WALLET_ADDRESS ||
      '0xf3399d84571fac96eed37cd4b50baee807b67360', // Typically used to send eth to internal wallet
    privateKey: process.env.NET_WALLET_PK || 'f5fac598ccd8c44771b6d4c5fe3bb055ee9b36d990d62181a1f9b859b595b307' // Network Wallet private key ( You can use contract owner as master eth account )
  },
  revenueWallet: {
    address:
      process.env.REV_WALLET_ADDRESS ||
      '0xf3399d84571fac96eed37cd4b50baee807b67360',
    privateKey: process.env.REV_WALLET_PK || 'f5fac598ccd8c44771b6d4c5fe3bb055ee9b36d990d62181a1f9b859b595b307'
  },
  chainId: process.env.CHAIN_ID || 3, // Network Chain ID,
  key: process.env.KEY || '&6831IlYmK33d', // Security Key
  percent: process.env.FEE_PERCENT || 25 // Fee Percentage
};
