// Agent Video Stream Component - Renders a single agent's WebRTC stream
// Each agent gets its own hook and video element for parallel streaming

import React from 'react';
import { useWebRTC } from '../hooks/useWebRTC';
import type { WebRTCConfig } from '../types/cameraTypes';

interface AgentVideoStreamProps {
  agentId: string | number;
  agentName: string;
  config: WebRTCConfig | null;
  theme: 'dark' | 'light';
}

function AgentVideoStream({ agentId, agentName, config, theme }: AgentVideoStreamProps) {
  // Each agent gets its own WebRTC hook with unique viewer_id from config
  // The viewer_id is already in the correct format: viewer:user:camera:agent
  // Hook must be called unconditionally (React rules)
  const webrtc = useWebRTC(config, `${agentId}`);

  // Early return for missing config (after hook call)
  if (!config) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <span className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
          No stream config for {agentName}
        </span>
      </div>
    );
  }

  const isConnected = webrtc.connectionState === 'connected' && webrtc.videoStream !== null;

  return (
    <div className="relative w-full h-full bg-gray-900 rounded overflow-hidden">
      <video
        ref={webrtc.videoRef}
        className="w-full h-full object-contain"
        autoPlay
        playsInline
        muted={false}
      />
      {!isConnected && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-10">
          <div className="text-center">
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              {webrtc.connectionState === 'connecting' && 'Connecting...'}
              {webrtc.connectionState === 'failed' && `Failed: ${webrtc.error || 'Connection error'}`}
              {webrtc.connectionState === 'disconnected' && 'Disconnected'}
              {webrtc.connectionState === 'idle' && 'Idle'}
            </p>
          </div>
        </div>
      )}
      {/* Agent name overlay */}
      <div className="absolute top-2 left-2 px-2 py-1 rounded bg-black/50 text-white text-xs">
        {agentName}
      </div>
    </div>
  );
}

export default AgentVideoStream;

