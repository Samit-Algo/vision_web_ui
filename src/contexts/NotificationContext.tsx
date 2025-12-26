// Notification Context - Global state management for event notifications
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { toast } from 'sonner';
import { websocketService } from '../services/notifications/websocketService';
import type { EventNotification, StoredEvent, NotificationState } from '../types/eventTypes';

interface NotificationContextType extends NotificationState {
  addEvent: (notification: EventNotification) => void;
  markAsRead: (eventId: string) => void;
  markAllAsRead: () => void;
  clearEvents: () => void;
  removeEvent: (eventId: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const MAX_EVENTS = 100; // Maximum number of events to store

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<StoredEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate unread count
  const unreadCount = events.filter(e => !e.read).length;

  // Add new event notification
  const addEvent = useCallback((notification: EventNotification) => {
    const newEvent: StoredEvent = {
      ...notification,
      id: `${notification.agent.agent_id}-${notification.event.timestamp}-${Date.now()}`,
      read: false,
      createdAt: new Date(notification.received_at || notification.event.timestamp).getTime(),
    };

    setEvents((prev) => {
      // Add new event at the beginning and limit total count
      const updated = [newEvent, ...prev].slice(0, MAX_EVENTS);
      return updated;
    });

    // Show toast notification
    toast.info(notification.event.label, {
      description: `${notification.agent.agent_name} - ${notification.agent.camera_id}`,
      duration: 5000,
      action: {
        label: 'View',
        onClick: () => {
          // This will be handled by the notification dropdown
          console.log('View event:', newEvent.id);
        },
      },
    });
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    // Connect when component mounts
    websocketService.connect();

    // Set up message handler
    const unsubscribeMessage = websocketService.onMessage((notification) => {
      addEvent(notification);
    });

    // Set up connection handler
    const unsubscribeConnection = websocketService.onConnectionChange((connected) => {
      setIsConnected(connected);
      if (connected) {
        setError(null);
      }
    });

    // Set up error handler
    const unsubscribeError = websocketService.onError((errorMessage) => {
      setError(errorMessage);
      if (errorMessage) {
        toast.error('Notification connection error', {
          description: errorMessage,
        });
      }
    });

    // Cleanup on unmount
    return () => {
      unsubscribeMessage();
      unsubscribeConnection();
      unsubscribeError();
      websocketService.disconnect();
    };
  }, [addEvent]);

  // Mark event as read
  const markAsRead = useCallback((eventId: string) => {
    setEvents((prev) =>
      prev.map((event) =>
        event.id === eventId ? { ...event, read: true } : event
      )
    );
  }, []);

  // Mark all events as read
  const markAllAsRead = useCallback(() => {
    setEvents((prev) => prev.map((event) => ({ ...event, read: true })));
  }, []);

  // Clear all events
  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  // Remove a specific event
  const removeEvent = useCallback((eventId: string) => {
    setEvents((prev) => prev.filter((event) => event.id !== eventId));
  }, []);

  const value: NotificationContextType = {
    events,
    unreadCount,
    isConnected,
    error,
    addEvent,
    markAsRead,
    markAllAsRead,
    clearEvents,
    removeEvent,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * Hook to use notification context
 */
export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

