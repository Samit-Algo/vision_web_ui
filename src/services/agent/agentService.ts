// Agent Service - Handles all agent-related API operations
// This service connects your frontend to the backend agent API

import { apiGet } from '../api/client';
import { apiEndpoints } from '../../config/apiConfig';
import { getToken } from '../../utils/storage';
import type { AgentResponse } from '../../types/agentTypes';

/**
 * Lists all agents for a specific camera
 * @param cameraId - The ID of the camera to get agents for
 * @returns Object with success status and list of agents/error message
 */
export async function listAgentsByCamera(
  cameraId: string
): Promise<{ success: boolean; agents?: AgentResponse[]; error?: string }> {
  // Get the token from storage
  const token = getToken();
  
  if (!token) {
    return {
      success: false,
      error: 'No authentication token found',
    };
  }

  if (!cameraId) {
    return {
      success: false,
      error: 'Camera ID is required',
    };
  }

  // Call the backend API
  const response = await apiGet<AgentResponse[]>(
    apiEndpoints.cameras.agents(cameraId),
    token
  );

  // Check if the API call was successful
  if (response.error) {
    return {
      success: false,
      error: response.error,
    };
  }

  // If successful, return the agents list
  if (response.data) {
    return {
      success: true,
      agents: response.data,
    };
  }

  // Fallback error if something unexpected happened
  return {
    success: false,
    error: 'Invalid response from server',
  };
}

