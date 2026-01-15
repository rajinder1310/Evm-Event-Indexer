
import { config } from './config';
import { IndexerService } from './services/indexer';
import mongoose from 'mongoose';

const indexer = new IndexerService(config);

async function main() {
  console.log('Starting EVM Event Indexer...');

  // Connect to MongoDB
  await mongoose.connect(config.mongoUri);
  console.log('Connected to MongoDB');

  await indexer.start();
}

main().catch(console.error);
