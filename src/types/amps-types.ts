export interface AMPSMessage {
  c: string; // command
  s: string; // subscription id
  t: string; // topic
  d: any;    // data
  h?: any;   // header
}

export interface AMPSConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  error?: string;
  server?: string;
}

export interface AMPSSubscription {
  id: string;
  topic: string;
  command: string;
  filter?: string;
  options?: any;
  isActive: boolean;
  subId?: string; // AMPS client subscription ID
}

export interface GridData {
  [key: string]: any;
}

export interface NotificationFunction {
  (notification: { type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }): void;
}

export interface ExecutionState {
  isExecuting: boolean;
  activeSubscriptions: AMPSSubscription[];
  error?: string;
  lastExecuted?: Date;
}

export interface AMPSStats {
  records: number;
  topic: string;
  timestamp: Date;
}
