// Agent Chatbot Component - AI assistant for adding agents (ChatGPT Style)
import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Send, X, Sparkles } from 'lucide-react';
import { sendChatMessage } from '../services/chat/chatService';
import type { ChatMessageRequest, ZoneData } from '../types/chatTypes';

interface AgentChatbotProps {
  theme: 'dark' | 'light';
  onClose: () => void;
  startZoneDrawing: (zoneName: string, agentId?: string | null) => void;
  cameraId: string;
}

// Expose methods to parent component via ref
export interface AgentChatbotRef {
  sendZoneData: (zone: { points: Array<{ x: number; y: number }>; type?: string; name?: string; [key: string]: unknown }) => void;
}

// Message type definition
interface ChatMessage {
  id: number;
  type: 'user' | 'bot';
  text: string;
  timestamp: Date;
  hasButton?: boolean;
  buttonText?: string;
  buttonAction?: () => void;
}

const AgentChatbot = forwardRef<AgentChatbotRef, AgentChatbotProps>(
  function AgentChatbot({ theme, onClose, startZoneDrawing, cameraId }, ref) {
    // Session ID for maintaining conversation context
    const [sessionId, setSessionId] = useState<string | null>(null);
    
    // Chat messages state
    const [messages, setMessages] = useState<ChatMessage[]>([
      {
        id: 1,
        type: 'bot',
        text: 'Hello! I\'m your AI assistant. I can help you add and configure agents for your camera. What would you like to detect?',
        timestamp: new Date(),
      },
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const pendingZoneRef = useRef<{ points: Array<{ x: number; y: number }>; type?: string; name?: string; [key: string]: unknown } | null>(null);
    
    // State to track zone UI visibility based on API flags
    const [zoneUIVisible, setZoneUIVisible] = useState(false);


    // Generate session ID on mount if not provided
    useEffect(() => {
      if (!sessionId) {
        setSessionId(`agent_chat_${cameraId}_${Date.now()}`);
      }
    }, [cameraId, sessionId]);

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      sendZoneData: (zone: { points: Array<{ x: number; y: number }>; type?: string; name?: string; [key: string]: unknown }) => {
        // Convert zone format from {x, y} to [x, y] coordinates for API
        // Note: Backend expects polygon type, but we support polygon, rectangle, and line in UI
        // All are sent as polygon type with coordinates array
        const zoneData: ZoneData = {
          type: "polygon",
          coordinates: zone.points.map(point => [point.x, point.y])
        };
        
        // Send zone data with message to backend
        sendMessageToBackend("Zone drawn", zoneData);
      },
    }));

    // Scroll to bottom when messages update
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
      scrollToBottom();
    }, [messages]);

    // Auto-resize textarea
    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
      }
    }, [inputValue]);


    // Send message to backend
    const sendMessageToBackend = async (message: string, zoneData?: ZoneData) => {
      if (!message || message.trim() === '') return;

      setIsTyping(true);
      setError(null);

      try {
        const request: ChatMessageRequest = {
          message: message.trim(),
          session_id: sessionId || undefined,
          zone_data: zoneData, // Include zone data if available
        };

        const response = await sendChatMessage(request);

        if (!response.success || !response.data) {
          const errorMessage = response.error || 'Failed to get response from server';
          setError(errorMessage);
          
          const errorBotMessage: ChatMessage = {
            id: messages.length + 2,
            type: 'bot',
            text: `Sorry, I encountered an error: ${errorMessage}. Please try again.`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorBotMessage]);
          setIsTyping(false);
          return;
        }

        const chatResponse = response.data;

        // Update session ID from response if provided
        if (chatResponse.session_id && chatResponse.session_id !== sessionId) {
          setSessionId(chatResponse.session_id);
        }

        // ✅ CRITICAL: Control zone UI based on API flags
        // Show zone UI only when BOTH flags are true
        const shouldShowZone = chatResponse.zone_required && chatResponse.awaiting_zone_input;
        setZoneUIVisible(shouldShowZone);
        
        // If zone UI should be visible, automatically trigger zone drawing
        if (shouldShowZone && startZoneDrawing) {
          startZoneDrawing('Detection Zone', null);
        }

        // Create bot message
        const botMessage: ChatMessage = {
          id: messages.length + 2,
          type: 'bot',
          text: chatResponse.response || 'I apologize, but I didn\'t receive a proper response.',
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, botMessage]);
        pendingZoneRef.current = null;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(errorMessage);
        const errorBotMessage: ChatMessage = {
          id: messages.length + 2,
          type: 'bot',
          text: `Sorry, I encountered an error: ${errorMessage}. Please try again.`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorBotMessage]);
      } finally {
        setIsTyping(false);
      }
    };

    // Handle send message
    const handleSendMessage = () => {
      if (inputValue.trim() === '') return;

      // Add user message
      const userMessage: ChatMessage = {
        id: messages.length + 1,
        type: 'user',
        text: inputValue,
        timestamp: new Date(),
      };
      setMessages([...messages, userMessage]);
      const messageText = inputValue;
      setInputValue('');

      // Send to backend
      sendMessageToBackend(messageText);
    };

    // Handle enter key
    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    };

    return (
      <div
        className={`h-full flex flex-col rounded-lg ${
          theme === 'dark'
            ? 'bg-[#212121]'
            : 'bg-white'
        }`}
      >
        {/* Header - ChatGPT Style */}
        <div
          className={`flex items-center justify-between px-4 py-3 border-b ${
            theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Vision AI Assistant
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg hover:bg-gray-700 transition-colors ${
              theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages container - ChatGPT Style */}
        <div className={`flex-1 overflow-y-auto ${theme === 'dark' ? 'bg-[#212121]' : 'bg-white'}`}>
          <div className="px-4 py-6 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {/* Message bubble */}
                {message.type === 'user' ? (
                  // User message - with background
                  <div className="max-w-[85%] space-y-2">
                    <div
                      className={`px-4 py-2.5 rounded-2xl ${
                        theme === 'dark'
                          ? 'bg-[#2f2f2f] text-gray-100'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap">
                        {message.text}
                      </div>
                    </div>
                    {message.hasButton && (
                      <button
                        onClick={message.buttonAction}
                        className={`mt-2 px-4 py-2 rounded-lg transition-all text-sm inline-flex items-center gap-2 ${
                          theme === 'dark'
                            ? 'bg-white text-black hover:bg-gray-200'
                            : 'bg-black text-white hover:bg-gray-800'
                        }`}
                      >
                        {message.buttonText}
                      </button>
                    )}
                  </div>
                ) : (
                  // AI message - no background, just text
                  <div className="max-w-[85%] space-y-2">
                    <div
                      className={`text-sm whitespace-pre-wrap ${
                        theme === 'dark'
                          ? 'text-gray-100'
                          : 'text-gray-800'
                      }`}
                    >
                      {message.text}
                    </div>
                    {message.hasButton && (
                      <button
                        onClick={message.buttonAction}
                        className={`mt-2 px-4 py-2 rounded-lg transition-all text-sm inline-flex items-center gap-2 ${
                          theme === 'dark'
                            ? 'bg-white text-black hover:bg-gray-200'
                            : 'bg-black text-white hover:bg-gray-800'
                        }`}
                      >
                        {message.buttonText}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="max-w-[85%]">
                  <div className="flex items-center gap-1">
                    <div
                      className={`w-2 h-2 rounded-full animate-bounce ${
                        theme === 'dark' ? 'bg-gray-500' : 'bg-gray-400'
                      }`}
                      style={{ animationDelay: '0ms' }}
                    ></div>
                    <div
                      className={`w-2 h-2 rounded-full animate-bounce ${
                        theme === 'dark' ? 'bg-gray-500' : 'bg-gray-400'
                      }`}
                      style={{ animationDelay: '150ms' }}
                    ></div>
                    <div
                      className={`w-2 h-2 rounded-full animate-bounce ${
                        theme === 'dark' ? 'bg-gray-500' : 'bg-gray-400'
                      }`}
                      style={{ animationDelay: '300ms' }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area - ChatGPT Style */}
        <div className={`border-t ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="max-w-3xl mx-auto px-4 py-4">
            {/* Input box - ChatGPT Style */}
            <div
              className={`relative rounded-2xl shadow-lg ${
                theme === 'dark'
                  ? 'bg-[#2f2f2f] border border-gray-700'
                  : 'bg-white border border-gray-300'
              }`}
            >
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Message Vision AI..."
                rows={1}
                className={`w-full px-4 py-3 pr-12 rounded-2xl text-sm resize-none outline-none ${
                  theme === 'dark'
                    ? 'bg-transparent text-white placeholder-gray-500'
                    : 'bg-transparent text-gray-900 placeholder-gray-400'
                }`}
                style={{ maxHeight: '200px' }}
              />
              <button
                onClick={handleSendMessage}
                disabled={inputValue.trim() === '' || isTyping}
                className={`absolute right-2 bottom-2 p-2 rounded-lg transition-all ${
                  inputValue.trim() === '' || isTyping
                    ? theme === 'dark'
                      ? 'bg-gray-700 text-gray-600 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : theme === 'dark'
                    ? 'bg-white text-black hover:bg-gray-200'
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {/* Helper text */}
            <div className={`text-xs text-center mt-2 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-500'}`}>
              AI can make mistakes. Check important info.
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default AgentChatbot;
