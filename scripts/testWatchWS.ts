import { clientWS } from '../client/client';
import fs from 'fs/promises';
import path from 'path';
import cliProgress from 'cli-progress';
import chalk from 'chalk';
import readline from 'readline';

interface Block {
  number: bigint | null;
  timestamp: bigint;
}

const args = process.argv.slice(2);
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter the duration in seconds: ', (input) => {
  const durationInSeconds = parseInt(input, 10) || 120; // Default to 120 if input is invalid

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

      // Ensure the logs directory exists
      const logDirPath = path.join(__dirname, '../logs');
      await fs.mkdir(logDirPath, { recursive: true });

      // Append log entry to logs/output.log
      const logFilePath = path.join(logDirPath, 'output.log');
      await fs.appendFile(logFilePath, JSON.stringify(logEntry) + '\n');
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

  rl.close();
});

// Helper function to check if a file exists
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}