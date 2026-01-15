
import dotenv from 'dotenv';

dotenv.config();

export const config: import('./types').IndexerConfig = {
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/evm_indexer',
  chains: [
    {
      chainId: 97,
      name: 'bsc-testnet',
      rpcUrl: process.env.RPC_URL || 'https://go.getblock.io/249044a4781c46c3ae5e02f6958f745e',
      contractAddress: '0xBF77d35c0ED55A08Ca850d667B072a2B746e9a99',
      abi: [
        "event Deposit(address indexed user, uint256 amount, uint256 timestamp)",
        "event Withdraw(address indexed user, uint256 amount, uint256 timestamp)"
      ],
      startBlock: 46618600,
      maxBlockRange: 1000
    },
    // <--- Add new chain configurations here
    // {
    //   chainId: 1,
    //   name: 'ethereum-mainnet',
    //   ...
    // }
  ]
};
