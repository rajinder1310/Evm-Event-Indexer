# EVM Event Indexer

A robust and scalable TypeScript service designed to index and process events from EVM-compatible blockchains (like Ethereum, BSC, Polygon) in real-time. It uses **Ethers.js** for blockchain interaction and **MongoDB** for data persistence.

## 🚀 Features

*   **Real-time Indexing**: Listens for specific smart contract events (`Deposit`, `Withdraw`, etc.) as they happen.
*   **Auto-Resume**: Automatically picks up from the last indexed block after a restart, ensuring no data is lost.
*   **Reorg Protection**: Waits for a configurable number of block confirmations to handle chain reorganizations safely.
*   **Adaptive Batching**: Dynamically adjusts the number of blocks fetched based on network performance to optimize speed and avoid timeouts.
*   **Prefetching**: Optimizes performance by pre-fetching the next batch of logs while processing the current one.
*   **Duplicate Prevention**: Handles duplicate events gracefully to ensure data integrity.

## 🛠 Prerequisites

Before running this project, ensure you have the following installed:

*   **Node.js** (v18 or higher recommended)
*   **MongoDB** (Local instance or Atlas cluster)

## 📦 Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd Evm-Event-Indexer
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Copy the example environment file and configure it:
    ```bash
    cp .env.example .env
    ```
    Open `.env` and set your MongoDB URI:
    ```env
    MONGO_URI=mongodb://localhost:27017/evm_indexer
    # RPC_URL=https://... (Optional default)
    ```

## ⚙️ Configuration

The service is configured via `src/config.ts`. You can add or modify chain configurations in the `chains` array.

**Example Chain Config:**
```typescript
{
  chainId: 97,
  name: 'bsc-testnet',
  rpcUrl: 'https://...', // Your RPC Endpoint
  contractAddress: '0x...', // Smart Contract Address to index
  abi: [ ... ], // ABI of the events you want to track
  startBlock: 46618600, // Block number to start indexing from
  maxBlockRange: 1000 // Max blocks to query at once
}
```

## ▶️ Usage

### Development Mode
Run the service with hot-reloading (uses `ts-node`):
```bash
npm run dev
```

### Production Build
Build the TypeScript code and run the compiled JavaScript:
```bash
npm run build
npm start
```

## 📂 Project Structure

*   `src/index.ts`: Entry point of the application. Connects to DB and starts the indexer.
*   `src/services/ChainIndexer.ts`: Core logic for indexing a single chain.
*   `src/config.ts`: Configuration for supported chains and database.
*   `src/models/Event.ts`: Mongoose schema for storing indexed events.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the ISC License.
