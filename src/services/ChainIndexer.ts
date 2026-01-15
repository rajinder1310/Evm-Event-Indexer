
import { JsonRpcProvider, Contract, EventLog, Log } from 'ethers';
import { ChainConfig } from '../types';
import { EventModel } from '../models/Event';

export class ChainIndexer {
  private provider: JsonRpcProvider;
  private contract: Contract;
  private config: ChainConfig;
  private isRunning: boolean = false;
  private currentBlock: number;

  private readonly RETRY_DELAY = 5000;
  private readonly POLL_INTERVAL = 10000;
  private readonly CONFIRMATIONS = 5; // Wait 5 blocks to avoid reorgs

  constructor(config: ChainConfig) {
    this.config = config;
    this.provider = new JsonRpcProvider(config.rpcUrl);
    this.contract = new Contract(config.contractAddress, config.abi, this.provider);
    this.currentBlock = config.startBlock;
  }

  public async start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Auto-resume logic
    const lastIndexed = await this.getLastIndexedBlock();
    if (lastIndexed && lastIndexed > this.currentBlock) {
      this.currentBlock = lastIndexed + 1;
      console.log(`[${this.config.name}] Resuming from saved state: block ${this.currentBlock}`);
    } else {
      console.log(`[${this.config.name}] Starting fresh from config startBlock: ${this.currentBlock}`);
    }

    this.loop();
  }

  private async getLastIndexedBlock(): Promise<number | null> {
    try {
      const latestEvent = await EventModel.findOne({
        chainId: this.config.chainId,
        contractAddress: this.config.contractAddress // Ensure case-insensitivity if needed, but strict for now
      }).sort({ blockNumber: -1 });

      return latestEvent ? latestEvent.blockNumber : null;
    } catch (error) {
      console.error(`[${this.config.name}] Failed to fetch last indexed block:`, error);
      return null;
    }
  }

  /**
   * Main indexing loop.
   * Keeps running while `isRunning` is true.
   * Fetches events, saves them, and handles errors/reorgs.
   */
  private async loop() {
    let currentRange = this.config.maxBlockRange || 1000;
    let nextBatchLogs: Array<EventLog | Log> | null = null; // Cache for pre-fetched logs
    let nextBatchRange: { from: number; to: number } | null = null; // Range of pre-fetched logs

    while (this.isRunning) {
      try {
        const latestBlock = await this.provider.getBlockNumber();
        const safeBlock = latestBlock - this.CONFIRMATIONS; // Block depth to avoid reorgs

        // If caught up, wait for new blocks
        if (this.currentBlock > safeBlock) {
          console.log(`[${this.config.name}] Caught up to safe block ${safeBlock} (latest: ${latestBlock}). Waiting...`);
          await this.sleep(this.POLL_INTERVAL);
          nextBatchLogs = null; // Clear prefetch cache as chain might have moved
          continue;
        }

        // Determine range for current batch
        const endBlock = Math.min(this.currentBlock + currentRange, safeBlock);

        let logs: Array<EventLog | Log> = [];

        // Check if we have valid pre-fetched data
        if (nextBatchLogs && nextBatchRange && nextBatchRange.from === this.currentBlock && nextBatchRange.to === endBlock) {
          logs = nextBatchLogs;
          nextBatchLogs = null;
          nextBatchRange = null;
        } else {
          // No prefetch available, waiting for fetch
          console.log(`[${this.config.name}] Fetching blocks ${this.currentBlock} to ${endBlock} (Range: ${currentRange})`);
          logs = await this.contract.queryFilter('*', this.currentBlock, endBlock);
        }

        // --- PREFETCH NEXT BATCH (Optimization) ---
        // While we save the current batch, start fetching the next one
        const nextStart: number = endBlock + 1;
        const nextEnd = Math.min(nextStart + currentRange, safeBlock);
        let prefetchPromise: Promise<Array<EventLog | Log>> | null = null;

        if (nextStart <= safeBlock) {
          console.log(`[${this.config.name}] Prefetching next blocks ${nextStart} to ${nextEnd}...`);
          prefetchPromise = this.contract.queryFilter('*', nextStart, nextEnd);
        }

        // Save current batch to database
        await this.saveEvents(logs);

        // Update state to move forward
        this.currentBlock = endBlock + 1;

        // Adaptive Batching: Increase range if successful (up to max)
        if (currentRange < (this.config.maxBlockRange || 1000)) {
          currentRange = Math.min(currentRange * 2, this.config.maxBlockRange || 1000);
        }

        // Resolve prefetch promise for next iteration
        if (prefetchPromise) {
          try {
            nextBatchLogs = await prefetchPromise;
            nextBatchRange = { from: nextStart, to: nextEnd };
          } catch (pErr: any) {
            console.warn(`[${this.config.name}] Prefetch failed: ${pErr.message}`);
            nextBatchLogs = null;
            nextBatchRange = null;
          }
        }

      } catch (error: any) {
        console.error(`[${this.config.name}] Error in loop:`, error.message);

        // Clear prefetch on error
        nextBatchLogs = null;
        nextBatchRange = null;

        // Adaptive Batching: Reduce range on error
        if (currentRange > 100) {
          currentRange = Math.floor(currentRange / 2);
          console.log(`[${this.config.name}] Reduced block range to ${currentRange} due to error.`);
        }

        console.log(`[${this.config.name}] Retrying in ${this.RETRY_DELAY}ms...`);
        await this.sleep(this.RETRY_DELAY);
      }
    }
  }

  private async saveEvents(logs: Array<EventLog | Log>) {
    if (logs.length === 0) return;

    console.log(`[${this.config.name}] Found ${logs.length} events. Saving...`);

    const eventsToSave = logs
      .filter((log): log is EventLog => {
        if (log instanceof EventLog) return true;
        console.warn(`[${this.config.name}] Skipping raw Log (ABI mismatch):`, log);
        return false;
      })
      .map(log => ({
        chainId: this.config.chainId,
        contractAddress: log.address,
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
        logIndex: log.index,
        eventName: log.eventName,
        args: this.serializeArgs(log.args),
        createdAt: new Date()
      }));

    if (eventsToSave.length === 0) return;

    try {
      await EventModel.insertMany(eventsToSave, { ordered: false });
      console.log(`[${this.config.name}] Successfully saved ${eventsToSave.length} events.`);
    } catch (error: any) {
      if (error.writeErrors) {
        const duplicates = error.writeErrors.filter((e: any) => e.code === 11000 || e?.err?.code === 11000).length;
        if (duplicates > 0) {
          console.log(`[${this.config.name}] Skipped ${duplicates} duplicate events.`);
        }
        if (error.writeErrors.length > duplicates) {
          throw error;
        }
      } else {
        throw error;
      }
    }
  }

  private serializeArgs(args: any): any {
    if (typeof args === 'bigint') return args.toString();

    if (Array.isArray(args)) return args.map(a => this.serializeArgs(a));

    if (typeof args === 'object' && args !== null) {
      const result: any = {};
      for (const key in args) {
        if (Object.prototype.hasOwnProperty.call(args, key)) {
          result[key] = this.serializeArgs(args[key]);
        }
      }
      return result;
    }
    return args;
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
