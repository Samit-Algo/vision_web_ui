// Dashboard Component - Main dashboard layout with sidebar and topbar
import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import DashboardContent from './DashboardContent';
import CameraDetailPage from './CameraDetailPage';
import EventDetailsPage from './EventDetailsPage';
import RightChatPane from './RightChatPane';
import { MessageSquare } from 'lucide-react';
import { listCameras } from '../services/camera/cameraService';
import type { UserResponse } from '../types/authTypes';
import type { CameraResponse } from '../types/cameraTypes';

function Dashboard({ onLogout, currentUser }) {
  // State to track if sidebar is collapsed or expanded
  // false = expanded (show icons + text), true = collapsed (show only icons)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  
  // State to track theme - 'dark' or 'light'
  const [theme, setTheme] = useState('dark');
  
  // State to track text direction - 'ltr' or 'rtl'
  const [direction, setDirection] = useState('ltr');

  // State to track selected camera (null means show dashboard, camera object means show detail page)
  const [selectedCamera, setSelectedCamera] = useState<CameraResponse | null>(null);

  // State to track selected event (null means show dashboard/camera, eventId means show event details)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Load camera/event from URL on mount and when URL changes
  useEffect(() => {
    const loadFromURL = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const cameraId = urlParams.get('camera');
      const eventId = urlParams.get('event');
      
      // Handle event navigation
      if (eventId) {
        setSelectedEventId(eventId);
        setSelectedCamera(null); // Clear camera when viewing event
        return;
      }
      
      // Handle camera navigation
      if (cameraId) {
        // Fetch cameras and find the one matching the ID
        const result = await listCameras();
        if (result.success && result.cameras) {
          const camera = result.cameras.find(c => c.id === cameraId);
          if (camera) {
            // Add location property (derived from device_id) to match expected format
            const cameraWithLocation = {
              ...camera,
              location: camera.device_id || 'Unknown Location',
            } as CameraResponse & { location: string };
            setSelectedCamera(cameraWithLocation);
            setSelectedEventId(null); // Clear event when viewing camera
          } else {
            // Camera not found, remove from URL
            updateURL(null, null);
          }
        }
      } else {
        // No camera or event in URL, ensure state is cleared
        setSelectedCamera(null);
        setSelectedEventId(null);
      }
    };

    loadFromURL();
    
    // Listen for browser back/forward navigation
    const handlePopState = () => {
      loadFromURL();
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Helper function to update URL without page reload
  const updateURL = (cameraId: string | null, eventId: string | null = null) => {
    const url = new URL(window.location.href);
    
    // Clear all params first
    url.searchParams.delete('camera');
    url.searchParams.delete('event');
    
    // Set new params
    if (eventId) {
      url.searchParams.set('event', eventId);
    } else if (cameraId) {
      url.searchParams.set('camera', cameraId);
    }
    
    window.history.pushState({}, '', url.toString());
  };

  // State to track if right chat pane is open
  const [isRightChatOpen, setIsRightChatOpen] = useState(false);

  // State to track chat pane width and behavior
  const DEFAULT_CHAT_WIDTH = 400;
  const [chatPaneWidth, setChatPaneWidth] = useState(DEFAULT_CHAT_WIDTH);

  // Function to toggle sidebar state
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Function to toggle theme between dark and light
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Function to change text direction
  const changeDirection = (dir) => {
    setDirection(dir);
  };

  // Function to handle camera card click
  const handleCameraClick = (camera: CameraResponse | (CameraResponse & { location?: string })) => {
    // Ensure location is set (it might come from DashboardContent with location already added)
    const cameraWithLocation = {
      ...camera,
      location: (camera as any).location || camera.device_id || 'Unknown Location',
    } as CameraResponse & { location: string };
    
    setSelectedCamera(cameraWithLocation);
    setSelectedEventId(null); // Clear event when viewing camera
    updateURL(camera.id, null); // Update URL with camera ID
  };

  // Function to handle event click from notifications
  const handleEventClick = (eventId: string) => {
    setSelectedEventId(eventId);
    setSelectedCamera(null); // Clear camera when viewing event
    updateURL(null, eventId); // Update URL with event ID
  };

  // Function to go back to dashboard
  const handleBackToDashboard = () => {
    setSelectedCamera(null);
    setSelectedEventId(null);
    updateURL(null, null); // Clear camera and event from URL
  };

  // Function to toggle right chat pane
  const toggleRightChatPane = () => {
    setIsRightChatOpen(!isRightChatOpen);
  };

  // Function to handle AI commands
  const handleCommand = (command) => {
    switch (command.type) {
      case 'theme':
        setTheme(command.value);
        break;
      case 'direction':
        setDirection(command.value);
        break;
      case 'navigate':
        if (command.value === 'dashboard') {
          setSelectedCamera(null);
          setSelectedEventId(null);
          updateURL(null, null);
        }
        break;
      case 'sidebar':
        if (command.value === 'collapse') {
          setIsSidebarCollapsed(true);
        } else if (command.value === 'expand') {
          setIsSidebarCollapsed(false);
        }
        break;
      case 'selectCamera':
        // Mock camera data based on identifier
        const cameraData = {
          id: command.value,
          name: `Camera ${command.value}`,
          location: 'Selected via AI'
        } as any;
        setSelectedCamera(cameraData);
        break;
      default:
        break;
    }
  };

  // Calculate main content margin and overflow based on chat state
  // When chat is open at default size: resize main content (apply margin)
  // When chat expands beyond default: cap margin and make content scrollable
  const getMainContentStyles = () => {
    const marginProp = direction === 'rtl' ? 'marginLeft' : 'marginRight';
    
    if (!isRightChatOpen) {
      // Chat closed: full width, no scrolling
      return {
        [marginProp]: 0,
        overflowX: 'hidden' as const,
        overflowY: 'hidden' as const
      };
    }
    
    if (chatPaneWidth <= DEFAULT_CHAT_WIDTH) {
      // Chat at default size or smaller: NO margin needed (chat is relative and takes up flex space naturally)
      return {
        [marginProp]: 0,
        overflowX: 'hidden' as const,
        overflowY: 'hidden' as const
      };
    }
    
    // Chat expanded beyond default: CAP margin at default width, enable scrolling
    // The chat becomes fixed/overlay, content width locks at State 2 size, becomes scrollable
    return {
      [marginProp]: DEFAULT_CHAT_WIDTH,
      overflowX: 'auto' as const,
      overflowY: 'hidden' as const
    };
  };

  const mainContentStyles = getMainContentStyles();

  return (
    <div className={`flex flex-col h-screen ${theme === 'dark' ? 'bg-[#0f1729]' : 'bg-gray-100'}`} dir={direction}>
      
      {/* Topbar - Full width at the top */}
      <Topbar 
        onLogout={onLogout} 
        theme={theme} 
        onToggleTheme={toggleTheme}
        direction={direction}
        onChangeDirection={changeDirection}
        currentUser={currentUser}
        onEventClick={handleEventClick}
      />
      
      {/* Content area - Sidebar, Main content, and Right Chat Pane */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Sidebar - Fixed left side navigation */}
        <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} theme={theme} />
        
        {/* Main content area */}
        <main className={`flex-1 ${theme === 'dark' ? 'bg-[#0f1729]' : 'bg-white'}`} style={mainContentStyles}>
          {/* Smooth transition between dashboard, camera detail page, and event detail page */}
          {selectedEventId ? (
            <div className="h-full">
              <EventDetailsPage 
                eventId={selectedEventId} 
                theme={theme} 
                onBack={handleBackToDashboard}
              />
            </div>
          ) : selectedCamera ? (
            <div className="h-full p-6">
              <CameraDetailPage 
                camera={selectedCamera} 
                theme={theme} 
                onBack={handleBackToDashboard}
              />
            </div>
          ) : (
            <div className="h-full p-6 overflow-auto">
              <DashboardContent theme={theme} onCameraClick={handleCameraClick} />
            </div>
          )}
        </main>

        {/* Vertical Toggle Button - Only visible when chat is closed */}
        {!isRightChatOpen && (
          <button
            onClick={toggleRightChatPane}
            className={`fixed ${direction === 'rtl' ? 'left-0 rounded-r-lg' : 'right-0 rounded-l-lg'} top-1/2 -translate-y-1/2 z-40 shadow-lg transition-all hover:scale-105 ${
              theme === 'dark'
                ? 'bg-gradient-to-br from-emerald-400 to-cyan-500 hover:from-emerald-500 hover:to-cyan-600'
                : 'bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
            }`}
            style={{ 
              writingMode: 'vertical-rl',
              padding: '16px 8px',
            }}
          >
            <div className="flex items-center gap-2 text-white">
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm">AI Assistant</span>
            </div>
          </button>
        )}

        {/* Right Chat Pane */}
        <RightChatPane 
          theme={theme}
          direction={direction}
          onCommand={handleCommand}
          isOpen={isRightChatOpen}
          onToggle={toggleRightChatPane}
          onWidthChange={setChatPaneWidth}
        />
      </div>
    </div>
  );
}

export default Dashboard;