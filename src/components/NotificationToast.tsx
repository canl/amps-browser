import React, { useState, useEffect } from 'react';
import { Snackbar, Alert, AlertTitle, Stack } from '@mui/material';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface NotificationToastProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notifications,
  onDismiss
}) => {
  return (
    <Stack
      spacing={1}
      sx={{
        position: 'fixed',
        top: 80,
        right: 16,
        zIndex: 9999,
        maxWidth: 400,
      }}
    >
      {notifications.map(notification => (
        <ToastItem
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
        />
      ))}
    </Stack>
  );
};

interface ToastItemProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ notification, onDismiss }) => {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const duration = notification.duration || 5000;

    const timer = setTimeout(() => {
      setOpen(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [notification.id, notification.duration]);

  const handleClose = () => {
    setOpen(false);
  };

  const handleExited = () => {
    onDismiss(notification.id);
  };

  return (
    <Snackbar
      open={open}
      onClose={handleClose}
      TransitionProps={{
        onExited: handleExited,
      }}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert
        onClose={handleClose}
        severity={notification.type}
        variant="filled"
        sx={{ width: '100%' }}
      >
        <AlertTitle>{notification.title}</AlertTitle>
        {notification.message}
      </Alert>
    </Snackbar>
  );
};

// Hook for managing notifications
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setNotifications(prev => [...prev, { ...notification, id }]);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return {
    notifications,
    addNotification,
    dismissNotification,
    clearAllNotifications
  };
};
