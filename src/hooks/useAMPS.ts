import { useState, useEffect, useCallback, useRef } from 'react';
import { AMPSService } from '../services/amps-service';
import { AMPSServer, AMPSCommand, AMPSQueryOptions, AMPSTopic } from '../config/amps-config';
import { AMPSConnectionState, ExecutionState, GridData } from '../types/amps-types';

interface AMPSMessage {
  command: string;
  data: any;
  subId: string;
}

// Helper function to check if two records match based on SOW key or common fields
const recordsMatch = (existingRecord: GridData, newRecord: GridData): boolean => {
  // First check if both records have a 'key' field (SOW key)
  if (existingRecord.key !== undefined && newRecord.key !== undefined) {
    return existingRecord.key === newRecord.key;
  }

  // If no common key field found, consider records as different
  return false;
};

export const useAMPS = () => {
  const [connectionState, setConnectionState] = useState<AMPSConnectionState>({
    isConnected: false,
    isConnecting: false
  });

  const [executionState, setExecutionState] = useState<ExecutionState>({
    isExecuting: false,
    activeSubscriptions: []
  });

  // Track the current command type to determine execution behavior
  const [currentCommand, setCurrentCommand] = useState<AMPSCommand | null>(null);

  const [gridData, setGridData] = useState<GridData[]>([]);
  const ampsServiceRef = useRef<AMPSService | null>(null);

  // Track field-specific errors for contextual feedback
  const [fieldErrors, setFieldErrors] = useState<{
    filter?: string;
    orderBy?: string;
    bookmark?: string;
    options?: string;
  }>({});

  // Parse AMPS error messages to determine which field caused the error
  const parseAMPSError = useCallback((errorMessage: string) => {
    const lowerError = errorMessage.toLowerCase();

    // Clear previous field errors
    setFieldErrors({});

    // Define error patterns for each field
    const errorPatterns = {
      filter: ['bad filter', 'invalid filter', 'filter syntax', 'parse error', 'syntax error'],
      orderBy: ['order', 'orderby', 'sort'],
      bookmark: ['bookmark', 'invalid bookmark'],
      options: ['option', 'top_n', 'conflation', 'invalid option'],
      general: ['topic', 'not found', 'connection']
    };

    // Check each field type
    for (const [fieldType, patterns] of Object.entries(errorPatterns)) {
      if (patterns.some(pattern => lowerError.includes(pattern))) {
        if (fieldType === 'general') {
          return 'general';
        }

        const errorPrefix = fieldType.charAt(0).toUpperCase() + fieldType.slice(1);
        setFieldErrors({ [fieldType]: `${errorPrefix} Error: ${errorMessage}` });
        return fieldType;
      }
    }

    // Default to filter error for unknown errors
    setFieldErrors({ filter: `AMPS Error: ${errorMessage}` });
    return 'filter';
  }, []);

  // Initialize AMPS service
  useEffect(() => {
    ampsServiceRef.current = new AMPSService();

    return () => {
      if (ampsServiceRef.current) {
        ampsServiceRef.current.disconnect();
      }
    };
  }, []);

  // Sync connection state with AMPS service
  useEffect(() => {
    const syncConnectionState = () => {
      if (!ampsServiceRef.current) return;

      const serviceState = ampsServiceRef.current.getConnectionState();
      setConnectionState(prevState => {
        // Check if any meaningful property has changed
        const hasChanged = Object.keys(serviceState).some(
          key => prevState[key as keyof AMPSConnectionState] !== serviceState[key as keyof AMPSConnectionState]
        );

        return hasChanged ? serviceState : prevState;
      });
    };

    // Sync immediately and set up periodic sync
    syncConnectionState();
    const interval = setInterval(syncConnectionState, 1000);

    return () => clearInterval(interval);
  }, []);

  // Poll connection state
  useEffect(() => {
    const interval = setInterval(() => {
      if (ampsServiceRef.current) {
        const state = ampsServiceRef.current.getConnectionState();
        setConnectionState(state);

        const subscriptions = ampsServiceRef.current.getActiveSubscriptions();
        setExecutionState(prev => {
          // Only keep isExecuting true for subscription-based commands
          const hasActiveSubscriptions = subscriptions.length > 0;
          const isSubscriptionCommand = currentCommand === AMPSCommand.SUBSCRIBE ||
            currentCommand === AMPSCommand.QUERY_SUBSCRIBE;

          const shouldKeepExecuting = prev.isExecuting || (hasActiveSubscriptions && isSubscriptionCommand);

          if (process.env.NODE_ENV === 'development' && prev.isExecuting !== shouldKeepExecuting) {
            console.log(`🔄 Execution state change:`, {
              command: currentCommand,
              hasActiveSubscriptions,
              isSubscriptionCommand,
              wasExecuting: prev.isExecuting,
              willExecute: shouldKeepExecuting
            });
          }

          return {
            ...prev,
            activeSubscriptions: subscriptions,
            isExecuting: shouldKeepExecuting
          };
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const connect = useCallback(async (server: AMPSServer) => {
    if (!ampsServiceRef.current) return;

    try {
      setConnectionState({ isConnecting: true, isConnected: false, error: undefined });
      await ampsServiceRef.current.connect(server);

      // Explicitly set connected state
      setConnectionState({
        isConnected: true,
        isConnecting: false,
        server: server.name,
        error: undefined
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ React state updated - connected to:', server.name);
      }
    } catch (error) {
      console.error('Connection failed:', error);
      setConnectionState({
        isConnected: false,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      });
      // Re-throw the error so the App component can handle it properly
      throw error;
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (!ampsServiceRef.current) return;

    try {
      await ampsServiceRef.current.disconnect();

      // Explicitly set disconnected state
      setConnectionState({
        isConnected: false,
        isConnecting: false,
        error: undefined
      });

      setGridData([]);
      setExecutionState({
        isExecuting: false,
        activeSubscriptions: []
      });

      // Clear the current command
      setCurrentCommand(null);

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Disconnected and React state updated');
      }
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  }, []);

  const executeCommand = useCallback(async (
    command: AMPSCommand,
    topic: string,
    options: AMPSQueryOptions = {},
    topicInfo?: AMPSTopic,
    onNotification?: (notification: { type: 'success' | 'error' | 'info' | 'warning'; title: string; message: string }) => void
  ) => {
    if (!ampsServiceRef.current) {
      throw new Error('AMPS service not initialized');
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 Executing AMPS command: ${command} on topic: ${topic}`, options);
    }

    // Track the current command type
    setCurrentCommand(command);

    // Clear any previous field errors
    setFieldErrors({});

    setExecutionState(prev => ({
      ...prev,
      isExecuting: true,
      error: undefined
    }));

    try {
      // Clear previous data for new queries
      if (command === AMPSCommand.QUERY || command === AMPSCommand.QUERY_SUBSCRIBE) {
        setGridData([]);
      }

      let sowData: GridData[] = [];
      let hasShownSuccessNotification = false; // Track if we've shown success notification

      const messageHandler = (message: AMPSMessage) => {
        const commandType = message.command;
        const data = message.data;

        if (process.env.NODE_ENV === 'development') {
          console.log(`🔄 Processing AMPS message: ${commandType}`, data);
        }

        switch (commandType) {
          case 'group_begin':
            // Start of SOW data group
            sowData = [];
            break;

          case 'sow':
            // SOW record - collect in temporary array
            if (data) {
              sowData.push(data);
              if (process.env.NODE_ENV === 'development') {
                // Log available fields for debugging filters (only for first record to avoid spam)
                if (sowData.length === 1) {
                  console.log('🔍 Available fields in first SOW record:', Object.keys(data));
                  console.log('📄 Sample SOW record:', data);
                  console.log('💡 Filter syntax tip: Use lowercase field names with leading slash, e.g., /symbol = \'APPL\'');
                }
              }
            } else if (process.env.NODE_ENV === 'development') {
              console.warn('⚠️ SOW message received but data is null/undefined');
            }
            break;

          case 'group_end':
            // End of SOW data group - update grid with all SOW data
            if (process.env.NODE_ENV === 'development') {
              console.log(`📦 SOW group end - received ${sowData.length} records`);
            }

            setGridData(sowData);

            // For SOW queries, mark execution as complete and clean up
            if (command === AMPSCommand.QUERY) {
              setExecutionState(prev => ({
                ...prev,
                isExecuting: false,
                lastExecuted: new Date()
              }));

              // Show success notification for completed SOW query
              if (onNotification) {
                onNotification({
                  type: 'success',
                  title: 'Query Completed',
                  message: `SOW query completed successfully on topic ${topic}. Retrieved ${sowData.length} records.`
                });
              }

              // Clean up message handler for completed SOW query
              if (ampsServiceRef.current) {
                // Note: We don't call unsubscribe for SOW queries since they're not tracked as subscriptions
                // The message handler cleanup will happen automatically when the component unmounts
                if (process.env.NODE_ENV === 'development') {
                  console.log('📋 SOW query completed - execution state updated');
                }
              }
            }
            break;

          case 'oof':
            // Out of Focus - remove record
            if (data && data.key) {
              setGridData(prev => prev.filter(item => !recordsMatch(item, data)));
              if (process.env.NODE_ENV === 'development') {
                console.log('🗑️ OOF - removed record:', data);
              }
            }
            break;

          case 'publish':
          case 'p':
          default:
            // Real-time update - update or add record
            if (data) {
              setGridData(prev => {
                const existingIndex = prev.findIndex(item => recordsMatch(item, data));

                if (existingIndex >= 0) {
                  // Update existing record
                  const newData = [...prev];
                  newData[existingIndex] = { ...newData[existingIndex], ...data };
                  if (process.env.NODE_ENV === 'development') {
                    console.log('📡 Updated existing record:', data);
                  }
                  return newData;
                } else {
                  // Add new record
                  if (process.env.NODE_ENV === 'development') {
                    console.log('📡 Added new record:', data);
                  }
                  return [...prev, data];
                }
              });

              // Show success notification on first data received for subscriptions
              if (!hasShownSuccessNotification && onNotification) {
                hasShownSuccessNotification = true;
                if (command === AMPSCommand.SUBSCRIBE) {
                  onNotification({
                    type: 'success',
                    title: 'Subscription Active',
                    message: `Successfully subscribed to topic ${topic}. Receiving real-time updates.`
                  });
                } else if (command === AMPSCommand.QUERY_SUBSCRIBE) {
                  onNotification({
                    type: 'success',
                    title: 'Query + Subscription Active',
                    message: `Successfully started SOW query and subscription on topic ${topic}.`
                  });
                }
              }
            }
            break;

          case 'error':
            console.error('AMPS error:', data);
            const errorMessage = data.error || 'Unknown error occurred';

            // Parse error to determine which field caused it
            const errorField = parseAMPSError(errorMessage);

            if (process.env.NODE_ENV === 'development') {
              console.log('🔄 Setting isExecuting to false due to AMPS error');
              console.log(`❌ AMPS Error - Field: ${errorField}, Message: ${errorMessage}`);
            }

            setExecutionState(prev => ({
              ...prev,
              isExecuting: false,
              error: errorField === 'general' ? errorMessage : undefined // Only show general errors in execution state
            }));

            // Set field-specific errors for UI feedback
            if (errorField !== 'general') {
              setFieldErrors(prev => ({
                ...prev,
                [errorField]: errorMessage
              }));
            }

            // Show error notification for AMPS errors
            if (onNotification) {
              onNotification({
                type: 'error',
                title: 'AMPS Error',
                message: errorMessage
              });
            }
        }
      };

      const subscriptionId = await ampsServiceRef.current.executeCommand(
        command,
        topic,
        options,
        messageHandler,
        topicInfo
      );

      // For subscribe-only commands, keep isExecuting true until user stops
      // For SOW queries, wait for group_end message to set isExecuting false
      if (command === AMPSCommand.SUBSCRIBE) {
        // Keep isExecuting: true for active subscriptions
        setExecutionState(prev => ({
          ...prev,
          lastExecuted: new Date()
          // Note: isExecuting remains true until user clicks Stop
        }));
      }

      return subscriptionId;

    } catch (error) {
      setExecutionState(prev => ({
        ...prev,
        isExecuting: false,
        error: error instanceof Error ? error.message : 'Execution failed'
      }));
      throw error;
    }
  }, []);

  const stopExecution = useCallback(async () => {
    if (!ampsServiceRef.current) return;

    try {
      const activeSubscriptions = ampsServiceRef.current.getActiveSubscriptions();

      // Unsubscribe from all active subscriptions
      await Promise.all(
        activeSubscriptions.map(sub =>
          ampsServiceRef.current!.unsubscribe(sub.id)
        )
      );

      setExecutionState(prev => ({
        ...prev,
        isExecuting: false,
        activeSubscriptions: []
      }));

      // Clear the current command
      setCurrentCommand(null);

    } catch (error) {
      console.error('Stop execution failed:', error);
      setExecutionState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Stop failed'
      }));
    }
  }, []);

  const clearData = useCallback(() => {
    setGridData([]);
  }, []);

  const debugTopic = useCallback(async (topic: string) => {
    if (ampsServiceRef.current) {
      await ampsServiceRef.current.debugTopicSubscription(topic);
    }
  }, []);

  const getClientName = useCallback(() => {
    return ampsServiceRef.current?.getClientName() || 'Not connected';
  }, []);

  const clearFieldErrors = useCallback(() => {
    setFieldErrors({});
  }, []);

  return {
    connectionState,
    executionState,
    gridData,
    fieldErrors,
    connect,
    disconnect,
    executeCommand,
    stopExecution,
    clearData,
    debugTopic,
    getClientName,
    clearFieldErrors
  };
};
