
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  rpcUrl: process.env.RPC_URL || 'http://localhost:8545',
  dbUrl: process.env.DATABASE_URL || 'postgres://localhost:5432/indexer'
};
