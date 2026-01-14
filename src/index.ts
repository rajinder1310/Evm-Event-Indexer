
import { config } from './config';
import { IndexerService } from './services/indexer';

const indexer = new IndexerService(config.rpcUrl);

async function main() {
  console.log('Starting EVM Event Indexer...');
  await indexer.start();
}

main().catch(console.error);
