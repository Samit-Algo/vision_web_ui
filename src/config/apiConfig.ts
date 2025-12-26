// API Configuration File
// This file stores all the API-related settings like base URL and endpoints

// Base URL of your backend API
// Change this to match your backend server address
// Example: "http://localhost:8000" for local development
// Example: "https://api.yourapp.com" for production
export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// API Endpoints - All the routes we'll call
// This keeps all endpoint paths in one place for easy management
export const apiEndpoints = {
  // Authentication endpoints
  auth: {
    login: '/api/v1/auth/login',      // Matches your backend route
    register: '/api/v1/auth/register', // Registration endpoint
    me: '/api/v1/auth/me',            // Get current user profile
    // You can add more auth endpoints here later
    // logout: '/api/v1/auth/logout',
  },
  // Camera endpoints
  cameras: {
    list: '/api/v1/cameras/list',  // List all cameras for current user
    agents: (cameraId: string) => `/api/v1/cameras/${cameraId}/agents`,  // List agents for a specific camera
  },
  // Chat endpoints
  chat: {
    message: '/api/v1/chat/message',  // New agent chat endpoint
    agentChat: '/api/v1/chat/agent_chat',  // Legacy agent creation chat endpoint (for zone functionality)
    generalChat: '/api/v1/general-chat/message',  // General chat endpoint for side chat
  },
  // Notification endpoints
  notifications: {
    websocket: '/api/v1/notifications/ws',  // WebSocket endpoint for real-time notifications
  },
  // Add more endpoint groups here as your app grows
  // users: {
  //   getProfile: '/api/v1/users/profile',
  // },
};

