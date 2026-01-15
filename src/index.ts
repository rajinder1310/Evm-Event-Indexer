
import { config } from './config';
import { IndexerService } from './services/indexer';
import mongoose from 'mongoose';

// Initialize the IndexerService with the global configuration
const indexer = new IndexerService(config);

async function main() {
  console.log('Starting EVM Event Indexer...');

  // 1. Connect to MongoDB
  await mongoose.connect(config.mongoUri);
  console.log('Connected to MongoDB');

  // 2. Start the Indexer Service (runs all chain indexers)
  await indexer.start();
}

// Execute main function and catch any startup errors
main().catch(console.error);
