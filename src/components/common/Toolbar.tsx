import React from 'react';
import {
  Box,
  Paper,
  Stack,
  Typography,
  IconButton,
  Button,
  Tooltip,
  Divider,
  Collapse,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';

export interface ToolbarAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'text' | 'outlined' | 'contained';
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  tooltip?: string;
}

export interface ToolbarProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: ToolbarAction[];
  children?: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  variant?: 'elevated' | 'outlined' | 'flat';
  size?: 'small' | 'medium' | 'large';
}

export const Toolbar: React.FC<ToolbarProps> = ({
  title,
  subtitle,
  icon,
  actions = [],
  children,
  collapsible = false,
  defaultExpanded = true,
  variant = 'elevated',
  size = 'medium',
}) => {
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  const handleToggleExpanded = () => {
    setExpanded(!expanded);
  };

  const getPaperProps = () => {
    switch (variant) {
      case 'outlined':
        return { variant: 'outlined' as const, elevation: 0 };
      case 'flat':
        return { elevation: 0, sx: { backgroundColor: 'transparent' } };
      case 'elevated':
      default:
        return { elevation: 1 };
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'small':
        return 1;
      case 'large':
        return 3;
      case 'medium':
      default:
        return 2;
    }
  };

  const renderAction = (action: ToolbarAction) => {
    const button = (
      <Button
        key={action.id}
        variant={action.variant || 'outlined'}
        color={action.color || 'primary'}
        size={size === 'large' ? 'medium' : 'small'}
        startIcon={action.icon}
        onClick={action.onClick}
        disabled={action.disabled}
      >
        {action.label}
      </Button>
    );

    if (action.tooltip) {
      return (
        <Tooltip key={action.id} title={action.tooltip}>
          <span>{button}</span>
        </Tooltip>
      );
    }

    return button;
  };

  return (
    <Paper {...getPaperProps()}>
      <Box sx={{ p: getPadding() }}>
        {/* Header */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
        >
          {/* Title Section */}
          <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
            {icon && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {icon}
              </Box>
            )}
            <Box>
              {title && (
                <Typography
                  variant={size === 'small' ? 'subtitle2' : size === 'large' ? 'h6' : 'subtitle1'}
                  fontWeight="medium"
                >
                  {title}
                </Typography>
              )}
              {subtitle && (
                <Typography
                  variant={size === 'small' ? 'caption' : 'body2'}
                  color="text.secondary"
                >
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Stack>

          {/* Actions Section */}
          <Stack direction="row" alignItems="center" spacing={1}>
            {actions.map(renderAction)}
            
            {collapsible && (
              <IconButton
                onClick={handleToggleExpanded}
                size={size === 'large' ? 'medium' : 'small'}
              >
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            )}
          </Stack>
        </Stack>

        {/* Content */}
        {children && (
          <>
            {(title || subtitle || actions.length > 0) && (
              <Divider sx={{ my: getPadding() }} />
            )}
            
            {collapsible ? (
              <Collapse in={expanded}>
                <Box>{children}</Box>
              </Collapse>
            ) : (
              <Box>{children}</Box>
            )}
          </>
        )}
      </Box>
    </Paper>
  );
};

export interface SectionToolbarProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: ToolbarAction[];
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

export const SectionToolbar: React.FC<SectionToolbarProps> = ({
  title,
  subtitle,
  icon,
  actions,
  children,
  defaultExpanded = true,
}) => {
  return (
    <Toolbar
      title={title}
      subtitle={subtitle}
      icon={icon}
      actions={actions}
      collapsible
      defaultExpanded={defaultExpanded}
      variant="outlined"
      size="medium"
    >
      {children}
    </Toolbar>
  );
};
