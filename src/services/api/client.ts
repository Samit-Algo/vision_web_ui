// API Client - Handles all HTTP requests to the backend
// This is like a helper that makes it easy to call your backend API

import { apiBaseUrl } from '../../config/apiConfig';
import { getToken, removeToken } from '../../utils/storage';

// Global callback for handling token expiration
let onTokenExpired: (() => void) | null = null;

/**
 * Sets a callback function to be called when token expires
 * @param callback - Function to call when token expiration is detected
 */
export function setTokenExpiredCallback(callback: () => void): void {
  onTokenExpired = callback;
}

/**
 * Checks if an error message indicates token expiration
 * @param error - Error message to check
 * @returns true if error indicates token expiration
 */
function isTokenExpiredError(error: string): boolean {
  const expiredPatterns = [
    /signature has expired/i,
    /invalid.*token/i,
    /expired.*token/i,
    /token.*expired/i,
    /invalid or expired token/i,
  ];
  
  return expiredPatterns.some(pattern => pattern.test(error));
}

// Types for our API responses
interface ApiResponse<T> {
  data?: T;
  error?: string;
}

/**
 * Makes a POST request to the backend
 * @param endpoint - The API endpoint (e.g., '/api/v1/auth/login')
 * @param data - The data to send in the request body
 * @param requireAuth - Whether to include authentication token (default: true)
 * @returns The response data from the backend
 */
export async function apiPost<T>(
  endpoint: string,
  data: unknown,
  requireAuth: boolean = true
): Promise<ApiResponse<T>> {
  try {
    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json', // Tell backend we're sending JSON
    };

    // Add authorization token if required
    if (requireAuth) {
      const token = getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    // Make the HTTP POST request
    const response = await fetch(`${apiBaseUrl}${endpoint}`, {
      method: 'POST', // HTTP method
      headers,
      body: JSON.stringify(data), // Convert JavaScript object to JSON string
    });

    // Parse the JSON response from backend
    let responseData;
    try {
      responseData = await response.json();
    } catch (parseError) {
      // If response is not JSON, return a generic error
      return {
        error: `Server error: ${response.status} ${response.statusText}`,
      };
    }

    // Check if the request was successful (status 200-299)
    if (!response.ok) {
      const errorMessage = responseData.detail || responseData.message || 'Something went wrong';
      
      // Check if error is due to token expiration
      if (isTokenExpiredError(errorMessage)) {
        // Remove expired token
        removeToken();
        // Trigger logout callback if set
        if (onTokenExpired) {
          onTokenExpired();
        }
      }
      
      // If error, return error message
      return {
        error: errorMessage,
      };
    }

    // If successful, return the data
    return { data: responseData };
  } catch (error) {
    // Handle network errors or other exceptions
    console.error('API Error:', error);
    return {
      error: error instanceof Error ? error.message : 'Network error. Please check your connection.',
    };
  }
}

/**
 * Makes a GET request to the backend
 * @param endpoint - The API endpoint
 * @param token - Optional authentication token
 * @returns The response data from the backend
 */
export async function apiGet<T>(
  endpoint: string,
  token?: string
): Promise<ApiResponse<T>> {
  try {
    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add authorization token if provided
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Make the HTTP GET request
    const response = await fetch(`${apiBaseUrl}${endpoint}`, {
      method: 'GET',
      headers,
    });

    // Parse the JSON response
    let responseData;
    try {
      responseData = await response.json();
    } catch (parseError) {
      // If response is not JSON, return a generic error
      return {
        error: `Server error: ${response.status} ${response.statusText}`,
      };
    }

    // Check if request was successful
    if (!response.ok) {
      const errorMessage = responseData.detail || responseData.message || 'Something went wrong';
      
      // Check if error is due to token expiration
      if (isTokenExpiredError(errorMessage)) {
        // Remove expired token
        removeToken();
        // Trigger logout callback if set
        if (onTokenExpired) {
          onTokenExpired();
        }
      }
      
      return {
        error: errorMessage,
      };
    }

    return { data: responseData };
  } catch (error) {
    console.error('API Error:', error);
    return {
      error: error instanceof Error ? error.message : 'Network error. Please check your connection.',
    };
  }
}

