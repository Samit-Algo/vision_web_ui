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

interface TimelineEvent {
  id: string;
  startTime: number; // minutes from start of day
  endTime: number; // minutes from start of day
  type: string;
  color: string;
}

interface TimelineChartProps {
  theme: 'dark' | 'light';
  currentTime?: number; // minutes from start of day
  onTimeChange?: (time: number) => void;
}

function TimelineChart({ theme, currentTime = 540, onTimeChange }: TimelineChartProps) {
  // Dummy data - activity events throughout the day
  // Colors match the image: light blue for person, brownish-orange for vehicle, purple for motion
  const [events] = useState<TimelineEvent[]>([
    // Early morning events (2 AM - 4 AM)
    { id: '1', startTime: 120, endTime: 140, type: 'person', color: '#7dd3fc' }, // Light blue
    { id: '2', startTime: 150, endTime: 170, type: 'person', color: '#7dd3fc' },
    { id: '3', startTime: 180, endTime: 200, type: 'motion', color: '#a855f7' }, // Purple
    
    // Morning events (4 AM - 8 AM)
    { id: '4', startTime: 300, endTime: 320, type: 'person', color: '#7dd3fc' },
    { id: '5', startTime: 360, endTime: 420, type: 'vehicle', color: '#d97706' }, // Brownish-orange
    { id: '6', startTime: 360, endTime: 380, type: 'motion', color: '#a855f7' },
    { id: '7', startTime: 480, endTime: 500, type: 'person', color: '#7dd3fc' },
    
    // Mid-morning events (8 AM - 12 PM)
    { id: '8', startTime: 540, endTime: 560, type: 'person', color: '#7dd3fc' },
    { id: '9', startTime: 540, endTime: 550, type: 'vehicle', color: '#d97706' },
    { id: '10', startTime: 600, endTime: 620, type: 'person', color: '#7dd3fc' },
    { id: '11', startTime: 630, endTime: 650, type: 'vehicle', color: '#d97706' },
    { id: '12', startTime: 660, endTime: 680, type: 'person', color: '#7dd3fc' },
    { id: '13', startTime: 660, endTime: 680, type: 'motion', color: '#a855f7' },
    { id: '14', startTime: 690, endTime: 710, type: 'vehicle', color: '#d97706' },
    
    // Afternoon events (12 PM - 4 PM)
    { id: '15', startTime: 720, endTime: 740, type: 'person', color: '#7dd3fc' },
    { id: '16', startTime: 750, endTime: 770, type: 'vehicle', color: '#d97706' },
    { id: '17', startTime: 780, endTime: 800, type: 'motion', color: '#a855f7' },
    { id: '18', startTime: 810, endTime: 830, type: 'person', color: '#7dd3fc' },
    { id: '19', startTime: 840, endTime: 860, type: 'vehicle', color: '#d97706' },
  ]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('9:04:49 AM');
  const [localCurrentTime, setLocalCurrentTime] = useState(currentTime);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Time markers for the day (4 AM to 8 PM)
  const dayStart = 240; // 4 AM in minutes
  const dayEnd = 1200; // 8 PM in minutes
  const dayDuration = dayEnd - dayStart; // 960 minutes (16 hours)
  
  // Generate hour markers (every hour from 4 AM to 8 PM)
  const hourMarkers = useMemo(() => {
    const markers = [];
    for (let hour = 4; hour <= 20; hour++) {
      markers.push(hour * 60);
    }
    return markers;
  }, []);
  
  // Generate minute markers (every 30 minutes)
  const minuteMarkers = useMemo(() => {
    const markers = [];
    for (let hour = 4; hour <= 20; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const totalMinutes = hour * 60 + min;
        if (totalMinutes >= dayStart && totalMinutes <= dayEnd) {
          markers.push(totalMinutes);
        }
      }
    }
    return markers;
  }, []);

  // Convert minutes to time string
  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${mins.toString().padStart(2, '0')}:00 ${period}`;
  };

  // Convert time string to minutes
  const timeToMinutes = (timeStr: string): number => {
    // Simple parser for "9:04:49 AM" format
    const match = timeStr.match(/(\d+):(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 540; // Default to 9 AM
    
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[4].toUpperCase();
    
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    return hours * 60 + minutes;
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
    }
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    setIsDragging(false);
    setHoverTime(null);
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

  // Update local time when currentTime prop changes
  useEffect(() => {
    if (!isDragging) {
      setLocalCurrentTime(currentTime);
      setSelectedTime(formatTimeDisplay(currentTime));
    }
  }, [currentTime, isDragging]);

  // Update selectedTime when localCurrentTime changes (from dragging)
  useEffect(() => {
    setSelectedTime(formatTimeDisplay(localCurrentTime));
  }, [localCurrentTime]);

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

  // Group events by type for different rows/levels
  const eventRows = useMemo(() => {
    const rows: { [key: string]: TimelineEvent[] } = {
      top: [],
      middle: [],
      bottom: [],
    };

    events.forEach(event => {
      if (event.type === 'person') {
        rows.top.push(event);
      } else if (event.type === 'vehicle') {
        rows.middle.push(event);
      } else {
        rows.bottom.push(event);
      }
    });

    return rows;
  }, [events]);

  const currentPosition = getPositionPercent(localCurrentTime);

  return (
    <div
      className={`rounded-lg ${
        theme === 'dark'
          ? 'bg-[#1a2332] border border-gray-800'
          : 'bg-white border border-gray-200'
      }`}
    >
      {/* Controls Bar */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between gap-4">
        {/* Left - Search and Add */}
        <div className="flex items-center gap-2">
          <button
            className={`p-2 rounded ${
              theme === 'dark'
                ? 'hover:bg-gray-700 text-gray-400'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            className={`p-2 rounded ${
              theme === 'dark'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <span className="text-xs">+</span>
          </button>
        </div>

        {/* Center - Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSkipToStart}
            className={`p-2 rounded ${
              theme === 'dark'
                ? 'hover:bg-gray-700 text-gray-400'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="Skip to start"
          >
            <Rewind className="w-4 h-4" />
          </button>
          <button
            onClick={handleStepBack}
            className={`p-2 rounded ${
              theme === 'dark'
                ? 'hover:bg-gray-700 text-gray-400'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="Step back"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={handlePlayPause}
            className={`p-2 rounded ${
              theme === 'dark'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={handleStepForward}
            className={`p-2 rounded ${
              theme === 'dark'
                ? 'hover:bg-gray-700 text-gray-400'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="Step forward"
          >
            <SkipForward className="w-4 h-4" />
          </button>
          <button
            onClick={handleSkipToEnd}
            className={`p-2 rounded ${
              theme === 'dark'
                ? 'hover:bg-gray-700 text-gray-400'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="Skip to end"
          >
            <FastForward className="w-4 h-4" />
          </button>
          <button
            onClick={handleSpeedChange}
            className={`px-3 py-1 rounded text-xs ${
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
            <Calendar className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
            <select
              value={selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              onChange={(e) => {
                // In a real implementation, this would parse and set the date
                console.log('Date changed:', e.target.value);
              }}
              className={`text-xs bg-transparent border-none outline-none ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              <option>Dec 12th</option>
            </select>
          </div>
          <div className="flex items-center gap-1">
            <Clock className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
            <span className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              {formatTimeDisplay(localCurrentTime)}
            </span>
          </div>
        </div>
      </div>

      {/* Timeline Chart Area */}
      <div className="p-4">
        {/* Time Display - Shows current time and date */}
        <div className={`mb-2 text-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          <div className="text-sm font-medium">
            {formatDateDisplay(selectedDate)} - {formatTimeDisplay(localCurrentTime)}
          </div>
          {hoverTime && !isDragging && (
            <div className="text-xs text-gray-500 mt-1">
              Hover: {formatTimeDisplay(hoverTime)}
            </div>
          )}
        </div>

        <div 
          className={`relative ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}
          style={{ height: '120px', borderRadius: '4px' }}
        >
          {/* Main Timeline Bar - Draggable */}
          <div 
            ref={timelineRef}
            className="relative cursor-pointer select-none"
            style={{ height: '80px', paddingTop: '20px', paddingBottom: '40px' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onClick={handleClick}
          >
            {/* Timeline Bar Background */}
            <div 
              className={`absolute top-8 left-0 right-0 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`}
              style={{ height: '24px', borderRadius: '2px' }}
            />

            {/* Hour Markers (tall vertical lines) */}
            {hourMarkers.map((marker) => {
              const position = getPositionPercent(marker);
              return (
                <div
                  key={`hour-${marker}`}
                  className={`absolute ${theme === 'dark' ? 'bg-gray-500' : 'bg-gray-400'}`}
                  style={{
                    left: `${position}%`,
                    top: '8px',
                    width: '2px',
                    height: '24px',
                    zIndex: 2,
                  }}
                />
              );
            })}

            {/* Minute Markers (short vertical lines) */}
            {minuteMarkers.map((marker) => {
              const position = getPositionPercent(marker);
              // Skip if it's an hour marker (already drawn)
              if (marker % 60 === 0) return null;
              return (
                <div
                  key={`min-${marker}`}
                  className={`absolute ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-400'}`}
                  style={{
                    left: `${position}%`,
                    top: '16px',
                    width: '1px',
                    height: '8px',
                    zIndex: 2,
                  }}
                />
              );
            })}

            {/* Event Segments - Overlaid on timeline bar */}
            {events.map((event) => {
              const left = getPositionPercent(event.startTime);
              const width = getPositionPercent(event.endTime) - left;
              return (
                <div
                  key={event.id}
                  className="absolute rounded"
                  style={{
                    left: `${left}%`,
                    top: '10px',
                    width: `${width}%`,
                    height: '20px',
                    backgroundColor: event.color,
                    opacity: 0.8,
                    zIndex: 3,
                    border: event.type === 'person' || event.type === 'motion' 
                      ? `1px dashed ${event.color}` 
                      : 'none',
                  }}
                  title={`${event.type} - ${minutesToTime(event.startTime)} to ${minutesToTime(event.endTime)}`}
                />
              );
            })}

            {/* Current Time Indicator - Vertical line */}
            <div
              className="absolute transition-all duration-100"
              style={{ 
                left: `${currentPosition}%`,
                top: '0px',
                height: '48px',
                width: '2px',
                backgroundColor: '#14b8a6', // Teal
                zIndex: 10,
                cursor: isDragging ? 'grabbing' : 'grab',
              }}
            >
              <div 
                className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-teal-500 rounded-full shadow-lg"
                style={{ zIndex: 11 }}
              />
              {/* Time tooltip on hover/drag */}
              {(isDragging || hoverTime) && (
                <div 
                  className={`absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 rounded text-xs whitespace-nowrap ${
                    theme === 'dark' 
                      ? 'bg-gray-900 text-white border border-gray-700' 
                      : 'bg-white text-gray-900 border border-gray-300 shadow-lg'
                  }`}
                  style={{ zIndex: 12 }}
                >
                  {formatTimeDisplay(localCurrentTime)}
                </div>
              )}
            </div>
          </div>

          {/* Time Labels - Below the timeline bar */}
          <div className="absolute bottom-0 left-0 right-0" style={{ height: '40px' }}>
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
    </div>
  );
}

export default TimelineChart;

