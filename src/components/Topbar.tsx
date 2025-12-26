// Topbar Component - Top navigation bar
import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Settings, LogOut, User, Eye, Sun, Moon, Mail, Phone, MapPin, CheckCircle2, Circle, X } from 'lucide-react';
import type { UserResponse } from '../types/authTypes';
import { useNotifications } from '../contexts/NotificationContext';

interface TopbarProps {
  onLogout: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  direction: 'ltr' | 'rtl';
  onChangeDirection: (dir: 'ltr' | 'rtl') => void;
  currentUser: UserResponse | null;
  onEventClick?: (eventId: string) => void;
}

function Topbar({ onLogout, theme, onToggleTheme, direction, onChangeDirection, currentUser, onEventClick }: TopbarProps) {
  // State to control settings popup visibility
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // State to control user profile popup visibility
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // State to control notifications popup visibility
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  // Get notifications from context
  const { events, unreadCount, markAsRead, markAllAsRead, isConnected } = useNotifications();
  
  // Reference to the settings button and popup for click outside detection
  const settingsRef = useRef<HTMLDivElement | null>(null);
  
  // Reference to the profile button and popup for click outside detection
  const profileRef = useRef<HTMLDivElement | null>(null);
  
  // Reference to the notifications button and popup for click outside detection
  const notificationsRef = useRef<HTMLDivElement | null>(null);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    // Add event listener when popup is open
    if (isSettingsOpen || isProfileOpen || isNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Cleanup event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSettingsOpen, isProfileOpen, isNotificationsOpen]);

  // Handle event click
  const handleEventClick = (eventId: string) => {
    markAsRead(eventId);
    setIsNotificationsOpen(false);
    if (onEventClick) {
      onEventClick(eventId);
    }
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 60) return 'Just now';
      if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Just now';
    }
  };

  return (
    <div className={`h-16 ${theme === 'dark' ? 'bg-[#1a2332]' : 'bg-white'} border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'} flex items-center justify-between px-6`}>
      
      {/* Left side - Logo */}
      <div className="flex items-center gap-3">
        {/* Eye icon with blue background */}
        <div className="bg-[#3366ff] rounded-lg w-10 h-10 flex items-center justify-center flex-shrink-0">
          <Eye className="w-6 h-6 text-white" />
        </div>
        {/* Brand name */}
        <span className={`text-xl ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>AI ORA</span>
      </div>

      {/* Center - Search bar */}
      <div className="flex-1 flex justify-center px-8">
        <div className="relative w-full max-w-md">
          {/* Search icon */}
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
          
          {/* Search input */}
          <input
            type="text"
            placeholder="Search cameras, agents, alerts..."
            className={`w-full ${theme === 'dark' ? 'bg-[#0f1729] border-gray-700 text-white placeholder-gray-500' : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-400'} border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-blue-500 transition-colors`}
          />
        </div>
      </div>

      {/* Right side - Action buttons */}
      <div className="flex items-center gap-4">
        
        {/* Notifications button with dropdown */}
        <div className="relative" ref={notificationsRef}>
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={`relative p-2 ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
            title="Notifications"
          >
          <Bell className="w-5 h-5" />
            {/* Notification badge - only show if there are unread notifications */}
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
            {/* Connection indicator */}
            {!isConnected && (
              <span className="absolute bottom-0 right-0 w-2 h-2 bg-yellow-500 rounded-full border border-white"></span>
            )}
        </button>

          {/* Notifications Dropdown */}
          {isNotificationsOpen && (
            <div className={`absolute ${direction === 'rtl' ? 'left-0' : 'right-0'} mt-2 w-96 max-h-[600px] ${theme === 'dark' ? 'bg-[#1a2332] border-gray-700' : 'bg-white border-gray-200'} border rounded-lg shadow-lg z-50 flex flex-col`}>
              {/* Header */}
              <div className={`px-4 py-3 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <h3 className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-semibold text-sm`}>
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className={`text-xs ${theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} transition-colors`}
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setIsNotificationsOpen(false)}
                    className={`p-1 ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="overflow-y-auto max-h-[500px]">
                {events.length === 0 ? (
                  <div className={`px-4 py-8 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No notifications</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {events.map((event) => (
                      <button
                        key={event.id}
                        onClick={() => handleEventClick(event.id)}
                        className={`w-full text-left px-4 py-3 hover:${theme === 'dark' ? 'bg-[#0f1729]' : 'bg-gray-50'} transition-colors ${
                          !event.read ? (theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-50') : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 mt-1 ${event.read ? 'opacity-50' : ''}`}>
                            {event.read ? (
                              <CheckCircle2 className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                            ) : (
                              <Circle className="w-4 h-4 text-blue-500 fill-blue-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`font-medium text-sm mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              {event.event.label}
                            </div>
                            <div className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                              {event.agent.agent_name} • {event.agent.camera_id}
                            </div>
                            <div className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                              {formatTime(event.event.timestamp)}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dark/Light Mode Toggle button */}
        <button 
          onClick={onToggleTheme}
          className={`p-2 ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Settings button with popup */}
        <div className="relative" ref={settingsRef}>
          <button 
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`p-2 ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Settings Popup */}
          {isSettingsOpen && (
            <div className={`absolute ${direction === 'rtl' ? 'left-0' : 'right-0'} mt-2 w-48 ${theme === 'dark' ? 'bg-[#1a2332] border-gray-700' : 'bg-white border-gray-200'} border rounded-lg shadow-lg py-2 z-50`}>
              <div className={`px-4 py-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-xs uppercase`}>
                Text Direction
              </div>
              
              {/* LTR Option */}
              <button
                onClick={() => {
                  onChangeDirection('ltr');
                  setIsSettingsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 ${theme === 'dark' ? 'text-white hover:bg-[#0f1729]' : 'text-gray-900 hover:bg-gray-100'} transition-colors ${direction === 'ltr' ? 'bg-blue-500/20' : ''}`}
              >
                <span className="flex items-center justify-between">
                  LTR (Left-to-Right)
                  {direction === 'ltr' && <span className="text-blue-500">✓</span>}
                </span>
              </button>

              {/* RTL Option */}
              <button
                onClick={() => {
                  onChangeDirection('rtl');
                  setIsSettingsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 ${theme === 'dark' ? 'text-white hover:bg-[#0f1729]' : 'text-gray-900 hover:bg-gray-100'} transition-colors ${direction === 'rtl' ? 'bg-blue-500/20' : ''}`}
              >
                <span className="flex items-center justify-between">
                  RTL (Right-to-Left)
                  {direction === 'rtl' && <span className="text-blue-500">✓</span>}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Divider line */}
        <div className={`h-6 w-px ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`}></div>

        {/* User profile button */}
        <div className="relative" ref={profileRef}>
          <button className={`flex items-center gap-2 ${theme === 'dark' ? 'hover:bg-[#0f1729]' : 'hover:bg-gray-100'} rounded-lg px-3 py-2 transition-colors`} onClick={() => setIsProfileOpen(!isProfileOpen)}>
            <div className="w-8 h-8 bg-[#3366ff] rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <span className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {currentUser?.full_name || 'User'}
            </span>
          </button>

          {/* User Profile Popup */}
          {isProfileOpen && (
            <div className={`absolute ${direction === 'rtl' ? 'left-0' : 'right-0'} mt-2 w-64 ${theme === 'dark' ? 'bg-[#1a2332] border-gray-700' : 'bg-white border-gray-200'} border rounded-lg shadow-lg py-2 z-50`}>
              <div className={`px-4 py-3 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-semibold text-sm mb-1`}>
                  {currentUser?.full_name || 'User'}
                </div>
                <div className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-xs`}>
                  {currentUser?.email || 'No email'}
                </div>
              </div>
              
              <div className={`px-4 py-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-xs uppercase`}>
                Contact Information
              </div>
              
              {/* Email Display */}
              <div className={`px-4 py-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                <div className="flex items-center gap-2">
                  <Mail className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                  <span className="text-sm">{currentUser?.email || 'No email'}</span>
                </div>
              </div>

              {/* Phone Display */}
              {currentUser?.phone && (
                <div className={`px-4 py-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  <div className="flex items-center gap-2">
                    <Phone className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span className="text-sm">{currentUser.phone}</span>
                  </div>
                </div>
              )}

              {/* Address Display */}
              {currentUser?.address && (
                <div className={`px-4 py-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  <div className="flex items-center gap-2">
                    <MapPin className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span className="text-sm">{currentUser.address}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Logout button */}
        <button
          onClick={onLogout}
          className={`p-2 ${theme === 'dark' ? 'text-gray-400 hover:text-red-400' : 'text-gray-600 hover:text-red-500'} transition-colors`}
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default Topbar;