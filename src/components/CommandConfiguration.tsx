import React from 'react';
import {
  Box,
  Stack,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  ButtonGroup,
  Button,
  Tooltip,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Settings as SettingsIcon,
  Search as QueryIcon,
  Notifications as SubscribeIcon,
  Sync as QuerySubscribeIcon,
  Analytics as StatsIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { AMPSCommand } from '../config/amps-config';
import { AMPSConnectionState, ExecutionState, NotificationFunction } from '../types/amps-types';

export interface CommandConfigurationProps {
  selectedCommand: AMPSCommand | '';
  onCommandSelect: (command: AMPSCommand | '') => void;
  connectionState: AMPSConnectionState;
  executionState: ExecutionState;
  onExecute: () => void;
  onStop: () => void;
  onShowAdvanced: () => void;
  showAdvanced: boolean;
  isExecuteDisabled: boolean;
  onNotification: NotificationFunction;
}

const getCommandIcon = (command: AMPSCommand) => {
  switch (command) {
    case AMPSCommand.QUERY:
      return <QueryIcon color="primary" fontSize="small" />;
    case AMPSCommand.SUBSCRIBE:
      return <SubscribeIcon color="secondary" fontSize="small" />;
    case AMPSCommand.QUERY_SUBSCRIBE:
      return <QuerySubscribeIcon color="success" fontSize="small" />;
    case AMPSCommand.SOW_STATS:
      return <StatsIcon color="info" fontSize="small" />;
    default:
      return null;
  }
};

// Command labels for display
const COMMAND_LABELS = {
  [AMPSCommand.QUERY]: 'Query (SOW)',
  [AMPSCommand.SUBSCRIBE]: 'Subscribe',
  [AMPSCommand.QUERY_SUBSCRIBE]: 'Query + Subscribe',
  [AMPSCommand.SOW_STATS]: 'SOW Stats'
} as const;

const getCommandLabel = (command: AMPSCommand): string => {
  return COMMAND_LABELS[command] || '';
};

export const CommandConfiguration: React.FC<CommandConfigurationProps> = ({
  selectedCommand,
  onCommandSelect,
  connectionState,
  executionState,
  onExecute,
  onStop,
  onShowAdvanced,
  showAdvanced,
  isExecuteDisabled,
  onNotification,
}) => {
  const handleCommandChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Show toast notification if trying to change command during active subscription
    if (executionState.isExecuting) {
      onNotification({
        type: 'warning',
        title: 'Command Locked',
        message: 'Command selection is locked during active subscriptions. Click Stop to change the command.'
      });
      return;
    }
    onCommandSelect(event.target.value as AMPSCommand);
  };

  // Disable command selection during active subscriptions
  const isCommandDisabled = !connectionState.isConnected || executionState.isExecuting;
  const isLocked = executionState.isExecuting;

  const commands = [
    AMPSCommand.QUERY,
    AMPSCommand.SUBSCRIBE,
    AMPSCommand.QUERY_SUBSCRIBE,
    AMPSCommand.SOW_STATS,
  ];

  return (
    <Box sx={{ minWidth: 400, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems="center">
        {/* Command Selection with Radio Buttons */}
        <Tooltip
          title={isLocked ? "Command selection is locked during active subscriptions. Click Stop to change the command." : ""}
          placement="top"
        >
          <Box sx={{
            minWidth: 400,
            position: 'relative',
            // Add visual indication when locked
            ...(isLocked && {
              opacity: 0.7,
              '& .MuiFormControlLabel-root': {
                color: 'text.disabled'
              }
            })
          }}>
            <FormControl component="fieldset" disabled={isCommandDisabled}>
              <FormLabel component="legend" sx={{ mb: 0.5, fontWeight: 'medium', fontSize: '0.875rem' }}>
                {isLocked ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LockIcon fontSize="small" />
                    Command Type (locked during subscription)
                  </Box>
                ) : (
                  "Command Type"
                )}
              </FormLabel>
            <RadioGroup
              value={selectedCommand}
              onChange={handleCommandChange}
              row
              sx={{ gap: 1.5, flexWrap: 'wrap' }}
            >
              {commands.map((command) => (
                <FormControlLabel
                  key={command}
                  value={command}
                  control={<Radio size="small" />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {getCommandIcon(command)}
                      <Typography variant="body2" fontWeight="medium" sx={{ fontSize: '0.875rem' }}>
                        {getCommandLabel(command)}
                      </Typography>
                    </Box>
                  }
                  sx={{ mr: 1 }}
                />
              ))}
            </RadioGroup>

            {/* Transparent overlay to capture clicks when locked */}
            {isLocked && (
              <Box
                onClick={() => onNotification({
                  type: 'warning',
                  title: 'Command Locked',
                  message: 'Command selection is locked during active subscriptions. Click Stop to change the command.'
                })}
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
          </FormControl>
          </Box>
        </Tooltip>

        {/* Execute Button Group */}
        <ButtonGroup variant="contained" size="medium">
          <Button
            startIcon={executionState.isExecuting ? <StopIcon /> : <PlayIcon />}
            onClick={executionState.isExecuting ? onStop : onExecute}
            disabled={isExecuteDisabled && !executionState.isExecuting}
            color={executionState.isExecuting ? 'error' : 'primary'}
            sx={{ minWidth: 100, fontWeight: 'bold' }}
          >
            {executionState.isExecuting ? 'Stop' : 'Execute'}
          </Button>
          <Button
            onClick={onShowAdvanced}
            disabled={!connectionState.isConnected}
            color="primary"
            variant={showAdvanced ? 'contained' : 'outlined'}
            sx={{ minWidth: 40 }}
          >
            <SettingsIcon />
          </Button>
        </ButtonGroup>
      </Stack>
    </Box>
  );
};
