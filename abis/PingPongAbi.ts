export const PingPongAbi = [
    {
      inputs: [] as const,
      stateMutability: "nonpayable" as const,
      type: "constructor" as const,
    },
    {
      anonymous: false as const,
      inputs: [
        {
          indexed: false as const,
          internalType: "address" as const,
          name: "pinger",
          type: "address" as const,
        },
      ],
      name: "NewPinger" as const,
      type: "event" as const,
    },
    {
      anonymous: false as const,
      inputs: [] as const,
      name: "Ping" as const,
      type: "event" as const,
    },
    {
      anonymous: false as const,
      inputs: [
        {
          indexed: false as const,
          internalType: "bytes32" as const,
          name: "txHash",
          type: "bytes32" as const,
        },
      ],
      name: "Pong" as const,
      type: "event" as const,
    },
    {
      inputs: [
        {
          internalType: "address" as const,
          name: "_pinger",
          type: "address" as const,
        },
      ],
      name: "changePinger" as const,
      outputs: [] as const,
      stateMutability: "nonpayable" as const,
      type: "function" as const,
    },
    {
      inputs: [] as const,
      name: "ping" as const,
      outputs: [] as const,
      stateMutability: "nonpayable" as const,
      type: "function" as const,
    },
    {
      inputs: [] as const,
      name: "pinger" as const,
      outputs: [
        {
          internalType: "address" as const,
          name: "" as const,
          type: "address" as const,
        },
      ],
      stateMutability: "view" as const,
      type: "function" as const,
    },
    {
      inputs: [
        {
          internalType: "bytes32" as const,
          name: "_txHash",
          type: "bytes32" as const,
        },
      ],
      name: "pong" as const,
      outputs: [] as const,
      stateMutability: "nonpayable" as const,
      type: "function" as const,
    },
  ] as const;
  