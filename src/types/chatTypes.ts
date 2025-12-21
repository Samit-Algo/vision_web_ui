// Chat Types - TypeScript interfaces for agent creation chat

/**
 * Zone data format for API requests
 */
export interface ZoneData {
  type: "polygon";
  coordinates: number[][]; // Array of [x, y] points
}

/**
 * Request payload for agent creation chat (new backend API)
 */
export interface ChatMessageRequest {
  message: string;
  session_id?: string;
  zone_data?: ZoneData; // NEW: Zone data from UI
}

/**
 * Response from agent creation chat endpoint (new backend API)
 */
export interface ChatMessageResponse {
  response: string;
  session_id: string;
  status?: 'success' | 'error';
  zone_required: boolean;        // NEW: Is zone needed for this rule?
  awaiting_zone_input: boolean;   // NEW: Is LLM currently asking for zone?
}

/**
 * Legacy request payload for agent creation chat (kept for zone functionality)
 * Note: Zone functionality is not yet supported in backend but kept for future use
 */
export interface AgentChatRequest {
  message: string;
  camera_id: string;
  session_id?: string;
  zone?: {
    points: Array<{ x: number; y: number }>;
    type?: string;
    name?: string;
    [key: string]: unknown; // Allow additional zone properties
  };
}

/**
 * Legacy response from agent creation chat endpoint (kept for zone functionality)
 */
export interface AgentChatResponse {
  reply: string;
  missing_fields: string[];
  required_zone: boolean;
  should_finalize: boolean;
}

/**
 * Request payload for general chat endpoint
 */
export interface GeneralChatRequest {
  message: string;
  session_id?: string;
}

/**
 * Response from general chat endpoint
 */
export interface GeneralChatResponse {
  response: string;
  session_id: string;
  status: 'success' | 'error';
}
