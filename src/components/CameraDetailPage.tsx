// Camera Detail Page Component - Shows detailed view of a single camera
import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, MapPin, Plus, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { Resizable } from 're-resizable';
import AgentChatbot, { type AgentChatbotRef } from './AgentChatbot';
import ZoneDrawingPanel from './ZoneDrawingPanel';
import ZoneOverlay from './ZoneOverlay';
import TimelineChart from './TimelineChart';
import { useWebRTC } from '../hooks/useWebRTC';
import type { StreamConfig, WebRTCConfig } from '../types/cameraTypes';
import { listAgentsByCamera } from '../services/agent/agentService';
import type { AgentResponse } from '../types/agentTypes';

function CameraDetailPage({ camera, theme, onBack }) {
  // Get WebRTC config if available - check both new structure (webrtc_config) and legacy (stream_config)
  const streamConfig = camera?.stream_config as StreamConfig | undefined;
  const webrtcConfig = camera?.webrtc_config as WebRTCConfig | undefined;
  
  // State for chatbot visibility
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  
  // Agents state - fetched from backend
  const [agents, setAgents] = useState<Array<{
    id: string | number;
    name: string;
    model: string;
    detections: number;
    isActive: boolean;
    color: string;
    stream_config?: WebRTCConfig;  // For agents, this is WebRTCConfig directly with viewer_id included
    zone: {
      id: number;
      name: string;
      points: Array<{ x: number; y: number }>;
      color: string;
      type: string;
    } | null;
  }>>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  const [agentsError, setAgentsError] = useState<string | null>(null);
  
  // State for selected agent (for stream switching)
  const [selectedAgentId, setSelectedAgentId] = useState<string | number | null>(null);
  
  // Get the selected agent
  const selectedAgent = agents.find(a => a.id === selectedAgentId);
  
  // Camera WebRTC hook - always active for camera stream
  // Uses camera's webrtc_config with viewer_id format: viewer:user:camera
  const cameraWebRTCConfig = webrtcConfig || streamConfig?.webrtc_config || null;
  const isValidCameraConfig = cameraWebRTCConfig && 
    cameraWebRTCConfig.signaling_url && 
    cameraWebRTCConfig.viewer_id && 
    cameraWebRTCConfig.ice_servers;
  
  const cameraWebRTC = useWebRTC(
    isValidCameraConfig && !selectedAgent ? cameraWebRTCConfig : null,
    `camera-${camera?.id}`
  );
  
  // Selected agent WebRTC hook - only active when agent is selected
  // Uses agent's stream_config with viewer_id format: viewer:user:camera:agent
  const selectedAgentConfig = selectedAgent?.stream_config || null;
  
  // Fix viewer_id and signaling_url if missing camera ID (backend bug workaround)
  // Expected format: viewer:user:camera:agent
  // Some backends return: viewer:user:agent (missing camera ID)
  let fixedAgentConfig: WebRTCConfig | null = null;
  if (selectedAgentConfig && selectedAgent && camera?.id) {
    const viewerIdParts = selectedAgentConfig.viewer_id.split(':');
    // Check if viewer_id is missing camera ID (has 3 parts: viewer, user, agent)
    if (viewerIdParts.length === 3 && viewerIdParts[0] === 'viewer') {
      // Fix: insert camera ID between user and agent
      const fixedViewerId = `viewer:${viewerIdParts[1]}:${camera.id}:${viewerIdParts[2]}`;
      
      // Also fix signaling_url - it contains viewer_id in the path
      // Extract base URL (e.g., "ws://127.0.0.1:8002/ws/") and replace viewer_id
      let fixedSignalingUrl = selectedAgentConfig.signaling_url;
      try {
        const urlObj = new URL(selectedAgentConfig.signaling_url);
        const pathParts = urlObj.pathname.split('/');
        // Replace the last part (viewer_id) with the fixed one
        if (pathParts.length > 0) {
          pathParts[pathParts.length - 1] = encodeURIComponent(fixedViewerId);
          urlObj.pathname = pathParts.join('/');
          fixedSignalingUrl = urlObj.toString();
        }
      } catch (e) {
        console.error(`[CameraDetailPage] Error fixing signaling_url:`, e);
        // Fallback: simple string replace
        fixedSignalingUrl = selectedAgentConfig.signaling_url.replace(
          encodeURIComponent(selectedAgentConfig.viewer_id),
          encodeURIComponent(fixedViewerId)
        );
      }
      
      console.warn(`[CameraDetailPage] Fixed agent config format:`, {
        original_viewer_id: selectedAgentConfig.viewer_id,
        fixed_viewer_id: fixedViewerId,
        original_signaling_url: selectedAgentConfig.signaling_url,
        fixed_signaling_url: fixedSignalingUrl,
        note: 'Backend API should return correct format: viewer:user:camera:agent'
      });
      
      fixedAgentConfig = {
        ...selectedAgentConfig,
        viewer_id: fixedViewerId,
        signaling_url: fixedSignalingUrl
      };
    } else {
      // Already correct format (4 parts: viewer:user:camera:agent)
      fixedAgentConfig = selectedAgentConfig;
    }
  }
  
  const isValidAgentConfig = fixedAgentConfig && 
    fixedAgentConfig.signaling_url && 
    fixedAgentConfig.viewer_id && 
    fixedAgentConfig.ice_servers;
  
  // Debug logging for agent config
  useEffect(() => {
    if (selectedAgent && fixedAgentConfig) {
      console.log(`[CameraDetailPage] Agent ${selectedAgent.id} (${selectedAgent.name}) config:`, {
        viewer_id: fixedAgentConfig.viewer_id,
        signaling_url: fixedAgentConfig.signaling_url,
        agent_id: selectedAgent.id,
        camera_id: camera?.id,
      });
    }
  }, [selectedAgent, fixedAgentConfig, camera?.id]);
  
  const agentWebRTC = useWebRTC(
    isValidAgentConfig && selectedAgent ? fixedAgentConfig : null,
    selectedAgent ? `agent-${selectedAgent.id}` : undefined
  );
  
  // Determine which stream to use
  const activeWebRTC = selectedAgent && isValidAgentConfig ? agentWebRTC : cameraWebRTC;
  const useWebRTCStream = selectedAgent && isValidAgentConfig ? isValidAgentConfig : isValidCameraConfig;
  
  // Determine if stream is live
  const isLive = useWebRTCStream 
    ? activeWebRTC.connectionState === 'connected' && activeWebRTC.videoStream !== null
    : camera?.stream_url && camera.stream_url.trim() !== '';
  
  // Get connection status
  const getConnectionStatus = () => {
    if (!useWebRTCStream) return null;
    
    if (activeWebRTC.connectionState === 'connected') {
      return { icon: Wifi, color: 'text-green-500', text: 'Connected' };
    } else if (activeWebRTC.connectionState === 'connecting') {
      return { icon: Wifi, color: 'text-yellow-500', text: 'Connecting...' };
    } else if (activeWebRTC.connectionState === 'failed' || activeWebRTC.error) {
      return { icon: AlertCircle, color: 'text-red-500', text: 'Failed' };
    } else if (activeWebRTC.connectionState === 'disconnected') {
      return { icon: WifiOff, color: 'text-gray-500', text: 'Disconnected' };
    }
    return null;
  };

  const connectionStatus = getConnectionStatus();
  
  // Reset selected agent when camera changes
  useEffect(() => {
    setSelectedAgentId(null);
  }, [camera?.id]);
  
  // Reattach video stream when video element is remounted or stream source changes
  useEffect(() => {
    if (useWebRTCStream && activeWebRTC.videoStream && activeWebRTC.videoRef.current) {
      const videoElement = activeWebRTC.videoRef.current;
      
      // Only update if srcObject is different or null
      if (videoElement.srcObject !== activeWebRTC.videoStream) {
        console.log(`[CameraDetailPage] Reattaching video stream (stream source changed)`);
        videoElement.srcObject = activeWebRTC.videoStream;
        videoElement.play().then(() => {
          console.log(`[CameraDetailPage] Video stream reattached successfully`);
        }).catch(e => {
          console.error(`[CameraDetailPage] Video play error:`, e);
        });
      }
    }
  }, [useWebRTCStream, activeWebRTC.videoStream, activeWebRTC.videoRef, selectedAgentId]);
  
  // Get stream label for display
  const getStreamLabel = () => {
    if (selectedAgent) {
      return `Agent: ${selectedAgent.name}`;
    }
    return camera.name;
  };
  
  // Get the selected agent's zone to display
  const displayZone = selectedAgent?.zone || null;

  // Fetch agents when camera changes
  useEffect(() => {
    const fetchAgents = async () => {
      if (!camera?.id) {
        setIsLoadingAgents(false);
        return;
      }

      setIsLoadingAgents(true);
      setAgentsError(null);

      const result = await listAgentsByCamera(camera.id);

      if (result.success && result.agents) {
        // Map backend response to frontend format
        const mappedAgents = result.agents.map((agent: AgentResponse) => ({
          id: agent.id,
          name: agent.name,
          model: agent.model || 'Unknown Model',
          detections: 0, // Backend doesn't provide detections count, default to 0
          isActive: agent.status === 'ACTIVE',
          color: agent.status === 'ACTIVE' ? 'green' : 'gray',
          stream_config: agent.stream_config,  // Store stream_config from backend
          zone: null, // Zones are handled separately, can be added later if needed
        }));
        setAgents(mappedAgents);
      } else {
        setAgentsError(result.error || 'Failed to load agents');
        console.error('Error fetching agents:', result.error);
        // Set empty array on error
        setAgents([]);
      }

      setIsLoadingAgents(false);
    };

    fetchAgents();
  }, [camera?.id]);

  // State for chatbot visibility (moved after webrtc hook to avoid dependency issues)
  // Note: isChatbotOpen is already declared above, this is just for reference
  
  // State for zone drawing mode
  const [isZoneDrawingMode, setIsZoneDrawingMode] = useState(false);
  const [pendingZoneName, setPendingZoneName] = useState('');
  const [pendingAgentId, setPendingAgentId] = useState<string | number | null>(null);
  
  // State for panel widths (in pixels)
  const [leftPanelWidth, setLeftPanelWidth] = useState(240);
  const [rightPanelWidth, setRightPanelWidth] = useState(600);

  // State for timeline current time (real-time)
  const [localCurrentTime, setLocalCurrentTime] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  // Ref for chatbot to send zone data
  const chatbotRef = useRef<AgentChatbotRef>(null);

  // Handle agent card click - toggle selection to switch stream
  const handleAgentClick = (agent) => {
    // If clicking the same agent, deselect (show raw camera stream)
    // Otherwise, select this agent (show agent's processed stream)
    if (selectedAgentId === agent.id) {
      setSelectedAgentId(null);
      console.log(`[CameraDetailPage] Deselected agent, showing raw camera stream`);
    } else {
      setSelectedAgentId(agent.id);
      console.log(`[CameraDetailPage] Selected agent ${agent.name} (${agent.id}), switching to agent stream`);
      if (agent.stream_config) {
        console.log(`[CameraDetailPage] Agent stream config:`, {
          viewer_id: agent.stream_config.viewer_id,
          signaling_url: agent.stream_config.signaling_url,
        });
      }
    }
  };

  // Handle Add Agent button click
  const handleAddAgent = () => {
    setIsChatbotOpen(true);
  };

  // Handle close chatbot
  const handleCloseChatbot = () => {
    setIsChatbotOpen(false);
  };
  
  // Function to initiate zone drawing (called from chatbot)
  const startZoneDrawing = (zoneName: string, agentId?: string | null) => {
    setPendingZoneName(zoneName);
    setPendingAgentId(agentId ?? null);
    setIsZoneDrawingMode(true);
  };
  
  // Handle zone drawing complete
  const handleZoneComplete = (zone) => {
    setIsZoneDrawingMode(false);
    
    if (pendingAgentId) {
      // Update existing agent with zone
      setAgents(agents.map(agent => 
        agent.id === pendingAgentId 
          ? { ...agent, zone: zone }
          : agent
      ));
      setSelectedAgentId(pendingAgentId);
    }
    
    // Send zone data to chatbot if it's open
    if (isChatbotOpen && chatbotRef.current) {
      chatbotRef.current.sendZoneData(zone);
    }
    
    console.log('Zone created:', zone);
    
    setPendingZoneName('');
    setPendingAgentId(null);
  };
  
  // Handle zone drawing cancel
  const handleZoneCancel = () => {
    setIsZoneDrawingMode(false);
    setPendingZoneName('');
    setPendingAgentId(null);
  };
  
  // Note: Zones are still supported per agent, but we're not displaying them on the main stream anymore
  // This can be enhanced later if needed

  return (
    // Fixed height container - no page scrolling
    <div className="h-full flex flex-col overflow-hidden">
      {/* Breadcrumb navigation - stays at top */}
      <div className="flex items-center gap-2 text-sm mb-4 flex-shrink-0">
        <button
          onClick={onBack}
          className={`hover:underline ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
        >
          Dashboard
        </button>
        <ChevronRight className={`w-3 h-3 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
        <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
          {camera.name}
        </span>
      </div>

      {/* Main content - Dynamic layout based on chatbot state - fills remaining height */}
      <div className="flex-1 min-h-0 flex gap-4">
        {isChatbotOpen ? (
          // 3-Panel Layout - Resizable
          <>
            {/* Left Panel - Agents list (Resizable) */}
            <Resizable
              size={{ width: leftPanelWidth, height: '100%' }}
              onResizeStop={(e, direction, ref, d) => {
                setLeftPanelWidth(leftPanelWidth + d.width);
              }}
              minWidth={220}
              maxWidth={280}
              enable={{ right: true }}
              handleStyles={{
                right: {
                  width: '4px',
                  right: '-2px',
                  cursor: 'col-resize',
                },
              }}
              handleClasses={{
                right: theme === 'dark' 
                  ? 'hover:bg-blue-500 transition-colors' 
                  : 'hover:bg-blue-400 transition-colors',
              }}
              className="flex-shrink-0 h-full animate-slideInLeft"
            >
              <div className="h-full flex flex-col">
                <div
                  className={`rounded-lg flex flex-col h-full ${
                    theme === 'dark'
                      ? 'bg-[#1a2332] border border-gray-800'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  {/* Active Agents Header - stays at top */}
                  <div className="p-4 pb-0 flex-shrink-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Active Agents
                      </h3>
                      <button
                        onClick={handleAddAgent}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Agent</span>
                      </button>
                    </div>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {agents.filter(a => a.isActive).length} running
                    </p>
                  </div>

                  {/* Agents list - scrollable container */}
                  <div className="overflow-y-auto flex-1 px-4 py-4">
                    {isLoadingAgents ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                          <div className={`inline-block w-6 h-6 border-2 border-t-transparent rounded-full animate-spin ${
                            theme === 'dark' ? 'border-blue-500' : 'border-blue-600'
                          }`}></div>
                          <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            Loading agents...
                          </p>
                        </div>
                      </div>
                    ) : agentsError ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                          <p className={`text-xs ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                            {agentsError}
                          </p>
                        </div>
                      </div>
                    ) : agents.length === 0 ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                          <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            No agents found
                          </p>
                          <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                            Click "Add Agent" to create one
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {agents.map((agent) => (
                          <div
                            key={agent.id}
                            onClick={() => handleAgentClick(agent)}
                            className={`p-2.5 rounded-lg cursor-pointer transition-all duration-150 ${
                              selectedAgentId === agent.id
                                ? theme === 'dark'
                                  ? 'bg-blue-500/20 border-2 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                                  : 'bg-blue-50 border-2 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                                : theme === 'dark'
                                ? 'bg-[#0f1729] border border-gray-700 hover:border-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                                : 'bg-gray-50 border border-gray-200 hover:border-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                            }`}
                          >
                            {/* Agent info */}
                            <div className="mb-1.5">
                              <div className="flex items-center justify-between">
                                <h4 className={`text-sm mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                  {agent.name}
                                </h4>
                                {agent.zone && (
                                  <span className="text-xs text-blue-500">🗺️</span>
                                )}
                              </div>
                              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                {agent.model}
                              </p>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                Status
                              </span>
                              <span
                                className={`text-xs px-2 py-0.5 rounded ${
                                  agent.isActive
                                    ? 'bg-green-500/20 text-green-500'
                                    : theme === 'dark'
                                    ? 'bg-gray-700 text-gray-400'
                                    : 'bg-gray-200 text-gray-600'
                                }`}
                              >
                                {agent.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quick actions - stays at bottom */}
                  <div className="p-4 pt-0 border-t border-gray-700 flex-shrink-0">
                    <p className={`text-xs mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      Quick actions
                    </p>
                    <div className="flex gap-2">
                      <button
                        className={`flex-1 px-3 py-2 rounded text-xs transition-colors ${
                          theme === 'dark'
                            ? 'bg-[#0f1729] hover:bg-gray-700 text-white border border-gray-700'
                            : 'bg-white hover:bg-gray-100 text-gray-900 border border-gray-300'
                        }`}
                      >
                        Start All
                      </button>
                      <button
                        className={`flex-1 px-3 py-2 rounded text-xs transition-colors ${
                          theme === 'dark'
                            ? 'bg-[#0f1729] hover:bg-gray-700 text-white border border-gray-700'
                            : 'bg-white hover:bg-gray-100 text-gray-900 border border-gray-300'
                        }`}
                      >
                        Configure
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Resizable>

            {/* Center Panel - Chatbot (Flexible) */}
            <div className="flex-1 min-w-[400px] animate-fadeIn">
              <AgentChatbot 
                ref={chatbotRef}
                theme={theme} 
                onClose={handleCloseChatbot} 
                startZoneDrawing={startZoneDrawing}
                cameraId={camera?.id || ''}
              />
            </div>

            {/* Right Panel - Camera feed (Resizable) */}
            <Resizable
              size={{ width: rightPanelWidth, height: '100%' }}
              onResizeStop={(e, direction, ref, d) => {
                setRightPanelWidth(rightPanelWidth + d.width);
              }}
              minWidth={400}
              maxWidth={800}
              enable={{ left: true }}
              handleStyles={{
                left: {
                  width: '4px',
                  left: '-2px',
                  cursor: 'col-resize',
                },
              }}
              handleClasses={{
                left: theme === 'dark'
                  ? 'hover:bg-blue-500 transition-colors'
                  : 'hover:bg-blue-400 transition-colors',
              }}
              className="flex-shrink-0 animate-slideInRight"
            >
              <div className="h-full flex flex-col">
                {isZoneDrawingMode ? (
                  // Zone Drawing Mode
                  <ZoneDrawingPanel
                    cameraSnapshot="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=675&fit=crop"
                    camera={camera}
                    zoneName={pendingZoneName}
                    onZoneComplete={handleZoneComplete}
                    onCancel={handleZoneCancel}
                    theme={theme}
                  />
                ) : (
                  // Normal Live Feed Mode
                  <div
                    className={`rounded-lg flex flex-col h-full overflow-hidden ${
                      theme === 'dark'
                        ? 'bg-[#1a2332] border border-gray-800'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    {/* Camera info header */}
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="text-red-500 text-xs">LIVE</span>
                        </div>
                        <div>
                          <h2 className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {getStreamLabel()}
                          </h2>
                          <div className={`flex items-center gap-1 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            <MapPin className="w-3 h-3" />
                            <span>{camera.location}</span>
                            {selectedAgent && (
                              <span className="ml-2 px-2 py-0.5 rounded bg-blue-500/20 text-blue-500 text-xs">
                                Agent Stream
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Video player with timeline inside */}
                    <div className="flex-1 bg-gray-900 relative overflow-hidden flex flex-col">
                      {/* Video container - maintains aspect ratio */}
                      <div className="flex-1 flex items-center justify-center bg-gray-900 relative overflow-hidden">
                        {useWebRTCStream ? (
                          <>
                            <video
                              ref={activeWebRTC.videoRef}
                              className="max-w-full max-h-full w-auto h-auto"
                              autoPlay
                              muted
                              playsInline
                              controls
                            />
                            {activeWebRTC.connectionState !== 'connected' && connectionStatus && (
                              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-10">
                                <div className="text-center">
                                  {(() => {
                                    const IconComponent = connectionStatus.icon;
                                    return <IconComponent className={`w-12 h-12 mx-auto mb-2 ${connectionStatus.color}`} />;
                                  })()}
                                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {connectionStatus.text}
                                  </p>
                                  {activeWebRTC.error && (
                                    <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                                      {activeWebRTC.error}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </>
                        ) : camera?.stream_url && camera.stream_url.trim() !== '' ? (
                          <video
                            className="max-w-full max-h-full w-auto h-auto"
                            autoPlay
                            loop
                            muted
                            playsInline
                            controls
                          >
                            <source
                              src={camera.stream_url}
                              type="video/mp4"
                            />
                            Your browser does not support the video tag.
                          </video>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                              No stream available
                            </span>
                          </div>
                        )}
                        {displayZone && <ZoneOverlay zone={displayZone} />}
                      </div>

                      {/* Timeline Chart - Inside video container, below video, flush with bottom */}
                      <div className="flex-shrink-0 bg-gray-900" style={{ height: '180px', marginTop: 'auto' }}>
                        <TimelineChart
                          theme={theme}
                          cameraId={camera?.id || ''}
                          agents={agents.map(agent => ({
                            id: agent.id.toString(),
                            name: agent.name,
                            camera_id: camera?.id || '',
                            model: agent.model,
                            status: agent.isActive ? 'ACTIVE' : 'INACTIVE',
                            stream_config: agent.stream_config,
                          }))}
                          currentTime={localCurrentTime}
                          onTimeChange={(time) => setLocalCurrentTime(time)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Resizable>
          </>
        ) : (
          // 2-Panel Layout - Original
          <>
            {/* Left side - Agents list */}
            <div className="w-full lg:w-[320px] flex-shrink-0 flex flex-col">
              <div
                className={`rounded-lg flex flex-col h-full ${
                  theme === 'dark'
                    ? 'bg-[#1a2332] border border-gray-800'
                    : 'bg-white border border-gray-200'
                }`}
              >
                {/* Active Agents Header - stays at top */}
                <div className="p-4 pb-0 flex-shrink-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Active Agents
                    </h3>
                    <button
                      onClick={handleAddAgent}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Agent</span>
                    </button>
                  </div>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {agents.filter(a => a.isActive).length} running
                  </p>
                </div>

                {/* Agents list - scrollable container */}
                <div className="overflow-y-auto flex-1 px-4 py-4">
                  {isLoadingAgents ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <div className={`inline-block w-6 h-6 border-2 border-t-transparent rounded-full animate-spin ${
                          theme === 'dark' ? 'border-blue-500' : 'border-blue-600'
                        }`}></div>
                        <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          Loading agents...
                        </p>
                      </div>
                    </div>
                  ) : agentsError ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <p className={`text-xs ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                          {agentsError}
                        </p>
                      </div>
                    </div>
                  ) : agents.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          No agents found
                        </p>
                        <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                          Click "Add Agent" to create one
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {agents.map((agent) => (
                        <div
                          key={agent.id}
                          onClick={() => handleAgentClick(agent)}
                          className={`p-2.5 rounded-lg cursor-pointer transition-all duration-150 ${
                            selectedAgentId === agent.id
                              ? theme === 'dark'
                                ? 'bg-blue-500/20 border-2 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                                : 'bg-blue-50 border-2 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                              : theme === 'dark'
                              ? 'bg-[#0f1729] border border-gray-700 hover:border-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                              : 'bg-gray-50 border border-gray-200 hover:border-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                          }`}
                        >
                          {/* Agent info */}
                          <div className="mb-1.5">
                            <h4 className={`text-sm mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              {agent.name}
                            </h4>
                            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                              {agent.model}
                            </p>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                              Status
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${
                                agent.isActive
                                  ? 'bg-green-500/20 text-green-500'
                                  : theme === 'dark'
                                  ? 'bg-gray-700 text-gray-400'
                                  : 'bg-gray-200 text-gray-600'
                              }`}
                            >
                              {agent.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick actions - stays at bottom */}
                <div className="p-4 pt-0 border-t border-gray-700 flex-shrink-0">
                  <p className={`text-xs mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    Quick actions
                  </p>
                  <div className="flex gap-2">
                    <button
                      className={`flex-1 px-3 py-2 rounded text-xs transition-colors ${
                        theme === 'dark'
                          ? 'bg-[#0f1729] hover:bg-gray-700 text-white border border-gray-700'
                          : 'bg-white hover:bg-gray-100 text-gray-900 border border-gray-300'
                      }`}
                    >
                      Start All
                    </button>
                    <button
                      className={`flex-1 px-3 py-2 rounded text-xs transition-colors ${
                        theme === 'dark'
                          ? 'bg-[#0f1729] hover:bg-gray-700 text-white border border-gray-700'
                          : 'bg-white hover:bg-gray-100 text-gray-900 border border-gray-300'
                      }`}
                    >
                      Configure
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Camera feed - fixed height */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div
                className={`rounded-lg flex flex-col h-full overflow-hidden ${
                  theme === 'dark'
                    ? 'bg-[#1a2332] border border-gray-800'
                    : 'bg-white border border-gray-200'
                }`}
              >
                {/* Camera info header */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-red-500 text-xs">LIVE</span>
                    </div>
                    <div>
                      <h2 className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {getStreamLabel()}
                      </h2>
                      <div className={`flex items-center gap-1 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        <MapPin className="w-3 h-3" />
                        <span>{camera.location}</span>
                        {selectedAgent && (
                          <span className="ml-2 px-2 py-0.5 rounded bg-blue-500/20 text-blue-500 text-xs">
                            Agent Stream
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Video player with timeline inside */}
                <div className="flex-1 bg-gray-900 relative overflow-hidden flex flex-col">
                  {/* Video container - maintains aspect ratio */}
                  <div className="flex-1 flex items-center justify-center bg-gray-900 relative overflow-hidden">
                    {useWebRTCStream ? (
                      <>
                        <video
                          ref={activeWebRTC.videoRef}
                          className="max-w-full max-h-full w-auto h-auto"
                          autoPlay
                          muted
                          playsInline
                          controls
                        />
                        {activeWebRTC.connectionState !== 'connected' && connectionStatus && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-10">
                            <div className="text-center">
                              {(() => {
                                const IconComponent = connectionStatus.icon;
                                return <IconComponent className={`w-12 h-12 mx-auto mb-2 ${connectionStatus.color}`} />;
                              })()}
                              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                {connectionStatus.text}
                              </p>
                              {activeWebRTC.error && (
                                <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                                  {activeWebRTC.error}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    ) : camera?.stream_url && camera.stream_url.trim() !== '' ? (
                      <video
                        className="max-w-full max-h-full w-auto h-auto"
                        autoPlay
                        loop
                        muted
                        playsInline
                        controls
                      >
                        <source
                          src={camera.stream_url}
                          type="video/mp4"
                        />
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        <span className={`text-sm mb-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                          No stream available
                        </span>
                        {useWebRTCStream && !isValidAgentConfig && !isValidCameraConfig && (
                          <span className={`text-xs ${theme === 'dark' ? 'text-yellow-500' : 'text-yellow-600'}`}>
                            WebRTC configuration is incomplete or invalid
                          </span>
                        )}
                      </div>
                    )}
                    {displayZone && <ZoneOverlay zone={displayZone} />}
                  </div>

                  {/* Timeline Chart - Inside video container, below video, flush with bottom */}
                  <div className="flex-shrink-0 bg-gray-900" style={{ height: '180px', marginTop: 'auto' }}>
                    <TimelineChart
                      theme={theme}
                      cameraId={camera?.id || ''}
                      agents={agents.map(agent => ({
                        id: agent.id.toString(),
                        name: agent.name,
                        camera_id: camera?.id || '',
                        model: agent.model,
                        status: agent.isActive ? 'ACTIVE' : 'INACTIVE',
                        stream_config: agent.stream_config,
                      }))}
                      currentTime={localCurrentTime}
                      onTimeChange={(time) => setLocalCurrentTime(time)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CameraDetailPage;