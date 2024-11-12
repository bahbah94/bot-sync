// types.ts
import type { processedPings, botInfo } from "./ponder.schema";

export type PonderContext = {
  db: {
    processedPings: typeof processedPings;
    botInfo: typeof botInfo;
  };
};