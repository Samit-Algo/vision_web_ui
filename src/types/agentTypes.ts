// TypeScript Type Definitions for Agents
// These types match what your backend expects and returns

import type { WebRTCConfig } from './cameraTypes';

/**
 * Agent response from the backend API
 * Based on AgentResponse DTO from backend
 */
export interface AgentResponse {
  id: string;                    // Agent's unique ID
  name: string;                   // Agent's name
  camera_id: string;              // Camera ID this agent belongs to
  model: string;                  // Model name (e.g., "YOLO v8", "DeepSORT")
  fps?: number;                  // Frames per second
  rules?: unknown[];              // Agent rules configuration
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | string;  // Agent status
  stream_config?: WebRTCConfig;  // WebRTC configuration for agent's processed stream (with bounding boxes) - includes viewer_id, signaling_url, ice_servers
  // Add other fields as needed based on your backend response
  [key: string]: unknown;         // Allow additional fields
}

