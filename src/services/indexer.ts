
import { JsonRpcProvider } from 'ethers';

export class IndexerService {
  private provider: JsonRpcProvider;

  constructor(rpcUrl: string) {
    this.provider = new JsonRpcProvider(rpcUrl);
  }

  async start() {
    console.log('Indexer service started');
    const blockNumber = await this.provider.getBlockNumber();
    console.log(`Current block number: ${blockNumber}`);
  }
}
