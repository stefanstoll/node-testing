import { clientWS } from '../client/client';
import fs from 'fs/promises';
import path from 'path';
import cliProgress from 'cli-progress';
import chalk from 'chalk';

interface Block {
  number: bigint | null;
  timestamp: bigint;
}

const durationInSeconds = 15; // Set the duration for how long the script should run
let blockCount = 0;
let totalDelay = 0;
let delays: number[] = [];

// Create a new progress bar instance
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
progressBar.start(durationInSeconds, 0);

const handleNewBlockWS = async (block: Block) => {
  try {
    if (block.number === null) {
      console.warn('Received block with null number');
      return;
    }

    const blockTimestamp = new Date(Number(block.timestamp) * 1000);
    const receivedTimestamp = new Date();
    const delay = receivedTimestamp.getTime() - blockTimestamp.getTime();

    blockCount++;
    totalDelay += delay;
    delays.push(delay);

    const logEntry = {
      blockNumber: block.number.toString(),
      blockTimestamp: blockTimestamp.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }),
      receivedTimestamp: receivedTimestamp.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }),
      delay,
    };

    const filePath = path.join(__dirname, '../../blockTimestampsWS.json');
    let data = [];
    if (await fileExists(filePath)) {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      data = JSON.parse(fileContent);
    }
    data.push(logEntry);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error handling new block:', error);
  }
};

const handleErrorWS = (error: Error) => {
  console.error('Error watching blocks (WS):', error);
};

const unwatchWS = clientWS.watchBlocks({
  blockTag: 'pending',
  onBlock: handleNewBlockWS,
  onError: handleErrorWS,
});

// Update progress bar every second
const interval = setInterval(() => {
  progressBar.increment();
}, 1000);

// Stop watching after the specified duration
setTimeout(async () => {
  clearInterval(interval);
  unwatchWS();

  // Ensure the progress bar is complete
  progressBar.update(durationInSeconds);
  progressBar.stop();

  // Calculate statistics
  const avgDelay = totalDelay / blockCount / 1000; // Convert to seconds
  const sortedDelays = [...delays].sort((a, b) => a - b).map(delay => (delay / 1000).toFixed(3)); // Convert to seconds
  const top5LongestDelays = sortedDelays.slice(-5).reverse();
  const top5ShortestDelays = sortedDelays.slice(0, 5);

  console.log(chalk.bold.blue(`\n══════════════════════════════════════════════════════`));
  console.log(chalk.bold.blue(`                    📊 Summary 📊`));
  console.log(chalk.bold.blue(`══════════════════════════════════════════════════════`));
  console.log(chalk.green(`Total blocks processed: `) + chalk.white(`${blockCount}`));
  console.log(chalk.yellow(`Average delay: `) + chalk.white(`${avgDelay.toFixed(3)} seconds`));
  console.log(chalk.red(`Top 4 longest delays: `) + chalk.white(`${top5LongestDelays.join(', ')} seconds`));
  console.log(chalk.cyan(`Top 4 shortest delays: `) + chalk.white(`${top5ShortestDelays.join(', ')} seconds`));
  console.log(chalk.bold.blue(`══════════════════════════════════════════════════════\n`));

  // Exit the process
  process.exit(0);
}, durationInSeconds * 1000);

// Helper function to check if a file exists
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}