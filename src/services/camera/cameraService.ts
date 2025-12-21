// Camera Service - Handles all camera-related API operations
// This service connects your frontend to the backend camera API

import { apiGet } from '../api/client';
import { apiEndpoints } from '../../config/apiConfig';
import { getToken } from '../../utils/storage';
import type { CameraResponse } from '../../types/cameraTypes';

/**
 * Lists all cameras for the current authenticated user
 * @returns Object with success status and list of cameras/error message
 */
export async function listCameras(): Promise<{ success: boolean; cameras?: CameraResponse[]; error?: string }> {
  // Get the token from storage
  const token = getToken();
  
  if (!token) {
    return {
      success: false,
      error: 'No authentication token found',
    };
  }

  // Call the backend API
  const response = await apiGet<CameraResponse[]>(
    apiEndpoints.cameras.list,
    token
  );

  // Check if the API call was successful
  if (response.error) {
    return {
      success: false,
      error: response.error,
    };
  }

  // If successful, return the cameras list
  if (response.data) {
    return {
      success: true,
      cameras: response.data,
    };
  }

  // Fallback error if something unexpected happened
  return {
    success: false,
    error: 'Invalid response from server',
  };
}

