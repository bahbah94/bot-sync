import { createConfig } from "@ponder/core";
import { http } from "viem";


import { PingPongAbi } from "./abis/PingPongAbi";
const startBlock = process.env.START_BLOCK ? parseInt(process.env.START_BLOCK) : 7035885; // Default if not set


export default createConfig({
  networks: {
    sepolia: {
      chainId: 11155111, // Chain ID for Sepolia
      transport: http(process.env.PONDER_RPC_URL_SEPOLIA), 
    },
  },
  contracts: {
    PingPong: {
      network: "sepolia",
      abi: PingPongAbi, 
      address: "0xA7F42ff7433cB268dD7D59be62b00c30dEd28d3D", 
      startBlock:startBlock, 
      filter: {
        event: "Ping", 
      },
    },
  },
});

