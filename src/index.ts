
import { ponder } from "@/generated";
import { createPublicClient, createWalletClient, http, type Hash } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
//import type { PonderContext } from "../types";
import { PingPongAbi } from "../abis/PingPongAbi";
import { processedPings, botInfo } from "../ponder.schema";
import { 
  TransactionExecutionError,
  ContractFunctionExecutionError,
  type BaseError 
} from 'viem';



if (!process.env.PONDER_RPC_URL_SEPOLIA) {
  throw new Error("PONDER_RPC_URL_SEPOLIA environment variable is not set");
}

// Configuration
if (!process.env.PRIVATE_KEY) {
  throw new Error("PRIVATE_KEY environment variable is not set");
}

// Remove the 0x prefix if it exists and add it back to ensure consistent format
const privateKeyWithoutPrefix = process.env.PRIVATE_KEY.replace('0x', '');
const PRIVATE_KEY = `0x${privateKeyWithoutPrefix}` as `0x${string}`;

// Validate the length (should be 66 characters including 0x)
if (PRIVATE_KEY.length !== 66) {
  throw new Error("PRIVATE_KEY must be 32 bytes (64 characters + '0x' prefix)");
}

// Validate it's a valid hex string
if (!/^0x[0-9a-fA-F]{64}$/.test(PRIVATE_KEY)) {
  throw new Error("PRIVATE_KEY must be a valid hexadecimal string");
}


const RPC_URL = process.env.PONDER_RPC_URL_SEPOLIA;
const START_BLOCK = process.env.START_BLOCK ? parseInt(process.env.START_BLOCK) : 7035885;
const CONTRACT_ADDRESS = '0xA7F42ff7433cB268dD7D59be62b00c30dEd28d3D';

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 5; // maximum requests per minute
const requestTimestamps: number[] = [];
const MAX_GAS_PRICE = BigInt(100000000000); // 100 GWEI
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000;
const CONFIRMATION_BLOCKS = 2;
const TRANSACTION_TIMEOUT = 60_000;
// Initialize clients
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(RPC_URL)
});

const account = privateKeyToAccount(PRIVATE_KEY);
const walletClient = createWalletClient({
  account,
  chain: sepolia,
  transport: http(RPC_URL)
});

// Rate limiting function
function checkRateLimit(): boolean {
  const now = Date.now();
  
  while (requestTimestamps.length > 0) {
    const oldestTimestamp = requestTimestamps[0];
    if (!oldestTimestamp || oldestTimestamp < now - RATE_LIMIT_WINDOW) {
      requestTimestamps.shift();
    } else {
      break;
    }
  }
  
  if (requestTimestamps.length >= MAX_REQUESTS) {
    return false;
  }
  
  requestTimestamps.push(now);
  return true;
}

// Main event handler
export const pingEventHandler = ponder.on(
  "PingPong:Ping",
  async ({ event, context }) => {
    const db  = context.db as any;
    console.log("====== HANDLER TRIGGERED ======");
    console.log("Block:", event.block.number);
    console.log("Transaction Hash:", event.transaction.hash);
    //console.log("Event Details:", event);
    console.log("==============================");
    //let retries = 0;

    //running checks for DB & Context
    if (!db) {
      console.error("Database is undefined!");
      return;
    }

    if (!db) {
      console.log("DB is undefined!");
      return;
    }
    if (!context) {
      console.error("Context is undefined");
      return;
    }  

    const pingTxHash = event.transaction.hash;
    const blockNumber = Number(event.block.number);
    console.log("New Ping Event:", {
      txHash: pingTxHash,
      blockNumber: blockNumber,
      timestamp: new Date().toISOString()
  });
    console.log("db, processedPings are all good to go! Proceeding...")
    
    try {
      // Check if already processed
      const existingPing = await db.find(processedPings, {
        id: pingTxHash 
       });

      if (existingPing) {
        console.log(`Ping ${pingTxHash} already processed, skipping`);
        return;
      }

      console.log(`Processing Ping event from tx: ${pingTxHash} at block ${blockNumber}`);

      // Create initial record
      await db.insert(processedPings).values({
          id: pingTxHash,
          blockNumber,
          timestamp: Math.floor(Date.now() / 1000),
          status: 'pending',
          retryCount: 0
      });
      // Update the botInfo table with the latest processed block
      const existingBotInfo = await db.find(botInfo, { id: 'randall' });

      if (existingBotInfo) {
        // Update the last processed block
        await db.update(botInfo, { id: 'randall' }).set({
          lastProcessedBlock: blockNumber
        });
        console.log(`Updated bot info with the latest processed block: ${blockNumber}`);
      } else {
        // If bot info doesn't exist, insert a new record
        await db.insert(botInfo).values({
          id: 'randall',
          startBlock: START_BLOCK,
          address: account.address,
          lastProcessedBlock: blockNumber
        });
        console.log(`Inserted new bot info with updated block: ${blockNumber}`);
      }
      if (!checkRateLimit()) {
        await db.update(processedPings, { id: pingTxHash }).set({
            status: 'rate_limited',
            lastError: 'Rate limit reached'
        });
        console.log('Rate limit reached, waiting...');
        return;
    }

        try {
          await publicClient.getBlockNumber();
        } catch (error) {
          await db.update(processedPings, { id: pingTxHash }).set({
              status: 'network_error',
              lastError: 'Network check failed'
          });
          console.log("Network error, will retry later");
          return;
        }

      const gasPrice = await publicClient.getGasPrice();
            if (gasPrice > MAX_GAS_PRICE) {
                await db.update(processedPings, { id: pingTxHash }).set({
                    status: 'gas_too_high',
                    gasPrice: Number(gasPrice),
                    lastError: `Gas price too high: ${gasPrice}`
                });
                console.log(`Gas price too high: ${gasPrice}`);
                return;
            }
      // Get nonce
      const nonce = await publicClient.getTransactionCount({
        address: account.address
    });

    // Update status to sending
    await db.update(processedPings, { id: pingTxHash }).set({
        status: 'sending_pong',
        nonce,
        gasPrice: Number(gasPrice)
    });
      // Send transaction
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: PingPongAbi,
        functionName: 'pong',
        args: [pingTxHash as `0x${string}`]
    });
      console.log(`Sent pong transaction: ${hash}`);

      // Update record with pong hash
      await db.update(processedPings, { id: pingTxHash }).set({
        status: 'pong_sent',
        pongTxHash: hash
    });
    let confirmed = false;
    let retryCount = 0;

            while (!confirmed && retryCount < MAX_RETRIES) {
                try {
                    const receipt = await publicClient.waitForTransactionReceipt({
                        hash,
                        confirmations: CONFIRMATION_BLOCKS,
                        timeout: TRANSACTION_TIMEOUT
                    });

                    if (receipt.status === 'success') {
                        await db.update(processedPings, { id: pingTxHash }).set({
                            status: 'completed'
                        });
                        confirmed = true;
                        console.log(`Processed ping ${pingTxHash} successfully`);
                        const verifiedPing = await db.find(processedPings, {
                          id: pingTxHash 
                         });

                         console.log("Ping verified with the result:", JSON.stringify(verifiedPing, null, 2));

                    } else {
                        throw new Error('Transaction failed');
                    }
                } catch (error: unknown) {
                  retryCount++;
                  let errorMessage = 'Unknown error during confirmation';
                  
                  if (error instanceof Error) {
                      errorMessage = error.message;
                  } else if (typeof error === 'object' && error && 'message' in error) {
                      errorMessage = error.message as string;
                  }
               
                  if (retryCount < MAX_RETRIES) {
                      console.log(`Retry ${retryCount}/${MAX_RETRIES} for transaction ${hash}. Error: ${errorMessage}`);
                      await new Promise(r => setTimeout(r, RETRY_DELAY));
                  } else {
                      await db.update(processedPings, { id: pingTxHash }).set({
                          status: 'failed',
                          retryCount,
                          lastError: `Max retries exceeded: ${errorMessage}`
                      });
                      // Don't throw, let outer catch handle it
                  }
                } 
              }
            }
              catch (error: unknown) {
                  let errorMessage = 'Unknown error in processing';
                  let errorType = 'unknown';
               
                  if (error instanceof TransactionExecutionError) {
                      errorMessage = `Transaction failed: ${error.message}`;
                      errorType = 'transaction_error';
                  } else if (error instanceof ContractFunctionExecutionError) {
                      errorMessage = `Contract error: ${error.message}`;
                      errorType = 'contract_error';
                  } else if (error instanceof Error) {
                      errorMessage = error.message;
                      errorType = error.name;
                  } else if (typeof error === 'object' && error && 'message' in error) {
                      errorMessage = error.message as string;
                  }
               
                  console.error(`Error processing ping ${pingTxHash}:`, {
                      type: errorType,
                      message: errorMessage
                  });
               
                  await db.update(processedPings, { id: pingTxHash }).set({
                      status: 'failed',
                      lastError: errorMessage
                  });
               }
              });
