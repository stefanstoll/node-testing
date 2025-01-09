import { clientRPC } from '../client/client';
import fs from 'fs';
import path from 'path';

// Function to handle new blocks
const handleNewBlockRPC = (block: any) => {
  // Convert BigInt to Number for timestamp
  const blockTimestamp = new Date(Number(block.timestamp) * 1000).toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3, // Include milliseconds
  });

  const receivedTimestamp = new Date().toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3, // Include milliseconds
  });

  const logEntry = {
    blockNumber: block.number.toString(), // Convert BigInt to string
    blockTimestamp,
    receivedTimestamp,
  };

  const filePath = path.join(__dirname, '../../blockTimestampsRPC.json');

  // Read existing data
  let data = [];
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    data = JSON.parse(fileContent);
  }

  // Append new log entry
  data.push(logEntry);

  // Write updated data back to the file
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  console.log('Logged new block (RPC):', logEntry);
};

// Function to handle errors
const handleErrorRPC = (error: Error) => {
  console.error('Error watching blocks (RPC):', error);
};

// Start watching for new blocks using RPC
const unwatchRPC = clientRPC.watchBlocks({
  blockTag: 'pending',
  poll: true, 
  pollingInterval: 10, 
  onBlock: handleNewBlockRPC,
  onError: handleErrorRPC,
});

// To stop watching, you can call unwatchRPC()
// unwatchRPC();