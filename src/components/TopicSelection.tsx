import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Topic as TopicIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { AMPSTopic } from '../config/amps-config';
import { AMPSConnectionState, ExecutionState, NotificationFunction } from '../types/amps-types';
import { AutocompleteField } from './common/FormField';

export interface TopicSelectionProps {
  selectedTopic: string;
  onTopicSelect: (topic: string) => void;
  availableTopics: AMPSTopic[];
  connectionState: AMPSConnectionState;
  executionState: ExecutionState;
  onNotification: NotificationFunction;
}

export const TopicSelection: React.FC<TopicSelectionProps> = ({
  selectedTopic,
  onTopicSelect,
  availableTopics,
  connectionState,
  executionState,
  onNotification,
}) => {
  // Define message type order and colors
  const messageTypeOrder = ['json', 'nvfix', 'xml', 'bson', 'fix'];
  const messageTypeColors = {
    json: 'success',
    nvfix: 'primary',
    xml: 'warning',
    bson: 'info',
    fix: 'secondary'
  } as const;

  // Sort topics by message type order, then by topic name
  const sortedTopics = [...availableTopics].sort((a, b) => {
    const aTypeIndex = messageTypeOrder.indexOf(a.messageType.toLowerCase());
    const bTypeIndex = messageTypeOrder.indexOf(b.messageType.toLowerCase());

    // If message types are different, sort by type order
    if (aTypeIndex !== bTypeIndex) {
      // Put unknown types at the end
      if (aTypeIndex === -1) return 1;
      if (bTypeIndex === -1) return -1;
      return aTypeIndex - bTypeIndex;
    }

    // If same message type, sort by topic name
    return a.name.localeCompare(b.name);
  });

  const topicOptions = sortedTopics.map(topic => ({
    value: topic.name,
    label: topic.name,
    messageType: topic.messageType,
    description: `${topic.messageType} • Key: ${topic.key || 'No key'} • File: ${topic.fileName || 'N/A'}`,
  }));

  const handleTopicChange = (value: string | null) => {
    // Show toast notification if trying to change topic during active subscription
    if (executionState.isExecuting) {
      onNotification({
        type: 'warning',
        title: 'Topic Locked',
        message: 'Topic selection is locked during active subscriptions. Click Stop to change the topic.'
      });
      return;
    }
    onTopicSelect(value || '');
  };

  // Disable topic selection during active subscriptions
  const isDisabled = !connectionState.isConnected || executionState.isExecuting;
  const isLocked = executionState.isExecuting;

  const getMessageTypeColor = (messageType: string) => {
    const lowerType = messageType.toLowerCase();
    return messageTypeColors[lowerType as keyof typeof messageTypeColors] || 'default';
  };

  const renderTopicOption = (props: any, option: any) => (
    <Box component="li" {...props} sx={{ py: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
        <Typography variant="body1" fontWeight="medium" sx={{ flexGrow: 1 }}>
          {option.label}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 'fit-content' }}>
          Key: {option.description.split(' • ')[1]?.replace('Key: ', '') || 'No key defined'}
        </Typography>
        <Chip
          label={option.messageType.toUpperCase()}
          size="small"
          color={getMessageTypeColor(option.messageType)}
          variant="outlined"
        />
      </Box>
    </Box>
  );

  const filterTopicOptions = (options: any[], { inputValue }: any) => {
    const filtered = options.filter(option =>
      option.label.toLowerCase().includes(inputValue.toLowerCase()) ||
      option.description.toLowerCase().includes(inputValue.toLowerCase())
    );
    return filtered;
  };

  const handleOverlayClick = () => {
    onNotification({
      type: 'warning',
      title: 'Topic Locked',
      message: 'Topic selection is locked during active subscriptions. Click Stop to change the topic.'
    });
  };

  const topicField = (
    <Box sx={{ position: 'relative' }}>
      <AutocompleteField
        label={isLocked ? "Topic (locked during subscription)" : "Search and select topic"}
        value={selectedTopic}
        onChange={handleTopicChange}
        options={topicOptions}
        disabled={isDisabled}
        placeholder={isLocked ? "Topic locked during active subscription" : "Type to search topics by name, message type, or key..."}
        freeSolo={false}
        filterOptions={filterTopicOptions}
        renderOption={renderTopicOption}
        startIcon={isLocked ? <LockIcon fontSize="small" /> : <TopicIcon fontSize="small" />}
        fullWidth
        size="medium"
      />
      {/* Transparent overlay to capture clicks when locked */}
      {isLocked && (
        <Box
          onClick={handleOverlayClick}
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
  );

  return (
    <Box sx={{
      flex: 1,
      minWidth: 300,
      // Add visual indication when locked
      ...(isDisabled && executionState.isExecuting && {
        opacity: 0.7,
        '& .MuiInputBase-root': {
          backgroundColor: 'action.disabledBackground'
        }
      })
    }}>
      {isDisabled && executionState.isExecuting ? (
        <Tooltip title="Topic selection is locked during active subscriptions. Click Stop to change the topic.">
          {topicField}
        </Tooltip>
      ) : (
        topicField
      )}
    </Box>
  );
};
