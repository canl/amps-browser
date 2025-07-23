import { AMPSServer, AMPSCommand, AMPSQueryOptions, AMPSTopic } from '../config/amps-config';
import { AMPSConnectionState, AMPSSubscription } from '../types/amps-types';
import { APP_CONSTANTS } from '../utils/constants';
import { Client, Command } from 'amps';

interface AMPSMessage {
  command: string;
  data: any;
  rawData?: any; // Original raw data before processing
  sowKey?: string; // SOW key if available
  subId: string;
}

export class AMPSService {
  private client: Client | null = null;
  private connectionState: AMPSConnectionState = {
    isConnected: false,
    isConnecting: false
  };
  private currentServer: AMPSServer | null = null;
  private currentMessageFormat: string | null = null;
  private subscriptions: Map<string, AMPSSubscription> = new Map();
  private messageHandlers: Map<string, (message: AMPSMessage) => void> = new Map();
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private mockDataInterval: NodeJS.Timeout | null = null;
  private clientName: string;

  // Configuration for mock behavior - DISABLED for real AMPS integration
  private static readonly ENABLE_MOCK_UPDATES = false; // Disabled - only show real AMPS data
  private static readonly MOCK_UPDATE_PROBABILITY = 0.0; // No mock updates
  private static readonly MOCK_UPDATE_INTERVAL = 5000; // Not used when disabled

  constructor() {
    this.clientName = this.generateUniqueClientName();
    this.handleMessage = this.handleMessage.bind(this);
    this.handleDisconnect = this.handleDisconnect.bind(this);
  }

  /**
   * Generates a unique client name for AMPS connection
   * Format: AMPSBrowser_<timestamp>_<random>_<hostname>
   */
  private generateUniqueClientName(): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'unknown';
    const userAgent = typeof navigator !== 'undefined' ?
      navigator.userAgent.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '') : 'browser';

    return `AMPSBrowser_${timestamp}_${randomId}_${hostname}_${userAgent}`.substring(0, 64);
  }

  async connect(server: AMPSServer): Promise<void> {
    // Use default json format for backward compatibility
    return this.connectWithMessageFormat(server, 'json');
  }

  async connectWithMessageFormat(server: AMPSServer, messageFormat: string): Promise<void> {
    // Check if we're already connected to the same server with the same message format
    if (this.connectionState.isConnected &&
        this.currentServer?.name === server.name &&
        this.currentMessageFormat === messageFormat) {
      console.log(`✅ Already connected to ${server.name} with ${messageFormat} format`);
      return;
    }

    // Disconnect existing connection if switching servers or message formats
    if (this.connectionState.isConnected) {
      console.log(`🔄 Switching connection from ${this.currentMessageFormat} to ${messageFormat} format`);
      await this.disconnect();
    }

    if (this.connectionState.isConnecting) {
      return;
    }

    this.connectionState = {
      isConnected: false,
      isConnecting: true,
      server: server.name
    };

    try {
      // Create and connect real AMPS client with unique name
      this.client = new Client(this.clientName);

      // Generate dynamic WebSocket URL based on message format
      const dynamicUrl = server.getWebSocketUrl(messageFormat);

      console.log(`🔗 AMPS Browser: Connecting to ${server.name}`);
      console.log(`📡 Server: ${dynamicUrl}`);
      console.log(`🎯 Message Format: ${messageFormat}`);
      console.log(`👤 Client Name: ${this.clientName}`);

      // Connect to AMPS server with dynamic URL
      await this.client.connect(dynamicUrl);

      // Log client configuration
      console.log(`✅ AMPS Client connected and ready`);

      this.connectionState = {
        isConnected: true,
        isConnecting: false,
        server: server.name
      };

      // Store current connection details
      this.currentServer = server;
      this.currentMessageFormat = messageFormat;

      this.reconnectAttempts = 0;
      console.log(`✅ Connected to AMPS server: ${server.name} (${messageFormat} format)`);

    } catch (error) {
      this.connectionState = {
        isConnected: false,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      };
      this.currentServer = null;
      this.currentMessageFormat = null;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.mockDataInterval) {
      clearInterval(this.mockDataInterval);
      this.mockDataInterval = null;
    }

    // Clear all subscriptions
    this.subscriptions.clear();
    this.messageHandlers.clear();

    // Disconnect AMPS client
    if (this.client) {
      try {
        await this.client.disconnect();
        this.client = null;
      } catch (error) {
        console.error('Error disconnecting AMPS client:', error);
      }
    }

    this.connectionState = {
      isConnected: false,
      isConnecting: false
    };

    // Clear connection details
    this.currentServer = null;
    this.currentMessageFormat = null;

    console.log('Disconnected from AMPS server');
  }

  async executeCommand(
    command: AMPSCommand,
    topic: string,
    options: AMPSQueryOptions = {},
    messageHandler?: (message: AMPSMessage) => void,
    topicInfo?: AMPSTopic
  ): Promise<string> {
    if (!this.connectionState.isConnected) {
      throw new Error('Not connected to AMPS server');
    }

    // Check if we need to reconnect with a different message format
    if (topicInfo && this.currentServer) {
      const requiredFormat = topicInfo.messageType || 'json';
      if (this.currentMessageFormat !== requiredFormat) {
        console.log(`🔄 Dynamic WebSocket Routing: Topic ${topic} requires ${requiredFormat} format`);
        console.log(`🔄 Current format: ${this.currentMessageFormat} → Required format: ${requiredFormat}`);
        console.log(`🔄 Switching WebSocket endpoint from /amps/${this.currentMessageFormat} to /amps/${requiredFormat}`);
        await this.connectWithMessageFormat(this.currentServer, requiredFormat);
      } else {
        console.log(`✅ WebSocket format match: Topic ${topic} using ${requiredFormat} format (already connected)`);
      }
    }

    try {
      const subscriptionId = `${APP_CONSTANTS.SUBSCRIPTION_ID_PREFIX}${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

      // Register message handler
      if (messageHandler) {
        this.messageHandlers.set(subscriptionId, messageHandler);
      }

      // Store subscription info only for actual subscription commands
      // SOW queries are one-time operations and should not be tracked as active subscriptions
      if (command === AMPSCommand.SUBSCRIBE || command === AMPSCommand.QUERY_SUBSCRIBE) {
        const subscription: AMPSSubscription = {
          id: subscriptionId,
          topic,
          command,
          filter: options.filter,
          options,
          isActive: true
        };
        this.subscriptions.set(subscriptionId, subscription);
        if (process.env.NODE_ENV === 'development') {
          console.log(`📝 Tracking subscription for command: ${command}`);
        }
      } else if (process.env.NODE_ENV === 'development') {
        console.log(`📄 SOW query - not tracking as active subscription for command: ${command}`);
      }

      // Real AMPS integration - no mock data
      this.startRealAMPSSubscription(subscriptionId, topic, command, options, messageHandler);

      return subscriptionId;

    } catch (error) {
      throw error;
    }
  }

  private async startRealAMPSSubscription(
    subscriptionId: string,
    topic: string,
    command: AMPSCommand,
    options: AMPSQueryOptions,
    messageHandler?: (message: AMPSMessage) => void
  ) {
    if (!messageHandler || !this.connectionState.isConnected || !this.client) {
      console.warn(`Cannot start subscription: ${!messageHandler ? 'No message handler' : !this.connectionState.isConnected ? 'Not connected' : 'No client'}`);
      return;
    }

    console.log(`🎯 EXACT TOPIC CHECK: "${topic}"`);
    console.log(`🎯 TOPIC TYPE: ${typeof topic}`);
    console.log(`🎯 TOPIC LENGTH: ${topic.length}`);
    console.log(`🎯 TOPIC CHARS: ${JSON.stringify(topic.split(''))}`);
    console.log(`Starting AMPS subscription for topic: ${topic}, command: ${command}`);
    console.log(`AMPS command string: ${this.getAMPSCommandString(command)}`);

    try {
      // Use the exact same approach as the working debug function
      console.log(`🔄 Creating AMPS command using debug-proven method...`);

      let ampsCommand;
      if (command === AMPSCommand.QUERY || command.toString() === 'sow') {
        // Use the exact same pattern that works in debug
        ampsCommand = new Command('sow');
        ampsCommand.topic(topic);
        console.log(`✅ Using proven SOW command pattern`);
      } else {
        // For other commands, use the original method
        ampsCommand = new Command(this.getAMPSCommandString(command));
        ampsCommand.topic(topic);
        console.log(`✅ Using standard command: ${this.getAMPSCommandString(command)}`);
      }

      // Apply query options
      if (options.filter) {
        // AMPS Filter Syntax (tested and working):
        // - Use lowercase field names with leading slash: /symbol = 'APPL'
        // - Multiple values: /symbol IN ('APPL', 'GOOGL')
        // - Nested fields: /extra/hello BEGINS WITH('wo')
        // - Numeric ranges: /bid > 200 AND /bid < 300
        // - Null checks: /ask IS NOT NULL
        // - String functions: INSTR_I(/symbol, 'APPL') != 0, LENGTH(/symbol) = 3
        ampsCommand.filter(options.filter);
        console.log(`🔍 Applied filter: ${options.filter}`);
        console.log(`📋 Filter will be applied to topic: ${topic}`);
      }
      if (options.orderBy) {
        ampsCommand.orderBy(options.orderBy);
        console.log(`📊 Applied orderBy: ${options.orderBy}`);
      }
      if (options.bookmark) {
        ampsCommand.bookmark(options.bookmark);
        console.log(`📖 Applied bookmark: ${options.bookmark}`);
      }

      // Apply options with command-specific default values
      const optionsValue = options.options || this.getDefaultOptionsForCommand(command);
      ampsCommand.options(optionsValue);
      console.log(`⚙️ Applied ${command} options: ${optionsValue}`);

      // Try to clear any existing subscriptions to avoid conflicts
      try {
        // Force a new connection or clear state
        console.log(`🧹 Attempting to clear any existing subscription state...`);
        // Note: We'll let AMPS handle subscription management
      } catch (error) {
        console.log(`ℹ️ Subscription cleanup note:`, error);
      }

      // Execute the command with message handler (EXACT copy of working debug pattern)
      console.log(`🔄 Executing AMPS command with EXACT debug pattern...`);
      const subId = await this.client.execute(ampsCommand, (message: any) => {
        // Process SOW messages directly for better data extraction
        if (message.c === 'sow' && messageHandler) {

          // Extract data the same way as debug
          let data = null;



          if (typeof message.data === 'function') {
            try {
              data = message.data();
            } catch (error) {
              console.error(`Error extracting SOW data:`, error);
            }
          } else if (message.data && typeof message.data === 'object') {
            data = message.data;
          }

          if (data) {
            // Extract SOW key if available
            let sowKey = null;
            if (message.header && message.header.sowKey && message.header.sowKey()) {
              sowKey = message.header.sowKey();
              // Add SOW key to data for backward compatibility
              if (data && typeof data === 'object') {
                data.key = sowKey;
              }
            }

            // Try to capture raw NVFIX data for SOW messages
            let rawNVFIXString = null;

            // Try to extract raw NVFIX string from payload or reconstruct from parsed data
            if (typeof message.payload === 'function') {
              try {
                rawNVFIXString = message.payload();
              } catch (error) {
                console.error(`Error extracting SOW payload:`, error);
              }
            }

            // If no raw string found, try to reconstruct NVFIX from parsed data
            if (!rawNVFIXString && data && typeof data === 'object') {
              const firstKey = Object.keys(data).find(key => key !== 'key'); // Exclude the SOW key
              if (firstKey && typeof data[firstKey] === 'string' && data[firstKey].includes('&')) {
                rawNVFIXString = `${firstKey}=${data[firstKey]}`;
              }
            }

            // Send to message handler with raw NVFIX data
            messageHandler({
              command: 'sow',
              data: data,
              rawData: rawNVFIXString || data,
              sowKey: sowKey,
              subId: subscriptionId
            });
          }
        } else {
          // For non-SOW messages, use normal processing
          this.handleAMPSMessage(message, messageHandler, subscriptionId);
        }
      });

      console.log(`✅ AMPS command executed successfully, subscription ID: ${subId}`);

      // Store the subscription with the actual AMPS subscription ID
      this.subscriptions.set(subscriptionId, {
        id: subscriptionId,
        topic,
        command,
        isActive: true,
        subId: subId // This is the actual AMPS subscription ID we need for unsubscribe
      });

      console.log(`✅ AMPS subscription started: ${subscriptionId} for topic: ${topic}`);

    } catch (error) {
      console.error(`Failed to start AMPS subscription for ${topic}:`, error);
      messageHandler({
        command: 'error',
        data: { error: `Failed to subscribe to ${topic}: ${error}` },
        subId: subscriptionId
      });
    }
  }

  private getAMPSCommandString(command: AMPSCommand): string {
    const commandStr = command.toString();

    // Map commands to AMPS protocol strings
    switch (commandStr) {
      case AMPSCommand.QUERY:
      case 'sow':
        return 'sow';
      case AMPSCommand.SUBSCRIBE:
      case 'subscribe':
        return 'subscribe';
      case AMPSCommand.QUERY_SUBSCRIBE:
      case 'sow_and_subscribe':
        return 'sow_and_subscribe';
      case AMPSCommand.SOW_STATS:
      case 'sow_stats':
        return 'sow_stats';
      default:
        console.warn(`Unknown command: ${command}, defaulting to 'sow'`);
        return 'sow';
    }
  }

  private handleAMPSMessage(message: any, messageHandler: (message: AMPSMessage) => void, subscriptionId: string) {
    try {
      const commandType = message.header ? message.header.command() : message.c;
      let data = null;
      let rawData = null;



      // Extract raw NVFIX data and processed data
      let rawNVFIXString = null;

      // Try to get raw data from payload function
      if (typeof message.payload === 'function') {
        try {
          rawNVFIXString = message.payload();
        } catch (error) {
          console.error(`Error extracting payload:`, error);
        }
      }

      // Extract processed data
      if (typeof message.data === 'function') {
        try {
          const dataResult = message.data();
          if (typeof dataResult === 'string') {
            rawNVFIXString = dataResult;
          }
          data = dataResult;
        } catch (error) {
          console.error(`Error extracting data:`, error);
        }
      } else if (message.data && typeof message.data === 'object') {
        data = message.data;
      } else if (message.d) {
        data = message.d;
      }

      // If no raw string found, try to reconstruct NVFIX from parsed data
      if (!rawNVFIXString && data && typeof data === 'object') {
        const firstKey = Object.keys(data).find(key => key !== 'key'); // Exclude SOW key
        if (firstKey && typeof data[firstKey] === 'string' && data[firstKey].includes('&')) {
          rawNVFIXString = `${firstKey}=${data[firstKey]}`;
        }
      }

      rawData = rawNVFIXString || data;



      // Extract SOW key if available
      let sowKey = null;
      if (message.header && message.header.sowKey && message.header.sowKey()) {
        sowKey = message.header.sowKey();
        // Add SOW key to data for backward compatibility
        if (data && typeof data === 'object') {
          data.key = sowKey;
        }
      }

      // Convert AMPS message to our internal format
      const internalMessage: AMPSMessage = {
        command: commandType,
        data: data,
        rawData: rawData,
        sowKey: sowKey,
        subId: subscriptionId
      };

      messageHandler(internalMessage);

      // Log different message types
      switch (commandType) {
        case 'group_begin':
          console.log(`📦 SOW group begin for subscription: ${subscriptionId}`);
          break;
        case 'sow':
          console.log(`📄 SOW record received for subscription: ${subscriptionId}`, data);
          break;
        case 'group_end':
          console.log(`📦 SOW group end for subscription: ${subscriptionId}`);
          break;
        case 'oof':
          console.log(`🗑️ OOF (Out of Focus) for subscription: ${subscriptionId}`, data);
          break;
        case 'publish':
          console.log(`📡 Real-time update for subscription: ${subscriptionId}`, data);
          break;
        default:
          console.log(`📨 Message received for subscription: ${subscriptionId}`, commandType, data);
      }
    } catch (error) {
      console.error('Error handling AMPS message:', error);
    }
  }

  // Debug method to test topic subscription
  async debugTopicSubscription(topic: string): Promise<void> {
    if (!this.client || !this.connectionState.isConnected) {
      console.error('❌ Cannot debug - client not connected');
      return;
    }

    try {
      console.log(`🔍 Testing topic subscription for: ${topic}`);

      // Try a simple subscribe first to see if we get any live data
      console.log(`🔄 Testing SUBSCRIBE command for topic: ${topic}`);
      const subscribeCommand = new Command('subscribe');
      subscribeCommand.topic(topic);

      const subId = await this.client.execute(subscribeCommand, (message: any) => {
        console.log(`🎯 SUBSCRIBE message received for ${topic}:`, message);
        console.log(`🎯 Message data:`, message.data);
        console.log(`🎯 Message command:`, message.c || (message.header && message.header.command()));
      });

      console.log(`✅ SUBSCRIBE test created with ID: ${subId}`);

      // Also try SOW after a short delay
      setTimeout(async () => {
        console.log(`🔄 Now testing SOW command for topic: ${topic}`);
        const sowCommand = new Command('sow');
        sowCommand.topic(topic);

        const sowSubId = await this.client!.execute(sowCommand, (message: any) => {
          console.log(`🎯 SOW message received for ${topic}:`, message);
          console.log(`🎯 SOW data:`, message.data);
          console.log(`🎯 SOW command:`, message.c || (message.header && message.header.command()));
        });

        console.log(`✅ SOW test created with ID: ${sowSubId}`);

        // Unsubscribe after delay
        setTimeout(() => {
          if (this.client) {
            this.client.unsubscribe(subId);
            this.client.unsubscribe(sowSubId);
            console.log(`🛑 Test subscriptions unsubscribed`);
          }
        }, 10000);
      }, 2000);

    } catch (error) {
      console.error(`❌ Test subscription failed for ${topic}:`, error);
    }
  }

  async unsubscribe(subscriptionId: string): Promise<void> {
    if (!this.connectionState.isConnected || !this.client) {
      return;
    }

    try {
      // Get the subscription to find the actual AMPS subscription ID
      const subscription = this.subscriptions.get(subscriptionId);

      if (subscription && subscription.subId) {
        // Unsubscribe using the actual AMPS subscription ID
        await this.client.unsubscribe(subscription.subId);
        if (process.env.NODE_ENV === 'development') {
          console.log(`🛑 Unsubscribed from AMPS subscription: ${subscription.subId} (local ID: ${subscriptionId})`);
        }
      }

      // Clean up local state
      this.messageHandlers.delete(subscriptionId);
      if (subscription) {
        subscription.isActive = false;
        this.subscriptions.delete(subscriptionId);
      }

      // Stop mock data generation
      if (this.mockDataInterval) {
        clearInterval(this.mockDataInterval);
        this.mockDataInterval = null;
      }
    } catch (error) {
      console.warn(`Error unsubscribing from ${subscriptionId}:`, error);
      throw error;
    }
  }

  getConnectionState(): AMPSConnectionState {
    return { ...this.connectionState };
  }

  getCurrentConnectionInfo(): { server: AMPSServer | null; messageFormat: string | null; url: string | null } {
    return {
      server: this.currentServer,
      messageFormat: this.currentMessageFormat,
      url: this.currentServer && this.currentMessageFormat
        ? this.currentServer.getWebSocketUrl(this.currentMessageFormat)
        : null
    };
  }

  /**
   * Gets the appropriate default options based on command type
   * @param command AMPS command type
   * @returns Default options string
   */
  private getDefaultOptionsForCommand(command: AMPSCommand): string {
    // Query (SOW): top_n=100 (first 100 messages for historical queries)
    if (command === AMPSCommand.QUERY || command.toString() === 'sow') {
      return 'top_n=500';
    }

    // Subscribe/Query+Subscribe: tail_n=100 (latest 100 messages for live data)
    if (command === AMPSCommand.SUBSCRIBE || command === AMPSCommand.QUERY_SUBSCRIBE) {
      return 'top_n=250';
    }

    // Fallback for other commands
    return 'top_n=100';
  }

  getActiveSubscriptions(): AMPSSubscription[] {
    return Array.from(this.subscriptions.values()).filter(sub => sub.isActive);
  }

  getClientName(): string {
    return this.clientName;
  }

  /**
   * Manually publish data to a topic (for testing purposes)
   * In a real AMPS environment, this would be done by external publishers
   */
  async publishTestData(topic: string, data: any): Promise<void> {
    if (!this.connectionState.isConnected) {
      throw new Error('Not connected to AMPS server');
    }

    // Find all active subscriptions for this topic
    const topicSubscriptions = Array.from(this.subscriptions.values())
      .filter(sub => sub.topic === topic && sub.isActive);

    // Send the data to all subscribers
    topicSubscriptions.forEach(subscription => {
      const handler = this.messageHandlers.get(subscription.id);
      if (handler) {
        handler({
          command: 'p',
          data,
          subId: subscription.id
        });
        console.log(`Published test data to ${topic}:`, data);
      }
    });
  }

  /**
   * Enable or disable mock updates
   */
  static setMockUpdatesEnabled(enabled: boolean): void {
    (AMPSService as any).ENABLE_MOCK_UPDATES = enabled;
  }

  /**
   * Get current mock update settings
   */
  static getMockSettings(): { enabled: boolean; probability: number; interval: number } {
    return {
      enabled: AMPSService.ENABLE_MOCK_UPDATES,
      probability: AMPSService.MOCK_UPDATE_PROBABILITY,
      interval: AMPSService.MOCK_UPDATE_INTERVAL
    };
  }

  private handleMessage(message: AMPSMessage): void {
    const handler = this.messageHandlers.get(message.subId);
    if (handler) {
      handler(message);
    }
  }

  private handleDisconnect(): void {
    this.connectionState = {
      isConnected: false,
      isConnecting: false,
      error: 'Disconnected from server'
    };

    // Mark all subscriptions as inactive
    this.subscriptions.forEach(sub => {
      sub.isActive = false;
    });

    // Attempt reconnection if we have a server
    if (this.connectionState.server && this.reconnectAttempts < APP_CONSTANTS.MAX_RECONNECT_ATTEMPTS) {
      this.attemptReconnect();
    }
  }



  private attemptReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting reconnection ${this.reconnectAttempts}/${APP_CONSTANTS.MAX_RECONNECT_ATTEMPTS}`);

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      
      if (this.connectionState.server) {
        try {
          // Find the server config
          const { AMPS_SERVERS } = await import('../config/amps-config');
          const server = AMPS_SERVERS.find(s => s.name === this.connectionState.server);
          if (server && this.currentMessageFormat) {
            await this.connectWithMessageFormat(server, this.currentMessageFormat);
          } else if (server) {
            await this.connect(server);
          }
        } catch (error) {
          console.error('Reconnection failed:', error);
          if (this.reconnectAttempts < APP_CONSTANTS.MAX_RECONNECT_ATTEMPTS) {
            this.attemptReconnect();
          }
        }
      }
    }, APP_CONSTANTS.DEFAULT_RECONNECT_DELAY);
  }
}
