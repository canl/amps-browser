import { useState, useCallback, useEffect } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import {
  Box,
  Typography,
  Stack,
  AppBar,
  Toolbar,
  Backdrop,
  CircularProgress,
} from '@mui/material';

import { muiTheme } from './theme/muiTheme';
import { AMPSServer, AMPSCommand, AMPSQueryOptions } from './config/amps-config';
import { useAMPS } from './hooks/useAMPS';
import { useTopics } from './hooks/useTopics';
import { CompactQueryBar } from './components/CompactQueryBar';
import { DataGrid } from './components/DataGrid';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NotificationToast, useNotifications } from './components/NotificationToast';
import './App.css';

function App() {
  const [selectedServer, setSelectedServer] = useState<AMPSServer | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [selectedCommand, setSelectedCommand] = useState<AMPSCommand | ''>(AMPSCommand.QUERY); // Default to Query (SOW)
  const [queryOptions, setQueryOptions] = useState<AMPSQueryOptions>({});

  const {
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
  } = useAMPS();

  const { notifications, addNotification, dismissNotification } = useNotifications();
  const { availableTopics } = useTopics(connectionState);

  // Development debug functions (only in development mode)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      (window as any).debugAMPSTopic = (topic: string) => debugTopic(topic);
      (window as any).testMarketData = () => debugTopic('market_data');
      (window as any).getAMPSClientName = () => {
        const clientName = getClientName();
        console.log(`🏷️ AMPS Client Name: ${clientName}`);
        return clientName;
      };

      (window as any).testFilter = (filter: string) => {
        console.log(`🧪 Testing filter: ${filter}`);
        setQueryOptions(prev => ({ ...prev, filter }));
        console.log('💡 Filter set. Now execute a query to test it.');
      };

      return () => {
        delete (window as any).debugAMPSTopic;
        delete (window as any).testMarketData;
        delete (window as any).getAMPSClientName;
        delete (window as any).testFilter;
      };
    }
  }, [debugTopic, getClientName]);

  const handleConnect = useCallback(async () => {
    if (selectedServer) {
      try {
        await connect(selectedServer);
        addNotification({
          type: 'success',
          title: 'Connected',
          message: `Successfully connected to ${selectedServer.name}`
        });
      } catch (error) {
        console.error('Connection failed:', error);
        addNotification({
          type: 'error',
          title: 'Connection Failed',
          message: error instanceof Error ? error.message : 'Failed to connect to AMPS server'
        });
      }
    }
  }, [selectedServer, connect, addNotification]);

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect();
      // Clear all state and data when disconnecting
      setSelectedTopic('');
      setSelectedCommand('');
      setQueryOptions({});
      clearData(); // Clear data grid to avoid showing stale data
      addNotification({
        type: 'info',
        title: 'Disconnected',
        message: 'Disconnected from AMPS server. Data grid cleared.'
      });
    } catch (error) {
      console.error('Disconnect failed:', error);
      addNotification({
        type: 'error',
        title: 'Disconnect Failed',
        message: error instanceof Error ? error.message : 'Failed to disconnect from server'
      });
    }
  }, [disconnect, clearData, addNotification]);

  const handleExecute = useCallback(async () => {
    if (selectedCommand && selectedTopic) {
      try {
        await executeCommand(selectedCommand, selectedTopic, queryOptions);
        addNotification({
          type: 'success',
          title: 'Command Executed',
          message: `${selectedCommand} command executed successfully on topic ${selectedTopic}`
        });
      } catch (error) {
        console.error('Execution failed:', error);
        addNotification({
          type: 'error',
          title: 'Execution Failed',
          message: error instanceof Error ? error.message : 'Failed to execute command'
        });
      }
    }
  }, [selectedCommand, selectedTopic, queryOptions, executeCommand, addNotification]);

  const handleStop = useCallback(async () => {
    try {
      await stopExecution();
      addNotification({
        type: 'info',
        title: 'Stopped',
        message: 'All active subscriptions have been stopped'
      });
    } catch (error) {
      console.error('Stop failed:', error);
      addNotification({
        type: 'error',
        title: 'Stop Failed',
        message: error instanceof Error ? error.message : 'Failed to stop execution'
      });
    }
  }, [stopExecution, addNotification]);

  // Handle command selection with data grid clearing
  const handleCommandSelect = useCallback((command: AMPSCommand | '') => {
    // Clear data grid when switching command types to avoid showing stale data
    clearData();
    setSelectedCommand(command);

    // Add notification for user feedback
    if (command) {
      addNotification({
        type: 'info',
        title: 'Command Changed',
        message: `Switched to ${command} command. Data grid cleared.`
      });
    }
  }, [clearData, addNotification]);

  // Handle topic selection with data grid clearing
  const handleTopicSelect = useCallback((topic: string) => {
    // Clear data grid when switching topics to avoid showing stale data
    if (topic !== selectedTopic) {
      clearData();
      setSelectedTopic(topic);

      // Add notification for user feedback
      if (topic) {
        addNotification({
          type: 'info',
          title: 'Topic Changed',
          message: `Switched to topic ${topic}. Data grid cleared.`
        });
      }
    }
  }, [selectedTopic, clearData, addNotification]);

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <ErrorBoundary>
        <Box sx={{ flexGrow: 1, minHeight: '100vh', backgroundColor: 'background.default' }}>
          {/* Bloomberg Terminal Style App Bar */}
          <AppBar position="static" elevation={0}>
            <Toolbar>
              <Box
                component="img"
                src="/favicon.ico"
                alt="AMPS Browser"
                sx={{
                  width: 30,
                  height: 30,
                  mr: 2,
                  '&:hover': {
                    opacity: 0.8,
                  },
                }}
              />
              <Box>
                <Typography variant="h5" component="h1" fontWeight={600}>
                  AMPS Browser
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, fontSize: '0.6875rem', letterSpacing: '0.1em' }}>
                  ADVANCED MESSAGE PROCESSING SYSTEM - REAL-TIME DATA TERMINAL
                </Typography>
              </Box>
            </Toolbar>
          </AppBar>

          {/* Main Content - Full Width Layout */}
          <Box
            sx={{
              width: '100%',
              height: 'calc(100vh - 64px)', // Full height minus AppBar
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Compact Query Bar - Fixed Height */}
            <Box sx={{ flexShrink: 0, p: 2 }}>
              <CompactQueryBar
                selectedServer={selectedServer}
                onServerSelect={setSelectedServer}
                connectionState={connectionState}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                selectedTopic={selectedTopic}
                onTopicSelect={handleTopicSelect}
                availableTopics={availableTopics}
                selectedCommand={selectedCommand}
                onCommandSelect={handleCommandSelect}
                queryOptions={queryOptions}
                onOptionsChange={setQueryOptions}
                executionState={executionState}
                fieldErrors={fieldErrors}
                onExecute={handleExecute}
                onStop={handleStop}
                onNotification={addNotification}
                onClearFieldErrors={clearFieldErrors}
              />
            </Box>

            {/* Data Grid - Flexible Height */}
            <Box
              sx={{
                flex: 1,
                px: 2,
                pb: 2,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <DataGrid
                data={gridData}
                isLoading={executionState.isExecuting}
                onClearData={clearData}
              />
            </Box>
          </Box>

          {/* Notifications */}
          <NotificationToast
            notifications={notifications}
            onDismiss={dismissNotification}
          />

          {/* Loading Backdrop */}
          <Backdrop
            sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
            open={connectionState.isConnecting}
          >
            <Stack alignItems="center" spacing={2}>
              <CircularProgress color="inherit" />
              <Typography variant="h6">
                Connecting to AMPS server...
              </Typography>
            </Stack>
          </Backdrop>
        </Box>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
