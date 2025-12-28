// WebRTC Connection Manager - Maintains persistent connections across navigation
// Connections are keyed by camera ID and persist when navigating between pages

import { useRef, useCallback, useEffect } from 'react';
import type React from 'react';
import type { WebRTCConfig } from '../types/cameraTypes';
import { useWebRTC, cleanupAllWebRTCConnections } from './useWebRTC';

interface ConnectionData {
  config: WebRTCConfig;
  pc: RTCPeerConnection | null;
  ws: WebSocket | null;
  videoStream: MediaStream | null;
  connectionState: 'idle' | 'connecting' | 'connected' | 'disconnected' | 'failed';
  error: string | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  broadcasterId: string | null;
  localCandidateQueue: Array<any>;
  heartbeatInterval: NodeJS.Timeout | null;
  reconnectAttempts: number;
  lastPongTime: number;
  videoTracks: Map<string, MediaStream>;
  isMounted: boolean;
}

// Global connection store - persists across component unmounts
const connectionStore = new Map<string, ConnectionData>();

/**
 * Hook to get or create a persistent WebRTC connection for a camera
 * The connection persists even when the component unmounts
 */
export function useWebRTCManager(cameraId: string, config: WebRTCConfig | null) {
  // Thin wrapper around useWebRTC keyed by the provided cameraId (or streamId)
  // This ensures one PeerConnection and one WebSocket per unique stream key
  const { connectionState, videoStream, error, videoRef } = useWebRTC(config, cameraId);
  return { connectionState, videoStream, error, videoRef };
}

/**
 * Cleanup all connections (call on logout)
 */
export function cleanupAllConnections() {
  cleanupAllWebRTCConnections();
}