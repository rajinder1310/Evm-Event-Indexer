
import { ChainIndexer } from '../services/ChainIndexer';
import { ChainConfig } from '../types';
import mongoose from 'mongoose';
import dotenv from 'dotenv';


dotenv.config();

// Minimal ABI for Deposit / Withdraw
// Adjust if the contract uses different signatures (e.g. Deposit(address,uint256) is common)
const TEST_ABI = [
  { "inputs": [{ "internalType": "address", "name": "_usdtToken", "type": "address" }, { "internalType": "address", "name": "_clientWallet", "type": "address" }, { "internalType": "address", "name": "_feeWallet", "type": "address" }, { "internalType": "address", "name": "_withdrawWallet", "type": "address" }, { "internalType": "uint256", "name": "_clientShare", "type": "uint256" }, { "internalType": "uint256", "name": "_feeShare", "type": "uint256" }], "stateMutability": "nonpayable", "type": "constructor" }, { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }], "name": "OwnableInvalidOwner", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "OwnableUnauthorizedAccount", "type": "error" }, { "inputs": [], "name": "ReentrancyGuardReentrantCall", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "token", "type": "address" }], "name": "SafeERC20FailedOperation", "type": "error" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "string", "name": "transactionId", "type": "string" }, { "indexed": true, "internalType": "address", "name": "depositor", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "clientAmount", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "feeAmount", "type": "uint256" }], "name": "Deposit", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" }], "name": "OwnershipTransferred", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "uint256", "name": "newClientShare", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "newFeeShare", "type": "uint256" }], "name": "SharesUpdated", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "newClientWallet", "type": "address" }, { "indexed": true, "internalType": "address", "name": "newFeeWallet", "type": "address" }, { "indexed": true, "internalType": "address", "name": "newWithdrawWallet", "type": "address" }], "name": "WalletsUpdated", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "string", "name": "transactionId", "type": "string" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "fee", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }], "name": "Withdraw", "type": "event" }, { "inputs": [], "name": "clientShare", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "clientWallet", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "string", "name": "transactionId", "type": "string" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "deposit", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "string", "name": "", "type": "string" }], "name": "deposits", "outputs": [{ "internalType": "address", "name": "depositor", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }, { "internalType": "uint256", "name": "timestamp", "type": "uint256" }, { "internalType": "bool", "name": "withdrawn", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "feeShare", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "feeWallet", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "owner", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "string", "name": "", "type": "string" }], "name": "processedTransactionIds", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "renounceOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_clientShare", "type": "uint256" }, { "internalType": "uint256", "name": "_feeShare", "type": "uint256" }], "name": "setShares", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "newOwner", "type": "address" }], "name": "transferOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "usdtToken", "outputs": [{ "internalType": "contract IERC20", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "string", "name": "transactionId", "type": "string" }], "name": "withdraw", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "withdrawWallet", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }
];

async function runTest() {
  // MongoDB Connection
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/evm_indexer';
  if (!mongoose.connection.readyState) {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
  }

  // Config for the test contract
  const testConfig: ChainConfig = {
    chainId: 97, // BSC Testnet
    name: 'BSC-Testnet',
    rpcUrl: 'https://go.getblock.io/249044a4781c46c3ae5e02f6958f745e',
    contractAddress: '0xBF77d35c0ED55A08Ca850d667B072a2B746e9a99',
    abi: TEST_ABI,
    startBlock: 82708560,
    maxBlockRange: 1000
  };

  console.log('--- Starting Test Indexer ---');
  console.log(`Target: ${testConfig.contractAddress}`);

  const indexer = new ChainIndexer(testConfig);

  // Start indexing
  indexer.start();

  // Keep alive for testing
  setInterval(() => { }, 1000);
}

runTest().catch(console.error);
