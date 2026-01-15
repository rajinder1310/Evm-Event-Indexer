
import { IndexerConfig } from '../types';
import { ChainIndexer } from './ChainIndexer';

/**
 * Manages multiple ChainIndexer instances.
 * Reads the configuration and spawns an indexer for each defined chain.
 */
export class IndexerService {
  private indexers: ChainIndexer[] = [];

  constructor(config: IndexerConfig) {
    // Initialize an indexer for each chain in the config
    this.indexers = config.chains.map(chainConfig => new ChainIndexer(chainConfig));
  }

  /**
   * Starts all chain indexers concurrently.
   */
  async start() {
    console.log(`Starting ${this.indexers.length} chain indexers...`);

    // Start all indexers concurrently
    await Promise.all(this.indexers.map(indexer => indexer.start()));

    console.log('All chain indexers started.');
  }
}
