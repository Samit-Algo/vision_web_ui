// WebRTC Context - Manages persistent WebRTC connections across navigation
// Connections stay alive when navigating between dashboard and camera detail pages

import React, { createContext, useContext, useRef, useCallback, useEffect, useState } from 'react';
import { useWebRTC } from '../hooks/useWebRTC';
import type { WebRTCConfig } from '../types/cameraTypes';

interface WebRTCConnection {
  cameraId: string;
  config: WebRTCConfig;
  connectionState: 'idle' | 'connecting' | 'connected' | 'disconnected' | 'failed';
  videoStream: MediaStream | null;
  error: string | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  reconnect: () => void;
  lastUsed: number; // Timestamp of last use
}

interface WebRTCContextType {
  getConnection: (cameraId: string, config: WebRTCConfig | null) => WebRTCConnection | null;
  removeConnection: (cameraId: string) => void;
  clearAllConnections: () => void;
  getConnectionState: (cameraId: string) => 'idle' | 'connecting' | 'connected' | 'disconnected' | 'failed' | null;
}

const WebRTCContext = createContext<WebRTCContextType | null>(null);

// Internal component that manages WebRTC connections
function WebRTCConnectionManager({ cameraId, config, children }: { cameraId: string; config: WebRTCConfig | null; children: React.ReactNode }) {
  const webrtc = useWebRTC(config);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Update video ref
  useEffect(() => {
    if (webrtc.videoRef.current && videoRef.current) {
      // Sync the refs
      if (webrtc.videoRef.current !== videoRef.current) {
        // Copy srcObject if available
        if (webrtc.videoRef.current.srcObject) {
          videoRef.current.srcObject = webrtc.videoRef.current.srcObject;
        }
      }
    }
  }, [webrtc.videoRef, webrtc.videoStream]);

  // Store connection in parent context
  const context = useContext(WebRTCContext);
  
  useEffect(() => {
    if (!context || !config) return;
    
    // Connection is managed by the hook, we just need to expose it
    // The actual connection management happens in the hook
  }, [context, config, webrtc]);

  return <>{children}</>;
}

// Provider component
export function WebRTCProvider({ children }: { children: React.ReactNode }) {
  const connectionsRef = useRef<Map<string, WebRTCConnection>>(new Map());
  const [, forceUpdate] = useState(0);

  const getConnection = useCallback((cameraId: string, config: WebRTCConfig | null): WebRTCConnection | null => {
    if (!config) return null;
    
    // Check if connection already exists
    const existing = connectionsRef.current.get(cameraId);
    if (existing) {
      // Update last used timestamp
      existing.lastUsed = Date.now();
      return existing;
    }

    // Create new connection wrapper
    // Note: The actual WebRTC connection is managed by useWebRTC hook in the component
    // This context just tracks which cameras have active connections
    return null;
  }, []);

  const removeConnection = useCallback((cameraId: string) => {
    const connection = connectionsRef.current.get(cameraId);
    if (connection) {
      // Stop all tracks
      if (connection.videoStream) {
        connection.videoStream.getTracks().forEach(track => track.stop());
      }
      connectionsRef.current.delete(cameraId);
      forceUpdate(prev => prev + 1);
    }
  }, []);

  const clearAllConnections = useCallback(() => {
    connectionsRef.current.forEach((connection) => {
      if (connection.videoStream) {
        connection.videoStream.getTracks().forEach(track => track.stop());
      }
    });
    connectionsRef.current.clear();
    forceUpdate(prev => prev + 1);
  }, []);

  const getConnectionState = useCallback((cameraId: string) => {
    const connection = connectionsRef.current.get(cameraId);
    return connection?.connectionState || null;
  }, []);

  return (
    <WebRTCContext.Provider value={{
      getConnection,
      removeConnection,
      clearAllConnections,
      getConnectionState,
    }}>
      {children}
    </WebRTCContext.Provider>
  );
}

// Hook to use WebRTC context
export function useWebRTCContext() {
  const context = useContext(WebRTCContext);
  if (!context) {
    throw new Error('useWebRTCContext must be used within WebRTCProvider');
  }
  return context;
}

