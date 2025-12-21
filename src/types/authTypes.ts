// TypeScript Type Definitions for Authentication
// These types match what your backend expects and returns

// Request type - What we send to the backend when logging in
export interface LoginRequest {
  email: string;    // User's email address
  password: string; // User's password
}

// Response type - What the backend returns after successful login
export interface LoginResponse {
  access_token: string; // JWT token for authentication
}

// Request type - What we send to the backend when registering
export interface RegisterRequest {
  full_name: string; // User's full name
  email: string;     // User's email address
  password: string;  // User's password
}

// Response type - What the backend returns after successful registration
export interface RegisterResponse {
  id: string;        // User's unique ID
  full_name: string; // User's full name
  email: string;     // User's email address
}

// Response type - What the backend returns for current user profile
export interface UserResponse {
  id: string;        // User's unique ID
  full_name: string; // User's full name
  email: string;      // User's email address
  phone?: string;    // User's phone number (optional)
  address?: string;  // User's address (optional)
}

// Error type - For handling errors
export interface AuthError {
  message: string;
  status?: number;
}

