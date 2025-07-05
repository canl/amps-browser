import React from 'react';
import {
  Chip,
  Box,
  Typography,
  CircularProgress,
  Alert,
  AlertColor,
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,

} from '@mui/icons-material';

export type StatusType = 'success' | 'error' | 'warning' | 'info' | 'loading' | 'idle';

export interface StatusDisplayProps {
  status: StatusType;
  message?: string;
  variant?: 'chip' | 'alert' | 'inline';
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  color?: AlertColor;
}

const getStatusConfig = (status: StatusType) => {
  switch (status) {
    case 'success':
      return {
        color: 'success' as const,
        icon: <SuccessIcon />,
        defaultMessage: 'Success'
      };
    case 'error':
      return {
        color: 'error' as const,
        icon: <ErrorIcon />,
        defaultMessage: 'Error'
      };
    case 'warning':
      return {
        color: 'warning' as const,
        icon: <WarningIcon />,
        defaultMessage: 'Warning'
      };
    case 'info':
      return {
        color: 'info' as const,
        icon: <InfoIcon />,
        defaultMessage: 'Information'
      };
    case 'loading':
      return {
        color: 'primary' as const,
        icon: <CircularProgress size={16} />,
        defaultMessage: 'Loading...'
      };
    case 'idle':
    default:
      return {
        color: 'default' as const,
        icon: <InfoIcon />,
        defaultMessage: 'Ready'
      };
  }
};

export const StatusDisplay: React.FC<StatusDisplayProps> = ({
  status,
  message,
  variant = 'chip',
  size = 'medium',
  showIcon = true,
  color,
}) => {
  const config = getStatusConfig(status);
  const displayMessage = message || config.defaultMessage;
  const statusColor = color || config.color;

  if (variant === 'chip') {
    return (
      <Chip
        label={displayMessage}
        color={statusColor === 'default' ? undefined : statusColor}
        variant="outlined"
        size={size === 'large' ? 'medium' : 'small'}
        icon={showIcon ? config.icon : undefined}
      />
    );
  }

  if (variant === 'alert') {
    const alertSeverity = (() => {
      switch (statusColor) {
        case 'success':
        case 'error':
        case 'warning':
        case 'info':
          return statusColor;
        case 'primary':
          return 'info';
        case 'default':
        default:
          return 'info';
      }
    })();

    return (
      <Alert
        severity={alertSeverity}
        icon={showIcon ? config.icon : false}
        sx={{
          fontSize: size === 'small' ? '0.75rem' : size === 'large' ? '1rem' : '0.875rem',
          '& .MuiAlert-message': {
            fontSize: 'inherit'
          }
        }}
      >
        {displayMessage}
      </Alert>
    );
  }

  // inline variant
  const inlineColor = statusColor === 'default' ? 'text.primary' : `${statusColor}.main`;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        color: inlineColor,
      }}
    >
      {showIcon && config.icon}
      <Typography
        variant={size === 'small' ? 'caption' : size === 'large' ? 'body1' : 'body2'}
        color="inherit"
      >
        {displayMessage}
      </Typography>
    </Box>
  );
};

export interface ConnectionStatusProps {
  isConnected: boolean;
  isConnecting: boolean;
  serverName?: string;
  error?: string;
  variant?: 'chip' | 'alert' | 'inline';
  size?: 'small' | 'medium' | 'large';
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  isConnecting,
  serverName,
  error,
  variant = 'chip',
  size = 'medium',
}) => {
  let status: StatusType;
  let message: string;

  if (error) {
    status = 'error';
    message = `Connection failed: ${error}`;
  } else if (isConnecting) {
    status = 'loading';
    message = `Connecting${serverName ? ` to ${serverName}` : ''}...`;
  } else if (isConnected) {
    status = 'success';
    message = `Connected${serverName ? ` to ${serverName}` : ''}`;
  } else {
    status = 'idle';
    message = 'Disconnected';
  }

  return (
    <StatusDisplay
      status={status}
      message={message}
      variant={variant}
      size={size}
    />
  );
};

export interface ExecutionStatusProps {
  isExecuting: boolean;
  error?: string;
  lastExecuted?: Date;
  variant?: 'chip' | 'alert' | 'inline';
  size?: 'small' | 'medium' | 'large';
}

export const ExecutionStatus: React.FC<ExecutionStatusProps> = ({
  isExecuting,
  error,
  lastExecuted,
  variant = 'chip',
  size = 'medium',
}) => {
  let status: StatusType;
  let message: string;

  if (error) {
    status = 'error';
    message = `Execution failed: ${error}`;
  } else if (isExecuting) {
    status = 'loading';
    message = 'Executing...';
  } else if (lastExecuted) {
    status = 'success';
    message = `Last executed: ${lastExecuted.toLocaleTimeString()}`;
  } else {
    status = 'idle';
    message = 'Ready to execute';
  }

  return (
    <StatusDisplay
      status={status}
      message={message}
      variant={variant}
      size={size}
    />
  );
};
