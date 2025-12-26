// Event Details Page - Shows detailed information about a specific event
import React from 'react';
import { ArrowLeft, Calendar, Camera, User, MapPin, FileText, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import type { StoredEvent } from '../types/eventTypes';

interface EventDetailsPageProps {
  eventId: string;
  theme: 'dark' | 'light';
  onBack: () => void;
}

function EventDetailsPage({ eventId, theme, onBack }: EventDetailsPageProps) {
  const { events, markAsRead } = useNotifications();
  
  // Find the event by ID
  const event = events.find(e => e.id === eventId);

  // Mark as read when viewing
  React.useEffect(() => {
    if (event && !event.read) {
      markAsRead(eventId);
    }
  }, [event, eventId, markAsRead]);

  // Format timestamp
  const formatDateTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return timestamp;
    }
  };

  if (!event) {
    return (
      <div className={`h-full ${theme === 'dark' ? 'bg-[#0f1729]' : 'bg-white'} p-6`}>
        <div className="max-w-4xl mx-auto">
          <button
            onClick={onBack}
            className={`flex items-center gap-2 mb-6 ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
          
          <div className={`text-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Event not found</p>
            <p className="text-sm mt-2">The event you're looking for doesn't exist or has been removed.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full ${theme === 'dark' ? 'bg-[#0f1729]' : 'bg-white'} p-6 overflow-auto`}>
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={onBack}
          className={`flex items-center gap-2 mb-6 ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </button>

        {/* Event Header */}
        <div className={`${theme === 'dark' ? 'bg-[#1a2332] border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6 mb-6`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {event.event.label}
              </h1>
              <div className={`flex items-center gap-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                <Calendar className="w-4 h-4" />
                <span>{formatDateTime(event.event.timestamp)}</span>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
              event.read 
                ? (theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600')
                : (theme === 'dark' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600')
            }`}>
              {event.read ? 'Read' : 'New'}
            </div>
          </div>
        </div>

        {/* Event Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Agent Information */}
          <div className={`${theme === 'dark' ? 'bg-[#1a2332] border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6`}>
            <div className="flex items-center gap-2 mb-4">
              <User className={`w-5 h-5 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
              <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Agent Information
              </h2>
            </div>
            <div className="space-y-3">
              <div>
                <div className={`text-xs uppercase mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Agent Name
                </div>
                <div className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {event.agent.agent_name}
                </div>
              </div>
              <div>
                <div className={`text-xs uppercase mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Agent ID
                </div>
                <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} font-mono text-sm`}>
                  {event.agent.agent_id}
                </div>
              </div>
            </div>
          </div>

          {/* Camera Information */}
          <div className={`${theme === 'dark' ? 'bg-[#1a2332] border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6`}>
            <div className="flex items-center gap-2 mb-4">
              <Camera className={`w-5 h-5 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
              <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Camera Information
              </h2>
            </div>
            <div className="space-y-3">
              <div>
                <div className={`text-xs uppercase mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Camera ID
                </div>
                <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} font-mono text-sm`}>
                  {event.agent.camera_id}
                </div>
              </div>
              {event.camera?.device_id && (
                <div>
                  <div className={`text-xs uppercase mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    Device ID
                  </div>
                  <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} font-mono text-sm`}>
                    {event.camera.device_id}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Event Metadata */}
        <div className={`${theme === 'dark' ? 'bg-[#1a2332] border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6 mb-6`}>
          <div className="flex items-center gap-2 mb-4">
            <FileText className={`w-5 h-5 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
            <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Event Metadata
            </h2>
          </div>
          <div className="space-y-4">
            {event.metadata.image_path && (
              <div>
                <div className={`text-xs uppercase mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Image Path
                </div>
                <div className={`${theme === 'dark' ? 'bg-[#0f1729] border-gray-700' : 'bg-gray-50 border-gray-200'} border rounded p-3 font-mono text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  {event.metadata.image_path}
                </div>
              </div>
            )}
            {event.metadata.json_path && (
              <div>
                <div className={`text-xs uppercase mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  JSON Data Path
                </div>
                <div className={`${theme === 'dark' ? 'bg-[#0f1729] border-gray-700' : 'bg-gray-50 border-gray-200'} border rounded p-3 font-mono text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  {event.metadata.json_path}
                </div>
              </div>
            )}
            {event.event.event_id && (
              <div>
                <div className={`text-xs uppercase mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Event ID
                </div>
                <div className={`${theme === 'dark' ? 'bg-[#0f1729] border-gray-700' : 'bg-gray-50 border-gray-200'} border rounded p-3 font-mono text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  {event.event.event_id}
                </div>
              </div>
            )}
            {event.event.rule_index !== undefined && (
              <div>
                <div className={`text-xs uppercase mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Rule Index
                </div>
                <div className={`${theme === 'dark' ? 'bg-[#0f1729] border-gray-700' : 'bg-gray-50 border-gray-200'} border rounded p-3 font-mono text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  {event.event.rule_index}
                </div>
              </div>
            )}
            {event.camera?.device_id && (
              <div>
                <div className={`text-xs uppercase mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Device ID
                </div>
                <div className={`${theme === 'dark' ? 'bg-[#0f1729] border-gray-700' : 'bg-gray-50 border-gray-200'} border rounded p-3 font-mono text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  {event.camera.device_id}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Event Image Preview (if available) */}
        {(event.frame?.image_base64 || event.metadata.image_path) && (
          <div className={`${theme === 'dark' ? 'bg-[#1a2332] border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6 mb-6`}>
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className={`w-5 h-5 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
              <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Event Image Frame
              </h2>
            </div>
            {event.frame?.image_base64 ? (
              <div className="space-y-4">
                <div className={`${theme === 'dark' ? 'bg-[#0f1729]' : 'bg-gray-50'} rounded-lg p-4 border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} overflow-hidden`}>
                  <img
                    src={`data:image/${event.frame.format || 'jpeg'};base64,${event.frame.image_base64}`}
                    alt={event.event.label}
                    className="w-full h-auto rounded-lg max-h-[600px] object-contain mx-auto"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const errorDiv = target.nextElementSibling as HTMLElement;
                      if (errorDiv) {
                        errorDiv.style.display = 'block';
                      }
                    }}
                  />
                  <div className={`hidden text-sm text-center py-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    Failed to load image
                  </div>
                </div>
                {event.metadata.image_path && (
                  <div>
                    <div className={`text-xs uppercase mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      Saved Image Path
                    </div>
                    <div className={`${theme === 'dark' ? 'bg-[#0f1729] border-gray-700' : 'bg-gray-50 border-gray-200'} border rounded p-3 font-mono text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {event.metadata.image_path}
                    </div>
                  </div>
                )}
              </div>
            ) : event.metadata.image_path ? (
              <div className={`${theme === 'dark' ? 'bg-[#0f1729]' : 'bg-gray-50'} rounded-lg p-4 border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className={`text-sm text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Image path: {event.metadata.image_path}
                  <br />
                  <span className="text-xs mt-2 block">
                    (Image preview would be displayed here if image URL is accessible)
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Raw Event Data (for debugging) */}
        <details className={`mt-6 ${theme === 'dark' ? 'bg-[#1a2332] border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6`}>
          <summary className={`cursor-pointer font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Raw Event Data
          </summary>
          <pre className={`mt-4 text-xs overflow-auto ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {JSON.stringify(event, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}

export default EventDetailsPage;

