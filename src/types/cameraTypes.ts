// TypeScript Type Definitions for Cameras
// These types match what your backend expects and returns

// ICE Server configuration for WebRTC
export interface ICEServer {
  urls: string | string[];       // Can be a single URL string or array of URLs
  username?: string;
  credential?: string;
}

// WebRTC configuration - now at top level of camera response
export interface WebRTCConfig {
  signaling_url: string;         // WebSocket signaling server URL
  viewer_id: string;             // Unique viewer ID for this connection
  ice_servers: ICEServer[];      // STUN/TURN servers for NAT traversal
}

// Stream configuration from backend (legacy support)
export interface StreamConfig {
  camera_id: string;             // Camera ID
  stream_type: 'webrtc' | 'rtsp' | 'hls' | 'mp4' | string; // Type of stream
  webrtc_config?: WebRTCConfig;  // WebRTC-specific configuration (legacy)
}

// Response type - What the backend returns for a camera
export interface CameraResponse {
  id: string;                    // Camera's unique ID
  name: string;                  // Camera's name
  stream_url: string;            // URL of the camera stream (fallback for non-WebRTC)
  device_id: string;             // Device ID
  stream_config?: StreamConfig;  // Stream configuration (legacy support)
  webrtc_config?: WebRTCConfig;  // WebRTC configuration (new structure - at top level)
  owner_user_id?: string;        // Owner user ID
}

