import React, { useState } from 'react';
import {
  Box,
  Card,
  Divider,
  Stack,
  Collapse,
  TextField,
  Button,
  ButtonGroup,
  Typography,
} from '@mui/material';
import {
  FilterAlt as FilterIcon,
  Sort as SortIcon,
  Bookmark as BookmarkIcon,
  Clear as ClearIcon,
  Topic as TopicIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { AMPSServer, AMPSCommand, AMPSQueryOptions, AMPSTopic } from '../config/amps-config';
import { AMPSConnectionState, ExecutionState, NotificationFunction } from '../types/amps-types';
import { ServerConnection } from './ServerConnection';
import { TopicSelection } from './TopicSelection';
import { CommandConfiguration } from './CommandConfiguration';
import { SectionToolbar } from './common/Toolbar';

interface CompactQueryBarProps {
  // Server props
  selectedServer: AMPSServer | null;
  onServerSelect: (server: AMPSServer) => void;
  connectionState: AMPSConnectionState;
  onConnect: () => void;
  onDisconnect: () => void;

  // Topic props
  selectedTopic: string;
  onTopicSelect: (topic: string) => void;
  availableTopics: AMPSTopic[];

  // Command props
  selectedCommand: AMPSCommand | '';
  onCommandSelect: (command: AMPSCommand | '') => void;

  // Query options props
  queryOptions: AMPSQueryOptions;
  onOptionsChange: (options: AMPSQueryOptions) => void;

  // Execution props
  executionState: ExecutionState;
  onExecute: () => void;
  onStop: () => void;

  // Error handling props
  fieldErrors: {
    filter?: string;
    orderBy?: string;
    bookmark?: string;
    options?: string;
  };
  onClearFieldErrors: () => void;

  // Notification props
  onNotification: NotificationFunction;
}

// Predefined filter examples for quick access
const QUICK_FILTERS = {
  SAVED_QUERIES: [
    '/symbol = \'GSK\'',
    '/symbol IN (\'GSK\', \'GOOGL\')',
    '/bid > 200 AND /bid < 300',
    '/ask IS NOT NULL'
  ],
  ADVANCED_EXAMPLES: [
    '/extra/hello BEGINS WITH(\'wo\')',     // Nested field with BEGINS WITH
    'INSTR_I(/symbol, \'gsk\') != 0',       // Case-insensitive string search
    'LENGTH(/symbol) = 3',                  // String length function
    '/symbol = \'AAPL\'',                   // Simple equality
    '/price > 100 AND /volume > 1000000',  // Multiple conditions
  ]
} as const;

export const CompactQueryBar: React.FC<CompactQueryBarProps> = ({
  selectedServer,
  onServerSelect,
  connectionState,
  onConnect,
  onDisconnect,
  selectedTopic,
  onTopicSelect,
  availableTopics,
  selectedCommand,
  onCommandSelect,
  queryOptions,
  onOptionsChange,
  executionState,
  fieldErrors,
  onExecute,
  onStop,
  onNotification,
  onClearFieldErrors,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const isExecuteDisabled = !connectionState.isConnected || !selectedTopic || !selectedCommand;
  const isAdvancedLocked = executionState.isExecuting;

  const handleAdvancedFieldClick = () => {
    if (isAdvancedLocked) {
      onNotification({
        type: 'warning',
        title: 'Advanced Options Locked',
        message: 'Advanced query options are locked during active subscriptions. Click Stop to modify options.'
      });
    }
  };

  const handleShowAdvanced = () => {
    setShowAdvanced(!showAdvanced);
  };

  return (
    <Card
      elevation={3}
      sx={{
        mb: 3,
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Box sx={{ p: 3 }}>
        {/* Combined: Connection, Server Management, Topic Selection & Command Configuration */}
        <SectionToolbar
          title="AMPS Server Connection & Query Configuration"
          icon={<TopicIcon fontSize="small" />}
          defaultExpanded={true}
        >
          <Stack spacing={3}>
            {/* Row 1: Connection & Server Management */}
            <ServerConnection
              selectedServer={selectedServer}
              onServerSelect={onServerSelect}
              connectionState={connectionState}
              onConnect={onConnect}
              onDisconnect={onDisconnect}
            />

            {/* Row 2: Topic Selection & Command Configuration */}
            <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems="stretch">
              {/* Topic Selection */}
              <TopicSelection
                selectedTopic={selectedTopic}
                onTopicSelect={onTopicSelect}
                availableTopics={availableTopics}
                connectionState={connectionState}
                executionState={executionState}
                onNotification={onNotification}
              />

              {/* Command Configuration & Execution */}
              <CommandConfiguration
                selectedCommand={selectedCommand}
                onCommandSelect={onCommandSelect}
                connectionState={connectionState}
                executionState={executionState}
                onExecute={onExecute}
                onStop={onStop}
                onShowAdvanced={handleShowAdvanced}
                showAdvanced={showAdvanced}
                isExecuteDisabled={isExecuteDisabled}
                onNotification={onNotification}
              />
            </Stack>

            {/* Row 3: Advanced Query Options (Collapsible) */}
            <Collapse in={showAdvanced}>
              <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <SettingsIcon fontSize="small" />
                  Advanced Query Options
                </Typography>
                <Box sx={{ position: 'relative' }}>
                  <Stack spacing={2}>
                  {/* Filter Expression */}
                  <TextField
                    label="Content Filter"
                    value={queryOptions.filter || ''}
                    onChange={(e) => {
                      // Clear filter error when user starts typing
                      if (fieldErrors.filter) {
                        onClearFieldErrors();
                      }
                      onOptionsChange({ ...queryOptions, filter: e.target.value });
                    }}
                    placeholder="e.g., /symbol = 'GSK' or /bid > 200 AND /bid < 300"
                    disabled={!connectionState.isConnected || executionState.isExecuting}
                    fullWidth
                    error={!!fieldErrors.filter}
                    slotProps={{
                      input: {
                        startAdornment: <FilterIcon sx={{ mr: 1, color: fieldErrors.filter ? 'error.main' : 'text.secondary' }} />,
                      }
                    }}
                    helperText={fieldErrors.filter || "Sets the content filter to be applied to the subscription. Use lowercase field names with leading slash. Supports functions like BEGINS WITH, INSTR_I, LENGTH, etc."}
                  />

                  {/* Quick Filter Buttons */}
                  <Box>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      Quick Filters:
                    </Typography>
                    <ButtonGroup variant="outlined" size="small">
                      <Button
                        onClick={() => onOptionsChange({ ...queryOptions, filter: '' })}
                        disabled={!connectionState.isConnected || executionState.isExecuting}
                        title="Clear filter"
                      >
                        <ClearIcon />
                      </Button>
                      <Button
                        onClick={() => onOptionsChange({ ...queryOptions, filter: QUICK_FILTERS.SAVED_QUERIES[0] })}
                        disabled={!connectionState.isConnected || executionState.isExecuting}
                        title="/symbol = 'GSK'"
                      >
                        GSK
                      </Button>
                      <Button
                        onClick={() => onOptionsChange({ ...queryOptions, filter: QUICK_FILTERS.SAVED_QUERIES[1] })}
                        disabled={!connectionState.isConnected || executionState.isExecuting}
                        title="/symbol IN ('GSK', 'GOOGL')"
                      >
                        Multi-Symbol
                      </Button>
                      <Button
                        onClick={() => onOptionsChange({ ...queryOptions, filter: QUICK_FILTERS.SAVED_QUERIES[2] })}
                        disabled={!connectionState.isConnected || executionState.isExecuting}
                        title="/bid > 200 AND /bid < 300"
                      >
                        Bid Range
                      </Button>
                      <Button
                        onClick={() => onOptionsChange({ ...queryOptions, filter: QUICK_FILTERS.ADVANCED_EXAMPLES[0] })}
                        disabled={!connectionState.isConnected || executionState.isExecuting}
                        title="/extra/hello BEGINS WITH('wo')"
                        size="small"
                      >
                        Advanced
                      </Button>
                    </ButtonGroup>
                  </Box>

                  {/* Additional Options Row */}
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      label="Order By"
                      value={queryOptions.orderBy || ''}
                      onChange={(e) => {
                        // Clear orderBy error when user starts typing
                        if (fieldErrors.orderBy) {
                          onClearFieldErrors();
                        }
                        onOptionsChange({ ...queryOptions, orderBy: e.target.value });
                      }}
                      placeholder="e.g., /orderDate DESC, /customerName ASC"
                      disabled={!connectionState.isConnected || executionState.isExecuting}
                      error={!!fieldErrors.orderBy}
                      slotProps={{
                        input: {
                          startAdornment: <SortIcon sx={{ mr: 1, color: fieldErrors.orderBy ? 'error.main' : 'text.secondary' }} />,
                        }
                      }}
                      sx={{ flex: 1 }}
                      helperText={fieldErrors.orderBy || "Orders the results returned as specified"}
                    />
                    <TextField
                      label="Bookmark"
                      value={queryOptions.bookmark || ''}
                      onChange={(e) => {
                        // Clear bookmark error when user starts typing
                        if (fieldErrors.bookmark) {
                          onClearFieldErrors();
                        }
                        onOptionsChange({ ...queryOptions, bookmark: e.target.value });
                      }}
                      placeholder="Bookmark reference"
                      disabled={!connectionState.isConnected || executionState.isExecuting}
                      error={!!fieldErrors.bookmark}
                      slotProps={{
                        input: {
                          startAdornment: <BookmarkIcon sx={{ mr: 1, color: fieldErrors.bookmark ? 'error.main' : 'text.secondary' }} />,
                        }
                      }}
                      sx={{ flex: 1 }}
                      helperText={fieldErrors.bookmark || "Sets the historical point in the SOW at which to query"}
                    />
                  </Stack>

                  {/* Options Field */}
                  <TextField
                    label="Options"
                    value={queryOptions.options || ''}
                    onChange={(e) => {
                      // Clear options error when user starts typing
                      if (fieldErrors.options) {
                        onClearFieldErrors();
                      }
                      onOptionsChange({ ...queryOptions, options: e.target.value });
                    }}
                    placeholder="e.g., top_n=500,conflation=3000ms,oof (default: top_n=100)"
                    disabled={!connectionState.isConnected || executionState.isExecuting}
                    fullWidth
                    error={!!fieldErrors.options}
                    slotProps={{
                      input: {
                        startAdornment: <SettingsIcon sx={{ mr: 1, color: fieldErrors.options ? 'error.main' : 'text.secondary' }} />,
                      }
                    }}
                    helperText={fieldErrors.options || "Comma-separated list of options. Controls record limits (top_n=100), conflation (conflation=3000ms), and other settings (oof). Defaults to 'top_n=100' if empty."}
                  />
                  </Stack>

                  {/* Transparent overlay to capture clicks when locked */}
                  {isAdvancedLocked && (
                    <Box
                      onClick={handleAdvancedFieldClick}
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 1,
                        cursor: 'pointer',
                        backgroundColor: 'transparent',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.04)'
                        }
                      }}
                    />
                  )}
                </Box>
              </Box>
            </Collapse>
          </Stack>
        </SectionToolbar>
      </Box>
    </Card>
  );
};
