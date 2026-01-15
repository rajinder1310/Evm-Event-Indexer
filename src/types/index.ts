
export interface ChainConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  contractAddress: string;
  abi: any[]; // ABI array
  startBlock: number;
  maxBlockRange?: number; // Optional: limit block range per fetch
}

export interface IndexerConfig {
  mongoUri: string;
  chains: ChainConfig[];
}
