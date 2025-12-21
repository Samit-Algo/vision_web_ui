// Main App component - This is the entry point of our application
import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import { isAuthenticated, removeToken } from './utils/storage';
import { logout as authLogout, getCurrentUser } from './services/auth/authService';
import { cleanupAllWebRTCConnections } from './hooks/useWebRTC';
import { setTokenExpiredCallback } from './services/api/client';
import type { UserResponse } from './types/authTypes';

function App() {
  // State to track if user is logged in or not
  // Check localStorage on app start to see if user was already logged in
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // State to store current user profile data
  const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);

  // Set up token expiration callback
  useEffect(() => {
    setTokenExpiredCallback(() => {
      console.log('Token expired - redirecting to login');
      handleLogout();
    });
  }, []);

  // This runs once when the app first loads
  useEffect(() => {
    // Check if user has a valid token in localStorage
    if (isAuthenticated()) {
      setIsLoggedIn(true);
      console.log('User is already logged in');
      
      // Fetch user profile if already authenticated
      const fetchUserProfile = async () => {
        const result = await getCurrentUser();
        if (result.success && result.user) {
          setCurrentUser(result.user);
        } else {
          // If token is invalid/expired, logout
          if (result.error && (
            result.error.toLowerCase().includes('expired') ||
            result.error.toLowerCase().includes('invalid') ||
            result.error.toLowerCase().includes('signature')
          )) {
            console.log('Token validation failed - redirecting to login');
            handleLogout();
          }
        }
      };
      fetchUserProfile();
    }
  }, []); // Empty array means this only runs once on mount

  // Function to handle successful login
  const handleLogin = (user: UserResponse | null) => {
    setIsLoggedIn(true); // Switch to dashboard view
    setCurrentUser(user); // Store user profile data
  };

  // Function to handle logout
  const handleLogout = () => {
    // Cleanup all WebRTC connections
    cleanupAllWebRTCConnections();
    // Remove token from storage and logout from backend
    authLogout();
    setIsLoggedIn(false); // Switch back to login view
    setCurrentUser(null); // Clear user profile data
  };

  return (
    <div className="min-h-screen bg-[#0f1729]">
      {/* Conditional rendering - show login or dashboard based on login state */}
      {!isLoggedIn ? (
        // Show login page if not logged in
        <div className="flex items-center justify-center p-4 min-h-screen">
          <LoginPage onLogin={handleLogin} />
        </div>
      ) : (
        // Show dashboard if logged in
        <Dashboard onLogout={handleLogout} currentUser={currentUser} />
      )}
    </div>
  );
}

export default App;
