// WebRTC Connection Manager - Maintains persistent connections across navigation
// Connections are keyed by camera ID and persist when navigating between pages

import { useRef, useCallback, useEffect } from 'react';
import type React from 'react';
import type { WebRTCConfig } from '../types/cameraTypes';

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const connectionRef = useRef<ConnectionData | null>(null);

  // Get or create connection
  useEffect(() => {
    if (!config) {
      connectionRef.current = null;
      return;
    }

    // Check if connection already exists
    let connection = connectionStore.get(cameraId);
    
    if (!connection) {
      // Create new connection data structure
      connection = {
        config,
        pc: null,
        ws: null,
        videoStream: null,
        connectionState: 'idle',
        error: null,
        videoRef: { current: null } as unknown as React.RefObject<HTMLVideoElement>,
        broadcasterId: null,
        localCandidateQueue: [],
        heartbeatInterval: null,
        reconnectAttempts: 0,
        lastPongTime: Date.now(),
        videoTracks: new Map(),
        isMounted: true,
      };
      connectionStore.set(cameraId, connection);
      console.log(`[WebRTCManager] Created new connection for camera: ${cameraId}`);
    } else {
      // Update config if changed
      connection.config = config;
      connection.isMounted = true;
      console.log(`[WebRTCManager] Reusing existing connection for camera: ${cameraId}`);
    }

    connectionRef.current = connection;
    connection.videoRef = videoRef as React.RefObject<HTMLVideoElement>;

    // Initialize connection if not already connected
    if (connection.connectionState === 'idle' || connection.connectionState === 'failed') {
      initializeConnection(connection);
    } else if (connection.videoStream && videoRef.current) {
      // If already connected, attach stream to video element
      videoRef.current.srcObject = connection.videoStream;
      videoRef.current.play().catch(e => {
        console.error(`[WebRTCManager] Video play error:`, e);
      });
    }

    return () => {
      if (connection) {
        connection.isMounted = false;
        // Don't cleanup - keep connection alive
      }
    };
  }, [cameraId, config]);

  const initializeConnection = useCallback((connection: ConnectionData) => {
    // This will be implemented to use the existing useWebRTC logic
    // For now, we'll return the connection state
    console.log(`[WebRTCManager] Initializing connection for camera: ${cameraId}`);
  }, [cameraId]);

  return {
    connectionState: connectionRef.current?.connectionState || 'idle',
    videoStream: connectionRef.current?.videoStream || null,
    error: connectionRef.current?.error || null,
    videoRef,
  };
}

/**
 * Cleanup all connections (call on logout)
 */
export function cleanupAllConnections() {
  connectionStore.forEach((connection, cameraId) => {
    console.log(`[WebRTCManager] Cleaning up connection for camera: ${cameraId}`);
    
    // Clear heartbeat
    if (connection.heartbeatInterval) {
      clearInterval(connection.heartbeatInterval);
    }

    // Close WebSocket
    if (connection.ws) {
      try {
        connection.ws.close();
      } catch (e) {
        // Ignore
      }
    }

    // Close PeerConnection
    if (connection.pc) {
      try {
        connection.pc.getReceivers().forEach(receiver => {
          const track = receiver.track;
          if (track) {
            track.stop();
          }
        });
        connection.pc.close();
      } catch (e) {
        // Ignore
      }
    }

    // Stop all video streams
    connection.videoTracks.forEach(stream => {
      stream.getTracks().forEach(track => track.stop());
    });
  });

  connectionStore.clear();
  console.log(`[WebRTCManager] All connections cleaned up`);
}

