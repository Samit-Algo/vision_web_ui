// Camera Card Component - Displays a camera feed with live indicator
import React from 'react';
import { MapPin, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { useWebRTC } from '../hooks/useWebRTC';
import type { StreamConfig, WebRTCConfig } from '../types/cameraTypes';

interface CameraCardProps {
  id?: string;
  name: string;
  location: string;
  isLive: boolean;
  streamUrl?: string;
  streamConfig?: StreamConfig;
  webrtcConfig?: WebRTCConfig;
  theme: 'dark' | 'light';
  onClick: () => void;
  viewMode?: 'grid' | 'list';
}

function CameraCard({ id, name, location, isLive, streamUrl, streamConfig, theme, onClick, viewMode = 'grid', webrtcConfig }: CameraCardProps) {
  // Determine if we should use WebRTC - check both new structure (webrtcConfig) and legacy (streamConfig)
  const useWebRTCStream = webrtcConfig || (streamConfig?.stream_type === 'webrtc' && streamConfig?.webrtc_config);
  const webRTCConfigToUse = webrtcConfig || streamConfig?.webrtc_config;
  
  // Use WebRTC hook if WebRTC is configured - pass cameraId for persistent connection
  const webrtc = useWebRTC(useWebRTCStream ? webRTCConfigToUse! : null, id);
  
  // Determine actual live status - WebRTC connected or regular stream available
  const actualIsLive = useWebRTCStream 
    ? webrtc.connectionState === 'connected' && webrtc.videoStream !== null
    : isLive && streamUrl && streamUrl.trim() !== '';
  
  // Get connection status indicator
  const getConnectionStatus = () => {
    if (!useWebRTCStream) return null;
    
    if (webrtc.connectionState === 'connected') {
      return { icon: Wifi, color: 'text-green-500', text: 'Connected' };
    } else if (webrtc.connectionState === 'connecting') {
      return { icon: Wifi, color: 'text-yellow-500', text: 'Connecting...' };
    } else if (webrtc.connectionState === 'failed' || webrtc.error) {
      return { icon: AlertCircle, color: 'text-red-500', text: 'Failed' };
    } else if (webrtc.connectionState === 'disconnected') {
      return { icon: WifiOff, color: 'text-gray-500', text: 'Disconnected' };
    }
    return null;
  };

  const connectionStatus = getConnectionStatus();
  // List view layout - horizontal card
  if (viewMode === 'list') {
    return (
      <div 
        onClick={onClick}
        className={`rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.01] flex ${ 
          theme === 'dark' 
            ? 'bg-[#1a2332] border-2 border-gray-800 hover:border-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]' 
            : 'bg-white border-2 border-gray-200 hover:border-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]'
        }`}
        style={{ transition: 'transform 0.3s, border-color 0.3s, box-shadow 0.3s' }}
      >
        {/* Video section - Fixed width in list view */}
        <div className="relative w-80 flex-shrink-0">
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm">
          {actualIsLive ? (
            <>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-white text-xs">LIVE</span>
            </>
          ) : (
            <span className="text-gray-400 text-xs">OFFLINE</span>
          )}
        </div>
        {useWebRTCStream && connectionStatus && (() => {
          const IconComponent = connectionStatus.icon;
          return (
            <div className={`absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm ${connectionStatus.color}`}>
              <IconComponent className="w-3 h-3" />
              <span className="text-white text-xs">{connectionStatus.text}</span>
            </div>
          );
        })()}

          <div className="aspect-video bg-gray-900 relative">
            {useWebRTCStream ? (
              // WebRTC stream
              <>
                <video 
                  ref={webrtc.videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  playsInline
                />
                {webrtc.connectionState !== 'connected' && connectionStatus && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
                    <div className="text-center">
                      {(() => {
                        const IconComponent = connectionStatus.icon;
                        return <IconComponent className={`w-8 h-8 mx-auto mb-2 ${connectionStatus.color}`} />;
                      })()}
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {connectionStatus.text}
                      </p>
                      {webrtc.error && (
                        <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                          {webrtc.error}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : streamUrl && streamUrl.trim() !== '' ? (
              // Regular video stream
              <video 
                className="w-full h-full object-cover"
                autoPlay 
                loop 
                muted 
                playsInline
              >
                <source 
                  src={streamUrl} 
                  type="video/mp4" 
                />
                Your browser does not support the video tag.
              </video>
            ) : (
              // No stream available
              <div className="w-full h-full flex items-center justify-center">
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                  No stream available
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Details section - Takes remaining space */}
        <div className="flex-1 p-6 flex flex-col justify-center">
          <h3 className={`mb-2 text-xl ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {name}
          </h3>
          <div className={`flex items-center gap-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            <MapPin className="w-5 h-5" />
            <span>{location}</span>
          </div>
        </div>
      </div>
    );
  }

  // Grid view layout - vertical card (default)
  return (
    <div 
      onClick={onClick}
      className={`rounded-lg overflow-hidden cursor-pointer transition-transform duration-300 hover:scale-[1.02] ${ 
        theme === 'dark' 
          ? 'bg-[#1a2332] border-2 border-gray-800 hover:border-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]' 
          : 'bg-white border-2 border-gray-200 hover:border-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]'
      }`}
      style={{ transition: 'transform 0.3s, border-color 0.3s, box-shadow 0.3s' }}
    >
      {/* Top section with LIVE indicator */}
      <div className="relative">
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm">
          {actualIsLive ? (
            <>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-white text-xs">LIVE</span>
            </>
          ) : (
            <span className="text-gray-400 text-xs">OFFLINE</span>
          )}
        </div>
        {useWebRTCStream && connectionStatus && (
          <div className={`absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm ${connectionStatus.color}`}>
            <connectionStatus.icon className="w-3 h-3" />
            <span className="text-white text-xs">{connectionStatus.text}</span>
          </div>
        )}

        {/* Video section */}
        <div className="aspect-video bg-gray-900 relative">
          {useWebRTCStream ? (
            // WebRTC stream
            <>
              <video 
                ref={webrtc.videoRef}
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
              />
              {webrtc.connectionState !== 'connected' && connectionStatus && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
                  <div className="text-center">
                    {(() => {
                      const IconComponent = connectionStatus.icon;
                      return <IconComponent className={`w-8 h-8 mx-auto mb-2 ${connectionStatus.color}`} />;
                    })()}
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {connectionStatus.text}
                    </p>
                    {webrtc.error && (
                      <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                        {webrtc.error}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : streamUrl && streamUrl.trim() !== '' ? (
            // Regular video stream
            <video 
              className="w-full h-full object-cover"
              autoPlay 
              loop 
              muted 
              playsInline
            >
              <source 
                src={streamUrl} 
                type="video/mp4" 
              />
              Your browser does not support the video tag.
            </video>
          ) : (
            // No stream available
            <div className="w-full h-full flex items-center justify-center">
              <span className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                No stream available
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom section with camera name and location */}
      <div className="p-4">
        <h3 className={`mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          {name}
        </h3>
        <div className={`flex items-center gap-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          <MapPin className="w-4 h-4" />
          <span>{location}</span>
        </div>
      </div>
    </div>
  );
}

export default CameraCard;