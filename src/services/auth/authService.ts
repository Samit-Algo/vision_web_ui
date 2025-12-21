// Authentication Service - Handles all login/logout/register operations
// This is the main service that connects your frontend to the backend auth API

import { apiPost, apiGet } from '../api/client';
import { apiEndpoints } from '../../config/apiConfig';
import { saveToken, removeToken, getToken } from '../../utils/storage';
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, UserResponse } from '../../types/authTypes';

/**
 * Logs in a user by sending credentials to the backend
 * @param email - User's email address
 * @param password - User's password
 * @returns Object with success status and token/error message
 */
export async function login(
  email: string,
  password: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  // Prepare the login request data
  const loginData: LoginRequest = {
    email,
    password,
  };

  // Call the backend API (no auth required for login)
  const response = await apiPost<LoginResponse>(
    apiEndpoints.auth.login,
    loginData,
    false // Don't require auth for login endpoint
  );

  // Check if the API call was successful
  if (response.error) {
    // If there's an error, return it
    return {
      success: false,
      error: response.error,
    };
  }

  // If successful, save the token and return it
  if (response.data?.access_token) {
    const token = response.data.access_token;
    saveToken(token); // Save token to localStorage
    return {
      success: true,
      token,
    };
  }

  // Fallback error if something unexpected happened
  return {
    success: false,
    error: 'Invalid response from server',
  };
}

/**
 * Registers a new user by sending registration data to the backend
 * @param fullName - User's full name
 * @param email - User's email address
 * @param password - User's password
 * @returns Object with success status and user data/error message
 */
export async function register(
  fullName: string,
  email: string,
  password: string
): Promise<{ success: boolean; user?: RegisterResponse; error?: string }> {
  // Prepare the registration request data
  const registerData: RegisterRequest = {
    full_name: fullName,
    email,
    password,
  };

  // Call the backend API (no auth required for register)
  const response = await apiPost<RegisterResponse>(
    apiEndpoints.auth.register,
    registerData,
    false // Don't require auth for register endpoint
  );

  // Check if the API call was successful
  if (response.error) {
    // If there's an error, return it
    return {
      success: false,
      error: response.error,
    };
  }

  // If successful, return the user data
  if (response.data) {
    return {
      success: true,
      user: response.data,
    };
  }

  // Fallback error if something unexpected happened
  return {
    success: false,
    error: 'Invalid response from server',
  };
}

/**
 * Gets the current authenticated user's profile
 * @returns Object with success status and user data/error message
 */
export async function getCurrentUser(): Promise<{ success: boolean; user?: UserResponse; error?: string }> {
  // Get the token from storage
  const token = getToken();
  
  if (!token) {
    return {
      success: false,
      error: 'No authentication token found',
    };
  }

  // Call the backend API
  const response = await apiGet<UserResponse>(
    apiEndpoints.auth.me,
    token
  );

  // Check if the API call was successful
  if (response.error) {
    return {
      success: false,
      error: response.error,
    };
  }

  // If successful, return the user data
  if (response.data) {
    return {
      success: true,
      user: response.data,
    };
  }

  // Fallback error if something unexpected happened
  return {
    success: false,
    error: 'Invalid response from server',
  };
}

/**
 * Logs out the current user
 * Removes the token from storage
 */
export function logout(): void {
  removeToken();
  console.log('User logged out');
}

