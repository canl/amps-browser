import React from 'react';
import {
  Box,
  Stack,
  Button,
  ButtonGroup,
} from '@mui/material';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import { AMPSServer, AMPS_SERVERS } from '../config/amps-config';
import { AMPSConnectionState } from '../types/amps-types';
import { SelectField } from './common/FormField';
import { ConnectionStatus } from './common/StatusDisplay';

export interface ServerConnectionProps {
  selectedServer: AMPSServer | null;
  onServerSelect: (server: AMPSServer) => void;
  connectionState: AMPSConnectionState;
  onConnect: () => void;
  onDisconnect: () => void;
}

export const ServerConnection: React.FC<ServerConnectionProps> = ({
  selectedServer,
  onServerSelect,
  connectionState,
  onConnect,
  onDisconnect,
}) => {
  const handleServerChange = (value: string) => {
    const server = AMPS_SERVERS.find((s: AMPSServer) => s.name === value);
    if (server) {
      onServerSelect(server);
    }
  };



  const serverOptions = AMPS_SERVERS.map(server => ({
    value: server.name,
    label: server.name,
  }));

  return (
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
        {/* Server Selection */}
        <Box sx={{ minWidth: 250 }}>
          <SelectField
            label="AMPS Server"
            value={selectedServer?.name || ''}
            onChange={handleServerChange}
            options={serverOptions}
            disabled={connectionState.isConnecting || connectionState.isConnected}
            size="medium"
          />
        </Box>

        {/* Connection Status */}
        <Box sx={{ minWidth: 200 }}>
          <ConnectionStatus
            isConnected={connectionState.isConnected}
            isConnecting={connectionState.isConnecting}
            serverName={connectionState.server}
            serverInfo={selectedServer}
            error={connectionState.error}
            variant="chip"
            size="medium"
          />
        </Box>

        {/* Connection Actions */}
        <ButtonGroup variant="outlined" size="medium">
          <Button
            onClick={onConnect}
            disabled={!selectedServer || connectionState.isConnecting || connectionState.isConnected}
            color="primary"
          >
            Connect
          </Button>
          <Button
            onClick={onDisconnect}
            disabled={!connectionState.isConnected}
            color="secondary"
          >
            Disconnect
          </Button>
        </ButtonGroup>

        {/* Admin Link */}
        {selectedServer && connectionState.isConnected && (
          <Button
            variant="text"
            size="small"
            href={`http://${selectedServer.host}:${selectedServer.adminPort}`}
            target="_blank"
            rel="noopener noreferrer"
            startIcon={<MonitorHeartIcon />}
            sx={{ textTransform: 'none' }}
          >
            Admin Panel
          </Button>
        )}
      </Stack>
  );
};
