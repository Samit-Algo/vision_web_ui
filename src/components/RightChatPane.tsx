// Right Chat Pane Component - AI assistant on the right side with resizable functionality
import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  X,
  Sparkles,
  ChevronDown,
  Plus,
  Mic,
  ArrowUp,
  Activity,
  Image,
  Brain,
  Camera,
  GripVertical,
} from "lucide-react";
import { sendGeneralChatMessage } from "../services/chat/chatService";

function RightChatPane({ theme, direction = 'ltr', onCommand, isOpen, onToggle, onWidthChange }) {
  // State for user input
  const [input, setInput] = useState("");

  // State for session ID to maintain conversation context
  const [sessionId, setSessionId] = useState<string | null>(null);

  // State for loading indicator
  const [isLoading, setIsLoading] = useState(false);

  // State for chat history (user messages and AI responses)
  const [messages, setMessages] = useState([
    {
      type: "ai",
      text: 'Hi! I\'m your AI assistant. How can I help you today?',
    },
  ]);

  // Constants
  const DEFAULT_WIDTH = 400; // Default width: 400px

  // State for adjustable width
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);

  // State for plus menu popup
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);

  // State for model and camera selection
  const [selectedModel, setSelectedModel] = useState("gpt-4");
  const [selectedCamera, setSelectedCamera] =
    useState("main-entrance");
  const [showModelDropdown, setShowModelDropdown] =
    useState(false);
  const [showCameraDropdown, setShowCameraDropdown] =
    useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Available models
  const models = [
    {
      id: "gpt-4",
      name: "GPT-4 Turbo",
      description: "Most capable, best for complex tasks",
    },
    {
      id: "gpt-3.5",
      name: "GPT-3.5 Turbo",
      description: "Fast and efficient",
    },
    {
      id: "claude-3",
      name: "Claude 3 Opus",
      description: "Advanced reasoning",
    },
    {
      id: "claude-2",
      name: "Claude 2",
      description: "Balanced performance",
    },
  ];

  // Available cameras (mock data)
  const cameras = [
    {
      id: "main-entrance",
      name: "Main Entrance",
      location: "Building A - Floor 1",
    },
    {
      id: "parking-lot",
      name: "Parking Lot",
      location: "Outdoor Area",
    },
    {
      id: "elevator-lobby",
      name: "Elevator Lobby",
      location: "Building A - Floor 2",
    },
    {
      id: "back-entrance",
      name: "Back Entrance",
      location: "Building B",
    },
  ];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && isOpen) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
      });
    }
  }, [messages, isOpen]);

  // Notify parent of initial width when chat opens
  useEffect(() => {
    if (isOpen && onWidthChange) {
      onWidthChange(width);
    }
  }, [isOpen, width, onWidthChange]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [input]);

  // Handle resize drag
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;

      // Calculate new width based on mouse position
      // In LTR: measure from right edge (window.innerWidth - e.clientX)
      // In RTL: measure from left edge (e.clientX)
      const newWidth = direction === 'rtl' 
        ? e.clientX 
        : window.innerWidth - e.clientX;

      // Define thresholds
      const minWidth = 200; // Minimum before auto-close
      const maxWidth = window.innerWidth * 0.8; // Maximum 80% of viewport

      // Auto-close if below minimum
      if (newWidth < minWidth) {
        onToggle(); // Close the chat
        setIsResizing(false);
        document.body.style.cursor = "default";
        document.body.style.userSelect = "auto";
        return;
      }

      // Constrain width
      const constrainedWidth = Math.max(
        minWidth,
        Math.min(maxWidth, newWidth),
      );
      setWidth(constrainedWidth);
      onWidthChange(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener(
        "mousemove",
        handleMouseMove,
      );
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, onToggle, onWidthChange, direction]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  // Close plus menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        plusMenuRef.current &&
        !plusMenuRef.current.contains(event.target)
      ) {
        setIsPlusMenuOpen(false);
      }
    };

    if (isPlusMenuOpen) {
      document.addEventListener(
        "mousedown",
        handleClickOutside,
      );
    }

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
    };
  }, [isPlusMenuOpen]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".dropdown-container")) {
        setShowModelDropdown(false);
        setShowCameraDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
  }, []);

  // Function to handle command submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    const userMessageText = input.trim();
    
    // Add user message to chat
    const userMessage = { type: "user", text: userMessageText };
    setMessages((prev) => [...prev, userMessage]);

    // Clear input immediately
    setInput("");

    // Set loading state
    setIsLoading(true);

    try {
      // Call the backend API
      const result = await sendGeneralChatMessage({
        message: userMessageText,
        session_id: sessionId || undefined,
      });

      if (result.success && result.data) {
        // Update session ID if provided
        if (result.data.session_id) {
          setSessionId(result.data.session_id);
        }

        // Add AI response to chat
        setMessages((prev) => [
          ...prev,
          { type: "ai", text: result.data.response },
        ]);
      } else {
        // Handle error
        const errorMessage = result.error || "Failed to get response from server";
        setMessages((prev) => [
          ...prev,
          { type: "ai", text: `Error: ${errorMessage}` },
        ]);
      }
    } catch (error) {
      // Handle unexpected errors
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        { type: "ai", text: "An unexpected error occurred. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };


  // Plus menu options
  const plusMenuOptions = [
    {
      icon: Image,
      label: "Add photos & files",
      onClick: () => {
        setIsPlusMenuOpen(false);
        setMessages((prev) => [
          ...prev,
          {
            type: "ai",
            text: "File upload feature coming soon! You'll be able to upload images and videos for AI analysis.",
          },
        ]);
      },
    },
    {
      icon: Brain,
      label: "Select model",
      onClick: () => {
        setIsPlusMenuOpen(false);
        setMessages((prev) => [
          ...prev,
          {
            type: "ai",
            text: "Model selection coming soon! Choose from person detection, face recognition, object detection, and more.",
          },
        ]);
      },
    },
    {
      icon: Camera,
      label: "Select camera",
      onClick: () => {
        setIsPlusMenuOpen(false);
        setMessages((prev) => [
          ...prev,
          {
            type: "ai",
            text: "Camera selector coming soon! Quickly switch between your connected cameras.",
          },
        ]);
      },
    },
  ];

  if (!isOpen) return null;

  // Determine if we should overlay or push content
  // Overlay if chat width exceeds DEFAULT_WIDTH
  const shouldOverlay = width > DEFAULT_WIDTH;

  return (
    <div
      ref={containerRef}
      className={`h-full flex flex-col ${direction === 'rtl' ? 'border-r' : 'border-l'} shadow-2xl z-40 ${
        theme === "dark"
          ? "bg-[#212121] border-gray-700"
          : "bg-white border-gray-200"
      } ${shouldOverlay ? `fixed ${direction === 'rtl' ? 'left-0' : 'right-0'} top-16 bottom-0` : "relative"}`}
      style={{
        width: `${width}px`,
      }}
    >
      {/* Resize handle - Edge drag handle with larger hit area */}
      <div
        onMouseDown={handleMouseDown}
        className={`absolute ${direction === 'rtl' ? '-right-2' : '-left-2'} top-0 bottom-0 w-6 cursor-ew-resize hover:bg-blue-500/30 transition-colors flex items-center justify-center z-[60] group ${
          theme === "dark"
            ? "bg-transparent hover:bg-blue-500/20"
            : "bg-transparent hover:bg-blue-400/20"
        }`}
      >
        {/* Visual indicator line */}
        <div
          className={`w-1 h-full ${theme === "dark" ? "bg-gray-600" : "bg-gray-300"} group-hover:bg-blue-500 transition-colors`}
        />
        {/* Grip icon */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <GripVertical
            className={`w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity ${
              theme === "dark"
                ? "text-blue-400"
                : "text-blue-600"
            }`}
          />
        </div>
      </div>

      {/* Header - ChatGPT Style */}
      <div
        className={`flex items-center justify-between px-4 py-3 border-b ${
          theme === "dark"
            ? "border-gray-800"
            : "border-gray-200"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3
              className={`text-sm ${theme === "dark" ? "text-white" : "text-gray-900"}`}
            >
              Vision AI Assistant
            </h3>
            <p
              className={`text-xs ${theme === "dark" ? "text-gray-500" : "text-gray-500"}`}
            >
              Powered by{" "}
              {models.find((m) => m.id === selectedModel)?.name}
            </p>
          </div>
        </div>
        <button
          onClick={onToggle}
          className={`p-1.5 rounded-lg hover:bg-gray-700 transition-colors ${
            theme === "dark"
              ? "text-gray-400 hover:text-white"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages container - Simple bubble style */}
      <div
        className={`flex-1 overflow-y-auto ${theme === "dark" ? "bg-[#212121]" : "bg-white"}`}
      >
        <div className="px-4 py-6 space-y-3">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
            >
              {/* Message bubble */}
              {message.type === "user" ? (
                // User message - with background
                <div
                  className={`max-w-[85%] px-4 py-2.5 rounded-2xl ${
                    theme === "dark"
                      ? "bg-[#2f2f2f] text-gray-100"
                      : "bg-gray-200 text-gray-900"
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">
                    {message.text}
                  </div>
                </div>
              ) : (
                // AI message - no background, just text
                <div className="max-w-[85%]">
                  <div
                    className={`text-sm whitespace-pre-wrap ${
                      theme === "dark"
                        ? "text-gray-100"
                        : "text-gray-800"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              )}
            </div>
          ))}
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[85%]">
                <div
                  className={`text-sm ${
                    theme === "dark"
                      ? "text-gray-100"
                      : "text-gray-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className={`w-2 h-2 rounded-full ${
                        theme === "dark" ? "bg-gray-400" : "bg-gray-500"
                      } animate-bounce`} style={{ animationDelay: '0ms' }}></div>
                      <div className={`w-2 h-2 rounded-full ${
                        theme === "dark" ? "bg-gray-400" : "bg-gray-500"
                      } animate-bounce`} style={{ animationDelay: '150ms' }}></div>
                      <div className={`w-2 h-2 rounded-full ${
                        theme === "dark" ? "bg-gray-400" : "bg-gray-500"
                      } animate-bounce`} style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-xs opacity-70">Thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area - ChatGPT Style */}
      <div
        className={`border-t ${theme === "dark" ? "border-gray-800" : "border-gray-200"}`}
      >
        <div className="px-4 py-4">
          {/* Selection Controls Row */}
          <div className="flex gap-2 mb-3 flex-wrap">
            {/* Model Selector */}
            <div className="relative dropdown-container">
              <button
                onClick={() => {
                  setShowModelDropdown(!showModelDropdown);
                  setShowCameraDropdown(false);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                  theme === "dark"
                    ? "bg-[#2f2f2f] hover:bg-[#3f3f3f] text-gray-300 border border-gray-700"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
                }`}
              >
                <Brain className="w-3 h-3" />
                <span className="truncate max-w-[100px]">
                  {
                    models.find((m) => m.id === selectedModel)
                      ?.name
                  }
                </span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showModelDropdown && (
                <div
                  className={`absolute bottom-full left-0 mb-2 w-64 rounded-lg shadow-lg overflow-hidden z-50 ${
                    theme === "dark"
                      ? "bg-[#2f2f2f] border border-gray-700"
                      : "bg-white border border-gray-200"
                  }`}
                >
                  {models.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model.id);
                        setShowModelDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-3 transition-colors ${
                        selectedModel === model.id
                          ? theme === "dark"
                            ? "bg-[#3f3f3f]"
                            : "bg-gray-100"
                          : theme === "dark"
                            ? "hover:bg-[#3f3f3f]"
                            : "hover:bg-gray-50"
                      }`}
                    >
                      <div
                        className={`text-sm ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                      >
                        {model.name}
                        {selectedModel === model.id && " ✓"}
                      </div>
                      <div
                        className={`text-xs mt-1 ${theme === "dark" ? "text-gray-500" : "text-gray-500"}`}
                      >
                        {model.description}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Camera Selector */}
            <div className="relative dropdown-container">
              <button
                onClick={() => {
                  setShowCameraDropdown(!showCameraDropdown);
                  setShowModelDropdown(false);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                  theme === "dark"
                    ? "bg-[#2f2f2f] hover:bg-[#3f3f3f] text-gray-300 border border-gray-700"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
                }`}
              >
                <Camera className="w-3 h-3" />
                <span className="truncate max-w-[100px]">
                  {
                    cameras.find((c) => c.id === selectedCamera)
                      ?.name
                  }
                </span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showCameraDropdown && (
                <div
                  className={`absolute bottom-full left-0 mb-2 w-64 rounded-lg shadow-lg overflow-hidden z-50 ${
                    theme === "dark"
                      ? "bg-[#2f2f2f] border border-gray-700"
                      : "bg-white border border-gray-200"
                  }`}
                >
                  {cameras.map((camera) => (
                    <button
                      key={camera.id}
                      onClick={() => {
                        setSelectedCamera(camera.id);
                        setShowCameraDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-3 transition-colors ${
                        selectedCamera === camera.id
                          ? theme === "dark"
                            ? "bg-[#3f3f3f]"
                            : "bg-gray-100"
                          : theme === "dark"
                            ? "hover:bg-[#3f3f3f]"
                            : "hover:bg-gray-50"
                      }`}
                    >
                      <div
                        className={`text-sm ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                      >
                        {camera.name}
                        {selectedCamera === camera.id && " ✓"}
                      </div>
                      <div
                        className={`text-xs mt-1 ${theme === "dark" ? "text-gray-500" : "text-gray-500"}`}
                      >
                        {camera.location}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Input box - ChatGPT Style */}
          <form onSubmit={handleSubmit}>
            {/* Plus menu popup */}
            {isPlusMenuOpen && (
              <div
                ref={plusMenuRef}
                className={`absolute bottom-full left-4 mb-2 rounded-lg shadow-lg border overflow-hidden animate-fadeIn ${
                  theme === "dark"
                    ? "bg-[#1a2332] border-gray-700"
                    : "bg-white border-gray-300"
                }`}
                style={{ minWidth: "220px" }}
              >
                {plusMenuOptions.map((option, index) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={option.onClick}
                      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors border-b last:border-b-0 ${
                        theme === "dark"
                          ? "hover:bg-[#243447] text-gray-300 hover:text-white border-gray-700"
                          : "hover:bg-gray-50 text-gray-700 hover:text-gray-900 border-gray-200"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm">
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <div
              className={`relative rounded-2xl shadow-lg ${
                theme === "dark"
                  ? "bg-[#2f2f2f] border border-gray-700"
                  : "bg-white border border-gray-300"
              }`}
            >
              <div className="flex gap-2 items-end p-2">
                {/* Plus button */}
                <button
                  type="button"
                  className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                    theme === "dark"
                      ? "hover:bg-gray-700 text-gray-400 hover:text-white"
                      : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPlusMenuOpen(!isPlusMenuOpen);
                  }}
                >
                  <Plus className="w-4 h-4" />
                </button>

                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  placeholder="Ask anything..."
                  rows={1}
                  className={`flex-1 px-2 py-2 bg-transparent outline-none text-sm resize-none max-h-32 ${
                    theme === "dark"
                      ? "text-white placeholder-gray-500"
                      : "text-gray-900 placeholder-gray-400"
                  }`}
                  style={{
                    minHeight: "24px",
                    height: "auto",
                  }}
                  onInput={(e) => {
                    const target = e.currentTarget;
                    target.style.height = "auto";
                    target.style.height =
                      target.scrollHeight + "px";
                  }}
                />

                {/* Mic button */}
                <button
                  type="button"
                  className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                    theme === "dark"
                      ? "hover:bg-gray-700 text-gray-400 hover:text-white"
                      : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                  }`}
                  onClick={() => {
                    setMessages((prev) => [
                      ...prev,
                      {
                        type: "ai",
                        text: "Voice recording feature coming soon!",
                      },
                    ]);
                  }}
                >
                  <Mic className="w-4 h-4" />
                </button>

                {/* Send/Voice Assistant button */}
                {input.trim() ? (
                  <button
                    type="submit"
                    className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                      theme === "dark"
                        ? "bg-white text-black hover:bg-gray-200"
                        : "bg-black text-white hover:bg-gray-800"
                    }`}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                      theme === "dark"
                        ? "hover:bg-gray-700 text-gray-400 hover:text-white"
                        : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                    }`}
                    onClick={() => {
                      setMessages((prev) => [
                        ...prev,
                        {
                          type: "ai",
                          text: "Voice assistant activated!",
                        },
                      ]);
                    }}
                  >
                    <Activity className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Helper text */}
            {/* <div
              className={`text-xs text-center mt-2 ${theme === "dark" ? "text-gray-600" : "text-gray-500"}`}
            >
              AI can make mistakes. Check important info.
            </div> */}
          </form>
        </div>
      </div>
    </div>
  );
}

export default RightChatPane;