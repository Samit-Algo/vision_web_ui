// Timeline Chart Component - Shows activity timeline with playback controls
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  SkipBack, 
  SkipForward, 
  Play, 
  Pause, 
  FastForward, 
  Rewind,
  Calendar,
  Clock,
  Search
} from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import type { AgentResponse } from '../types/agentTypes';

interface TimelineEvent {
  id: string;
  startTime: number; // minutes from start of day
  endTime: number; // minutes from start of day
  agentId: string;
  agentName: string;
  label: string;
  color: string;
}

interface TimelineChartProps {
  theme: 'dark' | 'light';
  cameraId: string;
  agents: AgentResponse[];
  currentTime?: number; // minutes from start of day
  onTimeChange?: (time: number) => void;
}

// Color palette for different agents
const AGENT_COLORS = [
  '#7dd3fc', // Light blue
  '#d97706', // Brownish-orange
  '#a855f7', // Purple
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#8b5cf6', // Violet
];

function TimelineChart({ theme, cameraId, agents, currentTime, onTimeChange }: TimelineChartProps) {
  const { events } = useNotifications();

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [localCurrentTime, setLocalCurrentTime] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverEvent, setHoverEvent] = useState<TimelineEvent | null>(null);
  const [realTime, setRealTime] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });
  const timelineRef = useRef<HTMLDivElement>(null);

  // Time markers for the day (4 AM to 8 PM)
  const dayStart = 240; // 4 AM in minutes
  const dayEnd = 1200; // 8 PM in minutes
  const dayDuration = dayEnd - dayStart; // 960 minutes (16 hours)

  // Real-time current time update - always updates regardless of play/pause
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const minutes = now.getHours() * 60 + now.getMinutes();
      setRealTime(minutes);
      
      // Only update localCurrentTime if playing and not dragging
      if (isPlaying && !isDragging) {
        setLocalCurrentTime(minutes);
        if (onTimeChange) onTimeChange(minutes);
      }
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [isPlaying, isDragging, onTimeChange]);

  // Update local time when currentTime prop changes
  useEffect(() => {
    if (!isDragging && currentTime !== undefined) {
      setLocalCurrentTime(currentTime);
    }
  }, [currentTime, isDragging]);

  // Filter events for this camera and convert to timeline format
  const timelineEvents = useMemo(() => {
    const cameraEvents = events.filter(
      event => event.agent.camera_id === cameraId
    );

    return cameraEvents.map((event, index) => {
      const eventDate = new Date(event.event.timestamp);
      const startMinutes = eventDate.getHours() * 60 + eventDate.getMinutes();
      // Events last for 1 minute (can be adjusted)
      const endMinutes = startMinutes + 1;

      // Get agent color based on agent index
      const agentIndex = agents.findIndex(a => a.id === event.agent.agent_id);
      const color = agentIndex >= 0 && agentIndex < AGENT_COLORS.length
        ? AGENT_COLORS[agentIndex % AGENT_COLORS.length]
        : AGENT_COLORS[index % AGENT_COLORS.length];

      return {
        id: event.id,
        startTime: startMinutes,
        endTime: endMinutes,
        agentId: event.agent.agent_id,
        agentName: event.agent.agent_name,
        label: event.event.label,
        color,
      };
    });
  }, [events, cameraId, agents]);

  // Group events by agent for different rows
  const agentRows = useMemo(() => {
    const rows: { [agentId: string]: { agent: AgentResponse; events: TimelineEvent[]; color: string } } = {};

    agents.forEach((agent, index) => {
      const color = AGENT_COLORS[index % AGENT_COLORS.length];
      rows[agent.id] = {
        agent,
        events: timelineEvents.filter(e => e.agentId === agent.id),
        color,
      };
    });

    return rows;
  }, [agents, timelineEvents]);
  
  // Generate hour markers (every hour from 4 AM to 8 PM)
  const hourMarkers = useMemo(() => {
    const markers: number[] = [];
    for (let hour = 4; hour <= 20; hour++) {
      markers.push(hour * 60);
    }
    return markers;
  }, []);

  // Generate minute markers (every 30 minutes)
  const minuteMarkers = useMemo(() => {
    const markers: number[] = [];
    for (let hour = 4; hour <= 20; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const totalMinutes = hour * 60 + min;
        if (totalMinutes >= dayStart && totalMinutes <= dayEnd) {
          markers.push(totalMinutes);
        }
      }
    }
    return markers;
  }, [dayStart, dayEnd]);

  // Convert minutes to time string
  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${mins.toString().padStart(2, '0')}:00 ${period}`;
  };


  // Calculate position percentage for timeline
  const getPositionPercent = (minutes: number): number => {
    return ((minutes - dayStart) / dayDuration) * 100;
  };

  // Convert mouse position to time in minutes
  const getTimeFromPosition = (clientX: number): number => {
    if (!timelineRef.current) return localCurrentTime;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const minutes = dayStart + (percent / 100) * dayDuration;
    return Math.max(dayStart, Math.min(dayEnd, Math.round(minutes)));
  };

  // Format time for display
  const formatTimeDisplay = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
  };

  // Format date for display
  const formatDateDisplay = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Handle mouse down on timeline
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const time = getTimeFromPosition(e.clientX);
    setLocalCurrentTime(time);
    if (onTimeChange) onTimeChange(time);
  };

  // Handle mouse move (for dragging and hovering)
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const time = getTimeFromPosition(e.clientX);
      setLocalCurrentTime(time);
      if (onTimeChange) onTimeChange(time);
    } else {
      const time = getTimeFromPosition(e.clientX);
      setHoverTime(time);
      
      // Check if hovering over an event
      const hoveredEvent = timelineEvents.find(event => {
        const eventStart = getPositionPercent(event.startTime);
        const eventEnd = getPositionPercent(event.endTime);
        const rect = timelineRef.current?.getBoundingClientRect();
        if (!rect) return false;
        const x = e.clientX - rect.left;
        const percent = (x / rect.width) * 100;
        return percent >= eventStart && percent <= eventEnd;
      });
      setHoverEvent(hoveredEvent || null);
    }
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    setIsDragging(false);
    setHoverTime(null);
    setHoverEvent(null);
  };

  // Handle mouse up
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle click on timeline
  const handleClick = (e: React.MouseEvent) => {
    const time = getTimeFromPosition(e.clientX);
    setLocalCurrentTime(time);
    if (onTimeChange) onTimeChange(time);
  };


  // Global mouse handlers for dragging
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging && timelineRef.current) {
        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
        const minutes = dayStart + (percent / 100) * dayDuration;
        const time = Math.max(dayStart, Math.min(dayEnd, Math.round(minutes)));
        setLocalCurrentTime(time);
        if (onTimeChange) onTimeChange(time);
      }
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, onTimeChange, dayStart, dayDuration]);

  // Handle playback controls
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleStepBack = () => {
    const newTime = Math.max(dayStart, localCurrentTime - 1);
    setLocalCurrentTime(newTime);
    if (onTimeChange) onTimeChange(newTime);
  };

  const handleStepForward = () => {
    const newTime = Math.min(dayEnd, localCurrentTime + 1);
    setLocalCurrentTime(newTime);
    if (onTimeChange) onTimeChange(newTime);
  };

  const handleSkipToStart = () => {
    setLocalCurrentTime(dayStart);
    if (onTimeChange) onTimeChange(dayStart);
  };

  const handleSkipToEnd = () => {
    setLocalCurrentTime(dayEnd);
    if (onTimeChange) onTimeChange(dayEnd);
  };

  const handleSpeedChange = () => {
    const speeds = [1, 2, 4, 8, 16];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIndex]);
  };


  const currentPosition = getPositionPercent(localCurrentTime);
  const realTimePosition = getPositionPercent(realTime);
  const hoverPosition = hoverTime !== null ? getPositionPercent(hoverTime) : null;
  const hasSelectedTime = localCurrentTime !== realTime;

  return (
    <div
      className={`${
        theme === 'dark'
          ? 'bg-[#1a2332]'
          : 'bg-white'
      }`}
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      {/* Controls Bar */}
      <div className="p-2 border-b border-gray-700 flex items-center justify-between gap-2">
        {/* Left - Search and Add */}
        <div className="flex items-center gap-1">
          <button
            className={`p-1 rounded ${
              theme === 'dark'
                ? 'hover:bg-gray-700 text-gray-400'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="Search"
          >
            <Search className="w-3 h-3" />
          </button>
        </div>

        {/* Center - Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSkipToStart}
            className={`p-1 rounded ${
              theme === 'dark'
                ? 'hover:bg-gray-700 text-gray-400'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="Skip to start"
          >
            <Rewind className="w-3 h-3" />
          </button>
          <button
            onClick={handleStepBack}
            className={`p-1 rounded ${
              theme === 'dark'
                ? 'hover:bg-gray-700 text-gray-400'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="Step back"
          >
            <SkipBack className="w-3 h-3" />
          </button>
          <button
            onClick={handlePlayPause}
            className={`p-1 rounded ${
              theme === 'dark'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-3 h-3" />
            ) : (
              <Play className="w-3 h-3" />
            )}
          </button>
          <button
            onClick={handleStepForward}
            className={`p-1 rounded ${
              theme === 'dark'
                ? 'hover:bg-gray-700 text-gray-400'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="Step forward"
          >
            <SkipForward className="w-3 h-3" />
          </button>
          <button
            onClick={handleSkipToEnd}
            className={`p-1 rounded ${
              theme === 'dark'
                ? 'hover:bg-gray-700 text-gray-400'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="Skip to end"
          >
            <FastForward className="w-3 h-3" />
          </button>
          <button
            onClick={handleSpeedChange}
            className={`px-2 py-0.5 rounded text-xs ${
              theme === 'dark'
                ? 'hover:bg-gray-700 text-gray-300'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
            title="Change playback speed"
          >
            {playbackSpeed}x
          </button>
        </div>

        {/* Right - Date and Time Selectors */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Calendar className={`w-3 h-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
            <span className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              {formatDateDisplay(selectedDate)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className={`w-3 h-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
            <span className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              {formatTimeDisplay(localCurrentTime)}
            </span>
          </div>
        </div>
      </div>

      {/* Timeline Chart Area */}
      <div className="px-2 pt-2 pb-0 flex-1 flex flex-col" style={{ minHeight: 0 }}>
        {/* Agent Timeline Rows */}
        <div className="space-y-1">
          {agents.map((agent) => {
            const agentRow = agentRows[agent.id];
            if (!agentRow) return null;

            return (
              <div key={agent.id} className="relative">
                {/* Agent Label */}
                <div className={`text-xs mb-0.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {agent.name}
                </div>

                {/* Timeline Row for this Agent - Small thick line */}
                <div 
                  className={`relative ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}
                  style={{ height: '20px', borderRadius: '2px' }}
                >
                  <div 
                    ref={agent.id === agents[0]?.id ? timelineRef : undefined}
                    className="relative cursor-pointer select-none h-full"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    onMouseUp={handleMouseUp}
                    onClick={handleClick}
                  >
                    {/* Timeline Bar Background - Small thick line */}
                    <div 
                      className={`absolute top-0 left-0 right-0 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`}
                      style={{ height: '4px', top: '8px', borderRadius: '2px' }}
                    />

                    {/* Hour Markers - Smaller */}
                    {hourMarkers.map((marker) => {
                      const position = getPositionPercent(marker);
                      return (
                        <div
                          key={`hour-${agent.id}-${marker}`}
                          className={`absolute ${theme === 'dark' ? 'bg-gray-500' : 'bg-gray-400'}`}
                          style={{
                            left: `${position}%`,
                            top: '6px',
                            width: '1px',
                            height: '4px',
                            zIndex: 2,
                          }}
                        />
                      );
                    })}

                    {/* Event Segments for this Agent - Small thick lines */}
                    {agentRow.events.map((event) => {
                      const left = getPositionPercent(event.startTime);
                      const width = Math.max(0.5, getPositionPercent(event.endTime) - left); // Minimum 0.5% width
                      const isHovered = hoverEvent?.id === event.id;
                      
                      return (
                        <div
                          key={event.id}
                          className="absolute cursor-pointer transition-all"
                          style={{
                            left: `${left}%`,
                            top: '5px',
                            width: `${width}%`,
                            height: '6px',
                            backgroundColor: event.color,
                            opacity: isHovered ? 1 : 0.8,
                            zIndex: 3,
                            borderRadius: '2px',
                          }}
                          onMouseEnter={() => setHoverEvent(event)}
                          onMouseLeave={() => setHoverEvent(null)}
                          title={`${event.label} - ${agent.name}`}
                        >
                          {/* Event Tooltip on Hover */}
                          {isHovered && (
                            <div 
                              className={`absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 rounded text-xs whitespace-nowrap z-20 ${
                                theme === 'dark' 
                                  ? 'bg-gray-900 text-white border border-gray-700 shadow-lg' 
                                  : 'bg-white text-gray-900 border border-gray-300 shadow-lg'
                              }`}
                            >
                              <div className="font-medium">{event.label}</div>
                              <div className="text-xs opacity-75">{agent.name}</div>
                              <div className="text-xs opacity-75">{formatTimeDisplay(event.startTime)}</div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Real-Time Indicator - Always shows actual current time */}
                    {agent.id === agents[0]?.id && (
                      <div
                        className="absolute transition-all duration-100 pointer-events-none"
                        style={{ 
                          left: `${realTimePosition}%`,
                          top: '0px',
                          height: '20px',
                          width: '2px',
                          backgroundColor: '#14b8a6', // Teal
                          zIndex: 8,
                        }}
                      >
                        <div 
                          className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-teal-500 rounded-full shadow-lg"
                          style={{ zIndex: 9 }}
                        />
                      </div>
                    )}

                    {/* Selected Time Indicator - Shows when user has changed time */}
                    {agent.id === agents[0]?.id && hasSelectedTime && (
                      <div
                        className="absolute transition-all duration-100 pointer-events-none"
                        style={{ 
                          left: `${currentPosition}%`,
                          top: '0px',
                          height: '20px',
                          width: '2px',
                          backgroundColor: '#3b82f6', // Blue
                          zIndex: 9,
                        }}
                      >
                        <div 
                          className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full shadow-lg"
                          style={{ zIndex: 10 }}
                        />
                      </div>
                    )}

                    {/* Hover Indicator - Shows where mouse is hovering */}
                    {agent.id === agents[0]?.id && hoverPosition !== null && !isDragging && (
                      <div
                        className="absolute transition-all duration-100 pointer-events-none"
                        style={{ 
                          left: `${hoverPosition}%`,
                          top: '0px',
                          height: '20px',
                          width: '2px',
                          backgroundColor: '#f59e0b', // Amber
                          zIndex: 11,
                        }}
                      >
                        <div 
                          className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-amber-500 rounded-full shadow-lg"
                          style={{ zIndex: 12 }}
                        />
                        {/* Time tooltip at hover position */}
                        {hoverTime !== null && (
                          <div 
                            className={`absolute -top-6 left-1/2 transform -translate-x-1/2 px-2 py-1 rounded text-xs whitespace-nowrap z-20 ${
                              theme === 'dark' 
                                ? 'bg-gray-900 text-white border border-gray-700 shadow-lg' 
                                : 'bg-white text-gray-900 border border-gray-300 shadow-lg'
                            }`}
                            style={{ pointerEvents: 'none' }}
                          >
                            {formatTimeDisplay(hoverTime)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Time Labels - Below all agent rows */}
        <div className="relative mt-1 flex-shrink-0" style={{ height: '20px' }}>
          {hourMarkers.map((marker) => {
            const position = getPositionPercent(marker);
            const hours = Math.floor(marker / 60);
            const period = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
            
            return (
              <div
                key={`label-${marker}`}
                className="absolute"
                style={{
                  left: `${position}%`,
                  transform: 'translateX(-50%)',
                  bottom: '0px',
                }}
              >
                <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  {displayHours}
                </span>
                <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                  {' '}{period}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default TimelineChart;

