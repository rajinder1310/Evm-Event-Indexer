
import { IndexerConfig } from '../types';
import { ChainIndexer } from './ChainIndexer';

export class IndexerService {
  private indexers: ChainIndexer[] = [];

  constructor(config: IndexerConfig) {
    this.indexers = config.chains.map(chainConfig => new ChainIndexer(chainConfig));
  }

  async start() {
    console.log(`Starting ${this.indexers.length} chain indexers...`);

    // Start all indexers concurrently
    await Promise.all(this.indexers.map(indexer => indexer.start()));

    console.log('All chain indexers started.');
  }
}
