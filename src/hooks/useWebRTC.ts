// WebRTC Hook - Manages WebRTC connection for camera streaming
// Extracted and adapted from viewer.html for React use
// Supports persistent connections when cameraId is provided

import { useState, useEffect, useRef, useCallback } from 'react';
import type { WebRTCConfig } from '../types/cameraTypes';

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'failed';

interface UseWebRTCReturn {
  connectionState: ConnectionState;
  videoStream: MediaStream | null;
  error: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  reconnect: () => void;
}

// Global connection store - persists connections across component unmounts
const connectionStore = new Map<string, {
  pc: RTCPeerConnection | null;
  ws: WebSocket | null;
  videoStream: MediaStream | null;
  connectionState: ConnectionState;
  error: string | null;
  broadcasterId: string | null;
  lastConfig: WebRTCConfig | null;  // Track last used config to detect changes
  localCandidateQueue: Array<any>;
  heartbeatInterval: NodeJS.Timeout | null;
  reconnectAttempts: number;
  lastPongTime: number;
  videoTracks: Map<string, MediaStream>;
  subscribers: Set<(state: ConnectionState, stream: MediaStream | null, error: string | null) => void>;
}>();

/**
 * Custom hook for managing WebRTC connection to camera stream
 * @param config - WebRTC configuration from camera.webrtc_config (new structure) or stream_config.webrtc_config (legacy)
 * @param cameraId - Optional camera ID to persist connection across navigation
 * @returns Connection state, video stream, error, and controls
 */
export function useWebRTC(config: WebRTCConfig | null, cameraId?: string): UseWebRTCReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const storeKey = cameraId || 'temp';
  const isPersistent = !!cameraId;
  
  // Get or create store entry
  const getStoreEntry = useCallback(() => {
    if (!connectionStore.has(storeKey)) {
      connectionStore.set(storeKey, {
        pc: null,
        ws: null,
        videoStream: null,
        connectionState: 'idle',
        error: null,
        broadcasterId: null,
        lastConfig: null,
        localCandidateQueue: [],
        heartbeatInterval: null,
        reconnectAttempts: 0,
        lastPongTime: Date.now(),
        videoTracks: new Map(),
        subscribers: new Set(),
      });
    }
    return connectionStore.get(storeKey)!;
  }, [storeKey]);

  const storeEntry = getStoreEntry();
  
  // State that syncs with store
  const [connectionState, setConnectionState] = useState<ConnectionState>(storeEntry.connectionState);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(storeEntry.videoStream);
  const [error, setError] = useState<string | null>(storeEntry.error);
  
  // Refs that point to store
  const pcRef = useRef(storeEntry.pc);
  const wsRef = useRef(storeEntry.ws);
  const broadcasterIdRef = useRef(storeEntry.broadcasterId);
  const lastConfigRef = useRef(storeEntry.lastConfig);
  const localCandidateQueueRef = useRef(storeEntry.localCandidateQueue);
  const heartbeatIntervalRef = useRef(storeEntry.heartbeatInterval);
  const reconnectAttemptsRef = useRef(storeEntry.reconnectAttempts);
  const lastPongTimeRef = useRef(storeEntry.lastPongTime);
  const videoTracksRef = useRef(storeEntry.videoTracks);
  const isMountedRef = useRef(true);

  // Sync refs with store
  useEffect(() => {
    pcRef.current = storeEntry.pc;
    wsRef.current = storeEntry.ws;
    broadcasterIdRef.current = storeEntry.broadcasterId;
    lastConfigRef.current = storeEntry.lastConfig;
    localCandidateQueueRef.current = storeEntry.localCandidateQueue;
    heartbeatIntervalRef.current = storeEntry.heartbeatInterval;
    reconnectAttemptsRef.current = storeEntry.reconnectAttempts;
    lastPongTimeRef.current = storeEntry.lastPongTime;
    videoTracksRef.current = storeEntry.videoTracks;
  }, [storeEntry]);

  // Subscribe to store updates
  useEffect(() => {
    const updateCallback = (state: ConnectionState, stream: MediaStream | null, err: string | null) => {
      setConnectionState(state);
      setVideoStream(stream);
      setError(err);
      
      // Update video element
      if (stream && videoRef.current && videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => {
          console.error(`[WebRTC] Video play error:`, e);
        });
      }
    };
    
    storeEntry.subscribers.add(updateCallback);
    
    // Initial sync
    updateCallback(storeEntry.connectionState, storeEntry.videoStream, storeEntry.error);
    
    return () => {
      storeEntry.subscribers.delete(updateCallback);
    };
  }, [storeEntry]);

  // Watch for videoRef changes and reattach stream (handles component remounting)
  // This effect runs whenever the video element is mounted or the stream changes
  useEffect(() => {
    // Use a small delay to ensure the element is fully mounted
    const timeoutId = setTimeout(() => {
      if (videoRef.current && storeEntry.videoStream) {
        const videoElement = videoRef.current;
        if (videoElement.srcObject !== storeEntry.videoStream) {
          const timestamp = new Date().toLocaleTimeString();
          console.log(`[${timestamp}] [WebRTC] Reattaching video stream to video element (element remounted)`);
          videoElement.srcObject = storeEntry.videoStream;
          videoElement.play().then(() => {
            console.log(`[${timestamp}] [WebRTC] Video stream reattached and playing`);
          }).catch(e => {
            console.error(`[WebRTC] Video play error on reattach:`, e);
          });
        }
      }
    }, 100); // Small delay to ensure DOM is ready
    
    return () => clearTimeout(timeoutId);
  }, [videoRef.current, storeEntry.videoStream]);

  // Helper to update store and notify subscribers
  const updateStore = useCallback((updates: Partial<typeof storeEntry>) => {
    Object.assign(storeEntry, updates);
    // Sync refs
    pcRef.current = storeEntry.pc;
    wsRef.current = storeEntry.ws;
    broadcasterIdRef.current = storeEntry.broadcasterId;
    lastConfigRef.current = storeEntry.lastConfig;
    localCandidateQueueRef.current = storeEntry.localCandidateQueue;
    heartbeatIntervalRef.current = storeEntry.heartbeatInterval;
    reconnectAttemptsRef.current = storeEntry.reconnectAttempts;
    lastPongTimeRef.current = storeEntry.lastPongTime;
    videoTracksRef.current = storeEntry.videoTracks;
    
    // Notify all subscribers
    storeEntry.subscribers.forEach(cb => 
      cb(storeEntry.connectionState, storeEntry.videoStream, storeEntry.error)
    );
  }, [storeEntry]);

  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000;

  // Logging function - always log for debugging
  const log = useCallback((msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] [WebRTC ${config?.viewer_id || 'unknown'}]`, msg);
  }, [config?.viewer_id]);

  // Cleanup function - only cleanup if not persistent
  const cleanup = useCallback(() => {
    // If persistent connection, don't cleanup - keep alive
    if (isPersistent) {
      log(`🔒 Keeping connection alive for camera: ${cameraId}`);
      isMountedRef.current = false;
      return;
    }
    
    log('🧹 Cleaning up WebRTC connection');
    
    // Clear heartbeat
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      updateStore({ heartbeatInterval: null });
    }

    // Close WebSocket
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (e) {
        // Ignore errors during cleanup
      }
      updateStore({ ws: null });
    }

    // Close PeerConnection
    if (pcRef.current) {
      try {
        pcRef.current.getReceivers().forEach(receiver => {
          const track = receiver.track;
          if (track) {
            track.stop();
          }
        });
        pcRef.current.close();
      } catch (e) {
        // Ignore errors during cleanup
      }
      updateStore({ pc: null });
    }

    // Stop all video streams
    videoTracksRef.current.forEach(stream => {
      stream.getTracks().forEach(track => track.stop());
    });
    videoTracksRef.current.clear();

    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    updateStore({ 
      videoStream: null, 
      broadcasterId: null, 
      localCandidateQueue: [], 
      reconnectAttempts: 0,
      connectionState: 'idle',
      error: null,
    });
  }, [log, isPersistent, cameraId, updateStore]);

  // Create PeerConnection
  const createPeerConnection = useCallback((): RTCPeerConnection => {
    if (pcRef.current && pcRef.current.connectionState !== 'closed') {
      try {
        pcRef.current.close();
      } catch (e) {
        // Ignore
      }
    }

    if (!config) {
      throw new Error('WebRTC config is required');
    }

    // Convert ICE servers to RTCConfiguration format
    // Handle both string and array of strings for urls
    const iceServers: RTCIceServer[] = config.ice_servers.map(server => ({
      urls: Array.isArray(server.urls) ? server.urls : server.urls,
      ...(server.username && { username: server.username }),
      ...(server.credential && { credential: server.credential }),
    }));

    // Log ICE server configuration
    log(`🔧 ICE Servers Configuration:`);
    config.ice_servers.forEach((server, index) => {
      const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
      urls.forEach(url => {
        const serverType = url.startsWith('stun:') ? 'STUN' : url.startsWith('turn:') ? 'TURN' : 'UNKNOWN';
        log(`  [${index}] ${serverType}: ${url}`);
        console.log(`[WebRTC] ICE Server [${index}]:`, {
          type: serverType,
          url: url,
          hasCredentials: !!(server.username && server.credential),
        });
      });
    });

    const pc = new RTCPeerConnection({ iceServers });
    updateStore({ pc });
    pcRef.current = pc;

    pc.oniceconnectionstatechange = () => {
      if (!isMountedRef.current) return;
      
      const state = pc.iceConnectionState;
      log(`🔍 ICE connection state changed: ${state}`);
      
      // Log current ICE gathering state
      if (pc.iceGatheringState) {
        log(`📊 ICE Gathering State: ${pc.iceGatheringState}`);
      }
      
      // Try to get selected candidate pair info when connected
      if ((state === 'connected' || state === 'completed') && pc.getStats) {
        pc.getStats().then(stats => {
          try {
            stats.forEach((report: any) => {
              if (report.type === 'candidate-pair' && report.selected) {
                const localCandidateId = report.localCandidateId;
                const remoteCandidateId = report.remoteCandidateId;
                
                if (localCandidateId) {
                  const localCandidate = stats.get(localCandidateId);
                  const remoteCandidate = remoteCandidateId ? stats.get(remoteCandidateId) : null;
                  
                  if (localCandidate) {
                    const candidateType = (localCandidate as any).candidateType || (localCandidate as any).type;
                    const candidateStr = (localCandidate as any).candidate || '';
                    const isStun = candidateType === 'srflx' || candidateStr.includes('typ srflx');
                    const isTurn = candidateType === 'relay' || candidateStr.includes('typ relay');
                    
                    if (isStun) {
                      log(`✅ Connection established using STUN (Server Reflexive)`);
                      console.log(`[WebRTC] 🟢 CONNECTED VIA STUN:`, {
                        localCandidate: candidateStr,
                        remoteCandidate: remoteCandidate ? (remoteCandidate as any).candidate : null,
                        state: state,
                        candidateType: candidateType,
                      });
                    } else if (isTurn) {
                      log(`🔄 Connection established using TURN (Relayed)`);
                      console.log(`[WebRTC] 🟡 CONNECTED VIA TURN:`, {
                        localCandidate: candidateStr,
                        remoteCandidate: remoteCandidate ? (remoteCandidate as any).candidate : null,
                        state: state,
                        candidateType: candidateType,
                      });
                    } else {
                      log(`🔗 Connection established using ${candidateType || 'Direct'}`);
                      console.log(`[WebRTC] Connection Type:`, {
                        type: candidateType,
                        localCandidate: candidateStr,
                        state: state,
                      });
                    }
                  }
                }
              }
            });
          } catch (statsError) {
            console.warn(`[WebRTC] Error processing stats:`, statsError);
          }
        }).catch(err => {
          console.warn(`[WebRTC] Could not get stats:`, err);
        });
      }
      
      console.log(`[WebRTC] ICE Connection State Details:`, {
        iceConnectionState: state,
        connectionState: pc.connectionState,
        signalingState: pc.signalingState,
      });
      
      if (state === 'connected' || state === 'completed') {
        log(`✅ ICE connection established successfully`);
        updateStore({ connectionState: 'connected', error: null });
      } else if (state === 'checking') {
        log(`🔄 ICE checking connection...`);
        updateStore({ connectionState: 'connecting' });
      } else if (state === 'failed') {
        log(`❌ ICE connection failed - will attempt reconnection`);
        updateStore({ connectionState: 'failed', error: 'ICE connection failed' });
        setTimeout(() => {
          if (isMountedRef.current && pc.connectionState === 'failed') {
            log('🔄 Attempting to reconnect after ICE failure...');
            reconnect();
          }
        }, 2000);
      } else if (state === 'disconnected') {
        log(`⚠️ ICE connection disconnected`);
      } else if (state === 'closed') {
        log(`🔒 ICE connection closed`);
      }
    };

    pc.onconnectionstatechange = () => {
      if (!isMountedRef.current) return;
      
      const state = pc.connectionState;
      log(`🔗 WebRTC connection state changed: ${state}`);
      console.log(`[WebRTC] Connection State Details:`, {
        connectionState: state,
        iceConnectionState: pc.iceConnectionState,
        signalingState: pc.signalingState,
      });
      
      if (state === 'connected') {
        log(`✅ WebRTC connection established - streaming video`);
        updateStore({ connectionState: 'connected', error: null });
      } else if (state === 'connecting') {
        log(`🔄 Connecting to peer...`);
        updateStore({ connectionState: 'connecting' });
      } else if (state === 'failed') {
        log(`❌ Connection failed - attempting to reconnect...`);
        updateStore({ connectionState: 'failed', error: 'Connection failed' });
        setTimeout(() => {
          if (isMountedRef.current && pc.connectionState === 'failed') {
            reconnect();
          }
        }, 2000);
      } else if (state === 'disconnected') {
        log(`⚠️ Connection disconnected - will attempt recovery`);
        updateStore({ connectionState: 'disconnected' });
        setTimeout(() => {
          if (isMountedRef.current && pc.connectionState === 'disconnected') {
            reconnect();
          }
        }, 3000);
      } else if (state === 'closed') {
        log(`🔒 Connection closed`);
        updateStore({ connectionState: 'idle' });
      }
    };
  
    pc.onsignalingstatechange = () => {
      const state = pc.signalingState;
      if (state === 'stable') {
        log(`✅ Signaling stable`);
      }
    };

    pc.ontrack = (event) => {
      if (!isMountedRef.current) return;
      
      const trackId = event.track.id || event.track.label || `track-${Date.now()}`;
      log(`📹 Received track: ${trackId} (${event.track.kind})`);
      console.log(`[WebRTC] Track Details:`, {
        trackId,
        kind: event.track.kind,
        label: event.track.label,
        enabled: event.track.enabled,
        muted: event.track.muted,
        readyState: event.track.readyState,
        streams: event.streams.length,
      });

      // Create or get MediaStream for this track
      let stream = videoTracksRef.current.get(trackId);
      
      if (!stream) {
        stream = new MediaStream();
        videoTracksRef.current.set(trackId, stream);
        log(`📺 Created new MediaStream for track: ${trackId}`);
      }

      // Add track to stream
      stream.addTrack(event.track);
      log(`✅ Added track to MediaStream: ${trackId}`);

      // Update video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        log(`🎬 Setting video srcObject for track: ${trackId}`);
        videoRef.current.play().then(() => {
          log(`▶️ Video playback started successfully`);
        }).catch(e => {
          log(`❌ Video play error: ${e.message}`);
          console.error(`[WebRTC] Video play error:`, e);
        });
      }

      updateStore({ 
        videoStream: stream, 
        connectionState: 'connected', 
        error: null 
      });
      log(`✅ Video stream ready and playing`);
    };

    pc.onicecandidate = (ev) => {
      const candidate = ev.candidate;
      
      if (candidate) {
        // Determine candidate type for logging
        const candidateType = candidate.type; // 'host', 'srflx' (STUN), 'relay' (TURN), or 'prflx'
        const candidateStr = candidate.candidate;
        let candidateTypeLabel = '';
        let isStun = false;
        let isTurn = false;
        
        switch (candidate.type) {
          case 'host':
            candidateTypeLabel = 'HOST (Direct)';
            break;
          case 'srflx':
            candidateTypeLabel = 'STUN (Server Reflexive)';
            isStun = true;
            break;
          case 'relay':
            candidateTypeLabel = 'TURN (Relayed)';
            isTurn = true;
            break;
          case 'prflx':
            candidateTypeLabel = 'PRFLX (Peer Reflexive)';
            break;
          default:
            candidateTypeLabel = `UNKNOWN (${candidate.type})`;
        }
        
        // Also check candidate string for type indicators
        const isStunCandidate = candidateStr.includes('typ srflx') || candidate.type === 'srflx';
        const isTurnCandidate = candidateStr.includes('typ relay') || candidate.type === 'relay';
        
        // Log with emphasis on STUN/TURN
        if (isStun || isStunCandidate) {
          log(`🧊 ✅ STUN candidate generated: ${candidateStr.substring(0, 80)}...`);
          console.log(`[WebRTC] 🟢 STUN CANDIDATE:`, {
            type: candidate.type,
            candidate: candidateStr,
            sdpMid: candidate.sdpMid,
            sdpMLineIndex: candidate.sdpMLineIndex,
            priority: candidateStr.match(/prio (\d+)/)?.[1],
          });
        } else if (isTurn || isTurnCandidate) {
          log(`🧊 🔄 TURN candidate generated: ${candidateStr.substring(0, 80)}...`);
          console.log(`[WebRTC] 🟡 TURN CANDIDATE:`, {
            type: candidate.type,
            candidate: candidateStr,
            sdpMid: candidate.sdpMid,
            sdpMLineIndex: candidate.sdpMLineIndex,
            priority: candidateStr.match(/prio (\d+)/)?.[1],
          });
        } else {
          log(`🧊 ${candidateTypeLabel} candidate: ${candidateStr.substring(0, 80)}...`);
          console.log(`[WebRTC] ICE Candidate (${candidateTypeLabel}):`, {
            type: candidate.type,
            candidate: candidateStr,
            sdpMid: candidate.sdpMid,
            sdpMLineIndex: candidate.sdpMLineIndex,
          });
        }
      } else {
        log(`🧊 ICE candidate gathering complete`);
      }
      
      const payload = {
        type: 'ice',
        from: config.viewer_id,
        to: broadcasterIdRef.current || null,
        candidate: candidate ? {
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid,
          sdpMLineIndex: candidate.sdpMLineIndex,
        } : {},
      };

      if (!broadcasterIdRef.current) {
        localCandidateQueueRef.current.push(payload);
        log(`📦 Buffered local ICE candidate (waiting for broadcaster ID)`);
        return;
      }

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(payload));
        log(`📤 Sent local ICE candidate to ${broadcasterIdRef.current}`);
      } else {
        log(`⚠️ Cannot send ICE candidate - WebSocket not open`);
      }
    };

    return pc;
  }, [config, log, updateStore]);

  // Connect to signaling server
  const connectSignaling = useCallback(() => {
    if (!config) return;
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return;
    }

    log(`🚀 Connecting to signaling server...`);
    updateStore({ connectionState: 'connecting' });

    try {
      const ws = new WebSocket(config.signaling_url);
      updateStore({ ws });
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) return;
        
        log(`✅ WebSocket signaling connected to: ${config.signaling_url}`);
        console.log(`[WebRTC] WebSocket Connection:`, {
          url: config.signaling_url,
          viewerId: config.viewer_id,
          readyState: ws.readyState,
        });
        updateStore({ reconnectAttempts: 0, connectionState: 'connecting' });
        log(`⏳ Waiting for offer from broadcaster...`);
      };

      ws.onclose = (event) => {
        if (!isMountedRef.current) return;
        
        log(`🔌 WebSocket signaling connection closed (code: ${event.code}, reason: ${event.reason || 'none'})`);
        console.log(`[WebRTC] WebSocket Close Event:`, {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });
        
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          updateStore({ reconnectAttempts: reconnectAttemptsRef.current });
          log(`🔄 Reconnecting... (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
          setTimeout(() => {
            if (isMountedRef.current) {
              connectSignaling();
            }
          }, reconnectDelay);
        } else {
          log(`❌ Max reconnection attempts (${maxReconnectAttempts}) reached`);
          updateStore({ connectionState: 'failed', error: 'Max reconnection attempts reached' });
        }
      };
  
      ws.onerror = (e) => {
        if (!isMountedRef.current) return;
        
        log(`❌ WebSocket signaling error occurred`);
        console.error(`[WebRTC] WebSocket Error:`, e);
        updateStore({ error: 'Signaling connection error' });
      };

      ws.onmessage = async (evt) => {
        if (!isMountedRef.current) return;
        
        try {
          const msg = JSON.parse(evt.data);
          log(`📨 Received WebSocket message: ${msg.type} from ${msg.from || 'unknown'}`);
          console.log(`[WebRTC] WebSocket Message:`, msg);
          
          if (msg.type === 'ping') {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({ type: 'pong', from: config.viewer_id, to: broadcasterIdRef.current }));
              log(`📤 Sent pong response`);
            }
            return;
          }
          
          if (msg.type === 'pong') {
            lastPongTimeRef.current = Date.now();
            updateStore({ lastPongTime: lastPongTimeRef.current });
            log(`💓 Received pong - connection alive`);
            return;
          }

          await handleSignalingMessage(msg);
        } catch (e) {
          log(`❌ Message parse error: ${e instanceof Error ? e.message : 'Unknown error'}`);
          console.error(`[WebRTC] Message Parse Error:`, e, `Raw data:`, evt.data);
        }
      };
    } catch (e) {
      if (!isMountedRef.current) return;
      
      log(`❌ Failed to create WebSocket: ${e instanceof Error ? e.message : 'Unknown error'}`);
      updateStore({ error: 'Failed to connect to signaling server', connectionState: 'failed' });
    }
  }, [config, log, updateStore]);

  // Handle signaling messages
  const handleSignalingMessage = useCallback(async (msg: any) => {
    if (!config || !isMountedRef.current) return;

    const { type, from, sdp, candidate } = msg;

    if (type === 'offer') {
      broadcasterIdRef.current = from;
      updateStore({ broadcasterId: from });
      log(`📥 Received OFFER from broadcaster: ${broadcasterIdRef.current}`);
      console.log(`[WebRTC] Offer Details:`, {
        from,
        sdpLength: sdp?.length || 0,
        sdpPreview: sdp?.substring(0, 100) || 'N/A',
      });

      if (!pcRef.current) {
        log(`🔧 Creating new PeerConnection for offer`);
        createPeerConnection();
      }

      const pc = pcRef.current;
      if (!pc) {
        log(`❌ PeerConnection not available`);
        return;
      }

      try {
        log(`🔧 Setting remote description (offer)`);
        await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp }));
        log(`✅ Remote SDP set successfully`);
        console.log(`[WebRTC] Remote Description Set:`, {
          type: pc.remoteDescription?.type,
          sdpLength: pc.remoteDescription?.sdp?.length || 0,
        });

        log(`🔧 Creating answer...`);
        const answer = await pc.createAnswer();
        log(`✅ Answer created`);
        await pc.setLocalDescription(answer);
        log(`✅ Local description set (answer)`);
        console.log(`[WebRTC] Local Description Set:`, {
          type: pc.localDescription?.type,
          sdpLength: pc.localDescription?.sdp?.length || 0,
        });

        const answerMsg = {
          type: 'answer',
          from: config.viewer_id,
          to: broadcasterIdRef.current,
          sdp: pc.localDescription?.sdp,
        };

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify(answerMsg));
          log(`📤 Sent ANSWER to ${broadcasterIdRef.current}`);
        } else {
          log(`❌ Cannot send answer - WebSocket not open`);
        }

        // Start heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }
        lastPongTimeRef.current = Date.now();
        updateStore({ lastPongTime: lastPongTimeRef.current });
        log(`💓 Starting heartbeat (every 10 seconds)`);
        const heartbeat = setInterval(() => {
          if (!isMountedRef.current) return;
          
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && broadcasterIdRef.current) {
            if (Date.now() - lastPongTimeRef.current > 30000) {
              log(`⚠️ No pong received in 30 seconds - connection may be stale`);
              reconnect();
              return;
            }
            wsRef.current.send(JSON.stringify({ type: 'ping', from: config.viewer_id, to: broadcasterIdRef.current }));
            log(`💓 Sent ping heartbeat`);
          }
        }, 10000);
        updateStore({ heartbeatInterval: heartbeat });

        // Flush buffered ICE candidates
        const bufferedCount = localCandidateQueueRef.current.length;
        while (localCandidateQueueRef.current.length > 0) {
          const cmsg = localCandidateQueueRef.current.shift();
          if (cmsg) {
            cmsg.to = broadcasterIdRef.current;
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify(cmsg));
            }
          }
        }
        if (bufferedCount > 0) {
          log(`📤 Flushed ${bufferedCount} buffered ICE candidates`);
        }
      } catch (e) {
        log(`❌ Error processing offer: ${e instanceof Error ? e.message : 'Unknown error'}`);
        console.error(`[WebRTC] Offer Processing Error:`, e);
        updateStore({ error: `Failed to process offer: ${e instanceof Error ? e.message : 'Unknown error'}`, connectionState: 'failed' });
      }
    } else if (type === 'ice') {
      if (!pcRef.current) {
        log(`⚠️ Received ICE candidate but PeerConnection not available`);
        return;
      }

      try {
        const candidateData = candidate || {};

        if (!candidateData.candidate) {
          await pcRef.current.addIceCandidate(null);
          log(`🧊 Remote ICE gathering complete (end-of-candidates)`);
          return;
        }

        log(`🧊 Adding remote ICE candidate: ${candidateData.candidate.substring(0, 50)}...`);
        const iceCandidate = new RTCIceCandidate({
          candidate: candidateData.candidate,
          sdpMid: candidateData.sdpMid,
          sdpMLineIndex: candidateData.sdpMLineIndex,
        });

        await pcRef.current.addIceCandidate(iceCandidate);
        log(`✅ Remote ICE candidate added successfully`);
      } catch (e) {
        if (e instanceof Error && !e.message.includes('duplicate')) {
          log(`❌ ICE candidate error: ${e.message}`);
          console.error(`[WebRTC] ICE Candidate Error:`, e);
        } else {
          log(`⚠️ Duplicate ICE candidate (ignored)`);
        }
      }
    } else if (type === 'ice-complete') {
      if (!pcRef.current) return;
      try {
        await pcRef.current.addIceCandidate(null);
        log(`✅ Remote ICE gathering complete`);
      } catch (e) {
        log(`⚠️ Error adding end-of-candidates: ${e instanceof Error ? e.message : 'Unknown'}`);
      }
    } else {
      log(`⚠️ Unknown message type: ${type}`);
    }
  }, [config, createPeerConnection, log, updateStore]);

  // Reconnect function
  const reconnect = useCallback(() => {
    if (!isMountedRef.current) return;
    
    log('🔄 Reconnecting...');
    cleanup();
    
    setTimeout(() => {
      if (isMountedRef.current && config) {
        createPeerConnection();
        connectSignaling();
      }
    }, 500);
  }, [config, cleanup, createPeerConnection, connectSignaling, log]);

  // Main effect - initialize connection when config is available
  useEffect(() => {
    isMountedRef.current = true;

    if (!config) {
      log(`⚠️ No WebRTC config provided - connection not initialized`);
      updateStore({ connectionState: 'idle' });
      return;
    }

    // Check if config has changed (compare viewer_id and signaling_url)
    const configChanged = storeEntry.lastConfig && (
      storeEntry.lastConfig.viewer_id !== config.viewer_id ||
      storeEntry.lastConfig.signaling_url !== config.signaling_url
    );

    // If connection already exists and is connected, check if config changed
    if (isPersistent && storeEntry.connectionState === 'connected' && storeEntry.videoStream) {
      if (configChanged) {
        // Config changed - close old connection and create new one
        log(`🔄 Config changed (viewer_id: ${storeEntry.lastConfig?.viewer_id} -> ${config.viewer_id}), closing old connection and creating new one`);
        
        // Close existing connection
        if (wsRef.current) {
          try {
            wsRef.current.close();
          } catch (e) {
            // Ignore errors
          }
        }
        if (pcRef.current) {
          try {
            pcRef.current.close();
          } catch (e) {
            // Ignore errors
          }
        }
        
        // Clear the store entry to force new connection
        updateStore({
          pc: null,
          ws: null,
          videoStream: null,
          connectionState: 'idle',
          broadcasterId: null,
          lastConfig: null,
        });
        // Continue to create new connection below
      } else {
        // Config hasn't changed, reuse existing connection
        log(`♻️ Reusing existing connection for camera: ${cameraId}`);
        if (videoRef.current) {
          videoRef.current.srcObject = storeEntry.videoStream;
          videoRef.current.play().catch(e => {
            console.error(`[WebRTC] Video play error:`, e);
          });
        }
        return;
      }
    }

    log(`🚀 Initializing WebRTC connection`);
    console.log(`[WebRTC] Initialization:`, {
      signalingUrl: config.signaling_url,
      viewerId: config.viewer_id,
      iceServersCount: config.ice_servers.length,
      cameraId,
      isPersistent,
      configChanged: configChanged || false,
    });
    updateStore({ connectionState: 'connecting', lastConfig: config });
    
    createPeerConnection();
    connectSignaling();

    return () => {
      log(`🧹 Component unmounting (connection ${isPersistent ? 'kept alive' : 'will be cleaned up'})`);
      isMountedRef.current = false;
      if (!isPersistent) {
        cleanup();
      }
    };
  }, [config, cameraId, isPersistent, createPeerConnection, connectSignaling, cleanup, log, storeEntry, updateStore]);

  return {
    connectionState,
    videoStream,
    error,
    videoRef,
    reconnect,
  };
}

/**
 * Cleanup all persistent connections (call on logout)
 */
export function cleanupAllWebRTCConnections() {
  console.log(`[WebRTC] Cleaning up all connections...`);
  connectionStore.forEach((entry, cameraId) => {
    console.log(`[WebRTC] Cleaning up connection for camera: ${cameraId}`);
    
    if (entry.heartbeatInterval) {
      clearInterval(entry.heartbeatInterval);
    }

    if (entry.ws) {
      try {
        entry.ws.close();
      } catch (e) {
        // Ignore
      }
    }

    if (entry.pc) {
      try {
        entry.pc.getReceivers().forEach(receiver => {
          const track = receiver.track;
          if (track) {
            track.stop();
          }
        });
        entry.pc.close();
      } catch (e) {
        // Ignore
      }
    }

    entry.videoTracks.forEach(stream => {
      stream.getTracks().forEach(track => track.stop());
    });
  });

  connectionStore.clear();
  console.log(`[WebRTC] All connections cleaned up`);
}
