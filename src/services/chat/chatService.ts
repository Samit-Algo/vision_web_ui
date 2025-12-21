// Chat Service - Handles agent creation chat API calls

import { apiPost } from '../api/client';
import { apiEndpoints } from '../../config/apiConfig';
import type { ChatMessageRequest, ChatMessageResponse, AgentChatRequest, AgentChatResponse, GeneralChatRequest, GeneralChatResponse } from '../../types/chatTypes';

/**
 * Sends a chat message to the agent chatbot (new backend API)
 * @param request - Chat request with message and optional session_id
 * @returns Object with success status and response/error message
 */
export async function sendChatMessage(
  request: ChatMessageRequest
): Promise<{ success: boolean; data?: ChatMessageResponse; error?: string }> {
  // Call the backend API
  const response = await apiPost<ChatMessageResponse>(
    apiEndpoints.chat.message,
    request
  );

  // Check if the API call was successful
  if (response.error) {
    return {
      success: false,
      error: response.error,
    };
  }

  // If successful, return the response data
  if (response.data) {
    return {
      success: true,
      data: response.data,
    };
  }

  // Fallback error if something unexpected happened
  return {
    success: false,
    error: 'Invalid response from server',
  };
}

/**
 * Legacy function for agent creation chat (kept for zone functionality)
 * Note: Zone functionality is not yet supported in backend but kept for future use
 * @param request - Chat request with message, camera ID, session ID, and optional zone
 * @returns Object with success status and response/error message
 */
export async function sendAgentChatMessage(
  request: AgentChatRequest
): Promise<{ success: boolean; data?: AgentChatResponse; error?: string }> {
  // Call the backend API
  const response = await apiPost<AgentChatResponse>(
    apiEndpoints.chat.agentChat,
    request
  );

  // Check if the API call was successful
  if (response.error) {
    return {
      success: false,
      error: response.error,
    };
  }

  // If successful, return the response data
  if (response.data) {
    return {
      success: true,
      data: response.data,
    };
  }

  // Fallback error if something unexpected happened
  return {
    success: false,
    error: 'Invalid response from server',
  };
}

/**
 * Sends a message to the general chat endpoint
 * @param request - Chat request with message and optional session_id
 * @returns Object with success status and response/error message
 */
export async function sendGeneralChatMessage(
  request: GeneralChatRequest
): Promise<{ success: boolean; data?: GeneralChatResponse; error?: string }> {
  // Call the backend API
  const response = await apiPost<GeneralChatResponse>(
    apiEndpoints.chat.generalChat,
    request
  );

  // Check if the API call was successful
  if (response.error) {
    return {
      success: false,
      error: response.error,
    };
  }

  // If successful, return the response data
  if (response.data) {
    return {
      success: true,
      data: response.data,
    };
  }

  // Fallback error if something unexpected happened
  return {
    success: false,
    error: 'Invalid response from server',
  };
}
