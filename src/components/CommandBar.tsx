// AI Command Bar Component - Bottom command interface for natural language control
import React, { useState, useRef, useEffect } from 'react';
import { Send, Minimize2, Maximize2, Sparkles, ChevronUp, ChevronDown, GripHorizontal, Plus, Mic, ArrowUp, Activity, Image, Brain, Camera } from 'lucide-react';

function CommandBar({ 
  theme, 
  onCommand, 
  isExpanded, 
  onToggleExpand 
}) {
  // State for user input
  const [input, setInput] = useState('');
  
  // State for chat history (user messages and AI responses)
  const [messages, setMessages] = useState([
    {
      type: 'ai',
      text: 'Hi! I\'m your AI assistant. Try commands like "show cameras", "switch to light mode", or "go to dashboard".'
    }
  ]);

  // State for adjustable height
  const [height, setHeight] = useState(512); // Default 32rem = 512px
  const [isResizing, setIsResizing] = useState(false);

  // State for plus menu popup
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);

  // Ref for auto-scrolling chat
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const plusMenuRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && isExpanded) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isExpanded]);

  // Handle resize drag
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      
      // Calculate new height based on mouse position from bottom of viewport
      const newHeight = window.innerHeight - e.clientY;
      
      // Constrain height between 200px and 80% of viewport
      const minHeight = 200;
      const maxHeight = window.innerHeight * 0.8;
      const constrainedHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
      
      setHeight(constrainedHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  // Close plus menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(event.target)) {
        setIsPlusMenuOpen(false);
      }
    };

    if (isPlusMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPlusMenuOpen]);

  // Function to handle command submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!input.trim()) return;

    // Add user message to chat
    const userMessage = { type: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);

    // Process the command and get AI response
    const response = processCommand(input.toLowerCase().trim());
    
    // Add AI response to chat
    setTimeout(() => {
      setMessages(prev => [...prev, { type: 'ai', text: response }]);
    }, 300);

    // Clear input
    setInput('');
  };

  // Function to process natural language commands
  const processCommand = (command) => {
    // Theme commands
    if (command.includes('dark mode') || command.includes('dark theme')) {
      onCommand({ type: 'theme', value: 'dark' });
      return 'Switched to dark mode ✓';
    }
    if (command.includes('light mode') || command.includes('light theme')) {
      onCommand({ type: 'theme', value: 'light' });
      return 'Switched to light mode ✓';
    }

    // Direction commands
    if (command.includes('rtl') || command.includes('right to left')) {
      onCommand({ type: 'direction', value: 'rtl' });
      return 'Changed to RTL direction ✓';
    }
    if (command.includes('ltr') || command.includes('left to right')) {
      onCommand({ type: 'direction', value: 'ltr' });
      return 'Changed to LTR direction ✓';
    }

    // Navigation commands
    if (command.includes('dashboard') || command.includes('home') || command.includes('go back')) {
      onCommand({ type: 'navigate', value: 'dashboard' });
      return 'Navigating to dashboard ✓';
    }

    // Camera selection commands
    if (command.includes('camera')) {
      // Extract camera number or name
      const cameraMatch = command.match(/camera\s+(\d+|[a-z\s]+)/i);
      if (cameraMatch) {
        const cameraIdentifier = cameraMatch[1];
        onCommand({ type: 'selectCamera', value: cameraIdentifier });
        return `Opening camera: ${cameraIdentifier} ✓`;
      }
      return 'Please specify which camera (e.g., "show camera 1" or "camera entrance")';
    }

    // Show all cameras
    if (command.includes('show cameras') || command.includes('all cameras') || command.includes('camera list')) {
      onCommand({ type: 'navigate', value: 'dashboard' });
      return 'Showing all cameras ✓';
    }

    // Sidebar commands
    if (command.includes('collapse sidebar') || command.includes('hide sidebar')) {
      onCommand({ type: 'sidebar', value: 'collapse' });
      return 'Sidebar collapsed ✓';
    }
    if (command.includes('expand sidebar') || command.includes('show sidebar')) {
      onCommand({ type: 'sidebar', value: 'expand' });
      return 'Sidebar expanded ✓';
    }

    // Help command
    if (command.includes('help') || command === 'what can you do') {
      return 'I can help you with:\n• Navigation: "go to dashboard", "show camera 1"\n• Theme: "dark mode", "light mode"\n• Direction: "switch to rtl"\n• Sidebar: "collapse sidebar", "expand sidebar"\n\nJust type naturally and I\'ll understand!';
    }

    // Default response for unrecognized commands
    return 'I\'m not sure about that command. Try "help" to see what I can do, or use the navigation buttons above.';
  };

  // Suggested commands for quick access
  const suggestions = [
    'Show cameras',
    'Dark mode',
    'Light mode',
    'Go to dashboard',
    'Help'
  ];

  // Function to handle + button click
  const handlePlusClick = () => {
    // Placeholder for attach files, add context, etc.
    const response = 'Attachment feature coming soon! You can add files, images, or context here.';
    setMessages(prev => [...prev, { type: 'ai', text: response }]);
  };

  // Function to handle mic button click
  const handleMicClick = () => {
    // Placeholder for voice recording
    const response = 'Voice recording feature coming soon! Click to start recording your voice.';
    setMessages(prev => [...prev, { type: 'ai', text: response }]);
  };

  // Function to handle voice assistant button click
  const handleVoiceAssistantClick = () => {
    // Placeholder for voice assistant
    const response = 'Voice assistant activated! Speak your command naturally.';
    setMessages(prev => [...prev, { type: 'ai', text: response }]);
  };

  // Plus menu options
  const plusMenuOptions = [
    {
      icon: Image,
      label: 'Add photos & files',
      onClick: () => {
        setIsPlusMenuOpen(false);
        setMessages(prev => [...prev, { type: 'ai', text: 'File upload feature coming soon! You\'ll be able to upload images and videos for AI analysis.' }]);
      }
    },
    {
      icon: Brain,
      label: 'Select model',
      onClick: () => {
        setIsPlusMenuOpen(false);
        setMessages(prev => [...prev, { type: 'ai', text: 'Model selection coming soon! Choose from person detection, face recognition, object detection, and more.' }]);
      }
    },
    {
      icon: Camera,
      label: 'Select camera',
      onClick: () => {
        setIsPlusMenuOpen(false);
        setMessages(prev => [...prev, { type: 'ai', text: 'Camera selector coming soon! Quickly switch between your connected cameras.' }]);
      }
    }
  ];
  
  return (
    <div 
      ref={containerRef}
      className={`border-t flex flex-col transition-all duration-300 ${
        theme === 'dark' 
          ? 'bg-[#243447] border-gray-700' 
          : 'bg-blue-50 border-blue-200'
      }`}
      style={{ height: isExpanded ? `${height}px` : '56px' }}
    >
      {/* Resize handle - Only visible when expanded */}
      {isExpanded && (
        <div
          onMouseDown={handleMouseDown}
          className={`h-1.5 cursor-ns-resize hover:bg-blue-500 transition-colors flex items-center justify-center group ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
          }`}
        >
          <GripHorizontal className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${
            theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
          }`} />
        </div>
      )}
      
      {/* Header - Always visible */}
      <div 
        className={`flex items-center justify-between px-4 py-3 border-b cursor-pointer hover:bg-opacity-80 transition-colors ${
          theme === 'dark' ? 'border-gray-700' : 'border-blue-200'
        }`}
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-2">
          <Sparkles className={`w-4 h-4 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
          <span className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            AI Assistant
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            theme === 'dark' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
          }`}>
            Beta
          </span>
        </div>
        
        <button 
          className={`p-1 rounded hover:bg-opacity-20 ${
            theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
        >
          {isExpanded ? (
            <ChevronDown className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
          ) : (
            <ChevronUp className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
          )}
        </button>
      </div>

      {/* Expanded content - Chat area */}
      {isExpanded && (
        <>
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message, index) => (
              <div 
                key={index}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] px-4 py-2 rounded-lg whitespace-pre-line ${
                    message.type === 'user'
                      ? theme === 'dark'
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-500 text-white'
                      : theme === 'dark'
                        ? 'bg-[#0f1729] text-gray-300 border border-gray-700'
                        : 'bg-gray-100 text-gray-900 border border-gray-200'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions */}
          <div className={`px-4 py-2 border-t ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
            <div className="flex gap-2 flex-wrap">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setInput(suggestion)}
                  className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                    theme === 'dark'
                      ? 'bg-[#0f1729] text-gray-400 hover:text-white hover:bg-gray-700 border border-gray-700'
                      : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200 border border-gray-200'
                  }`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Input area */}
          <form 
            onSubmit={handleSubmit}
            className={`p-4 border-t relative ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}
          >
            {/* Plus menu popup */}
            {isPlusMenuOpen && (
              <div
                ref={plusMenuRef}
                className={`absolute bottom-full left-4 mb-2 rounded-lg shadow-lg border overflow-hidden animate-fadeIn ${
                  theme === 'dark'
                    ? 'bg-[#1a2332] border-gray-700'
                    : 'bg-white border-gray-300'
                }`}
                style={{ minWidth: '220px' }}
              >
                {plusMenuOptions.map((option, index) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={option.onClick}
                      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors border-b last:border-b-0 ${
                        theme === 'dark'
                          ? 'hover:bg-[#243447] text-gray-300 hover:text-white border-gray-700'
                          : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900 border-gray-200'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className={`flex gap-2 items-end rounded-lg border p-2 ${
              theme === 'dark' 
                ? 'bg-[#0f1729] border-gray-700' 
                : 'bg-white border-gray-300'
            }`}>
              {/* Plus button - Always visible, left side */}
              <button
                type="button"
                className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                  theme === 'dark'
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPlusMenuOpen(!isPlusMenuOpen);
                }}
              >
                <Plus className="w-5 h-5" />
              </button>

              {/* Textarea - Center, flexible width */}
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  // Submit on Enter (without Shift)
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Ask anything..."
                rows={1}
                className={`flex-1 px-2 py-2 bg-transparent outline-none text-sm resize-none max-h-32 ${
                  theme === 'dark' ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
                }`}
                style={{
                  minHeight: '24px',
                  height: 'auto'
                }}
                onInput={(e) => {
                  // Auto-resize textarea based on content
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
              />

              {/* Mic button - Always visible */}
              <button
                type="button"
                className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                  theme === 'dark'
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
                onClick={handleMicClick}
              >
                <Mic className="w-5 h-5" />
              </button>

              {/* Dynamic button - Voice Assistant (empty) OR Send (typing) */}
              {input.trim() ? (
                // Send button with Arrow Up - Shows when typing
                <button
                  type="submit"
                  className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                    theme === 'dark'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  <ArrowUp className="w-5 h-5" />
                </button>
              ) : (
                // Voice Assistant button - Shows when empty
                <button
                  type="button"
                  className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                    theme === 'dark'
                      ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                      : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={handleVoiceAssistantClick}
                >
                  <Activity className="w-5 h-5" />
                </button>
              )}
            </div>
          </form>
        </>
      )}
    </div>
  );
}

export default CommandBar;