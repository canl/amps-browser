export interface AMPSServer {
  name: string;
  host: string;
  tcpPort: number;
  websocketPort: number;
  adminPort: number;
  ampsUrl: string; // Keep for backward compatibility
  getWebSocketUrl: (messageFormat: string) => string; // Dynamic URL generation
}

export interface AMPSTopic {
  name: string;
  messageType: string;
  key: string;
  fileName?: string;
}

export const AMPS_SERVERS: AMPSServer[] = [
  {
    name: "Google Clooud AMPS (Dev)",
    host: "34.68.65.149",
    tcpPort: 9007,
    websocketPort: 9008,
    adminPort: 8085,
    ampsUrl: "ws://34.68.65.149:9008/amps/json", // Default for backward compatibility
    getWebSocketUrl: (messageFormat: string) => `ws://34.68.65.149:9008/amps/${messageFormat}`
  },
  {
    name: "Google Clooud AMPS (Dev 2)",
    host: "34.68.65.150",
    tcpPort: 9007,
    websocketPort: 9008,
    adminPort: 8085,
    ampsUrl: "ws://34.68.65.150:9008/amps/json", // Default for backward compatibility
    getWebSocketUrl: (messageFormat: string) => `ws://34.68.65.150:9008/amps/${messageFormat}`
  }
  // Additional servers can be added here
];

// Topics will be fetched dynamically from AMPS admin interface
// export const AMPS_TOPICS: AMPSTopic[] = [];

export enum AMPSCommand {
  QUERY = "sow",
  SUBSCRIBE = "subscribe", 
  QUERY_SUBSCRIBE = "sow_and_subscribe",
  SOW_STATS = "sow_stats"
}

export interface AMPSQueryOptions {
  filter?: string;
  orderBy?: string;
  bookmark?: string;
  options?: string;
}
