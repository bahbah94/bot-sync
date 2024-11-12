
import {onchainTable} from "@ponder/core";

export const processedPings = onchainTable("processedPings", (t) => ({
  id: t.hex().primaryKey(),              
  blockNumber: t.integer().notNull(),     
  timestamp: t.integer().notNull(),       
  status: t.text().notNull(),             
  pongTxHash: t.hex(),
  gasPrice: t.integer(),       // Store gas price used
  nonce: t.integer(),          // Store nonce for transaction tracking
  retryCount: t.integer(),     // Track number of retry attempts
  lastError: t.text()                   
}));

export const botInfo = onchainTable("botInfo", (t) => ({
  id: t.text().primaryKey(),              
  startBlock: t.integer().notNull(),      
  address: t.hex().notNull(),
  lastProcessedBlock: t.integer()              
}));
