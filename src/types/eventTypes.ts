// TypeScript Type Definitions for Events and Notifications
// These types match what your backend sends via WebSocket

/**
 * Event notification payload from WebSocket
 * Based on the backend notification structure
 */
export interface EventNotification {
  type: 'event_notification';
  event: {
    label: string;                    // Event label (e.g., "Person detected")
    timestamp: string;                 // ISO timestamp
    event_id?: string;                 // Optional event ID
    rule_index?: number;              // Rule index that triggered the event
  };
  agent: {
    agent_id: string;
    agent_name: string;
    camera_id: string;
  };
  camera?: {
    owner_user_id?: string;            // Camera owner user ID
    device_id?: string;                // Camera device ID
  };
  frame?: {
    image_base64?: string;            // Base64 encoded image frame
    format?: string;                   // Image format (e.g., "jpeg", "png")
  };
  metadata: {
    image_path?: string;               // Path to event image
    json_path?: string;                // Path to event JSON data
    [key: string]: unknown;            // Allow additional metadata fields
  };
  received_at: string;                  // ISO timestamp when notification was received
}

/**
 * Stored event with additional UI state
 */
export interface StoredEvent extends EventNotification {
  id: string;                          // Unique ID for frontend (generated)
  read: boolean;                       // Whether user has read this notification
  createdAt: number;                   // Timestamp when received (for sorting)
}

/**
 * Notification state for the context
 */
export interface NotificationState {
  events: StoredEvent[];
  unreadCount: number;
  isConnected: boolean;
  error: string | null;
}

