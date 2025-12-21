// Zone Drawing Panel Component - Replaces right panel for zone drawing
import React, { useState, useRef, useEffect } from 'react';
import { X, Square, Pentagon, Minus } from 'lucide-react';

function ZoneDrawingPanel({ 
  cameraSnapshot, 
  camera, 
  zoneName,
  onZoneComplete, 
  onCancel,
  theme 
}) {
  const [points, setPoints] = useState([]);
  const [drawingMode, setDrawingMode] = useState('polygon'); // 'polygon', 'rectangle', 'line'
  const [isDrawingRect, setIsDrawingRect] = useState(false);
  const [rectStart, setRectStart] = useState(null);
  const [tempRect, setTempRect] = useState(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  // Draw on canvas whenever points change or mode changes
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw based on mode and points
    if (points.length > 0) {
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 3;
      ctx.fillStyle = '#00ff0033';
      
      if (drawingMode === 'line') {
        // Draw line
        ctx.beginPath();
        points.forEach((point, i) => {
          if (i === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        ctx.stroke();
      } else {
        // Draw polygon or rectangle
        ctx.beginPath();
        points.forEach((point, i) => {
          if (i === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        
        // Close and fill polygon if we have enough points
        if (drawingMode === 'polygon' && points.length >= 3) {
          ctx.closePath();
          ctx.fill();
        } else if (drawingMode === 'rectangle' && points.length === 4) {
          ctx.closePath();
          ctx.fill();
        }
        ctx.stroke();
      }
      
      // Draw points as circles
      points.forEach((point, i) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI);
        ctx.fillStyle = '#00ff00';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw point number
        ctx.fillStyle = '#fff';
        ctx.font = '12px sans-serif';
        ctx.fillText(i + 1, point.x + 10, point.y - 10);
      });
    }
    
    // Draw temporary rectangle while dragging
    if (tempRect) {
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 3;
      ctx.fillStyle = '#00ff0033';
      ctx.strokeRect(tempRect.x, tempRect.y, tempRect.width, tempRect.height);
      ctx.fillRect(tempRect.x, tempRect.y, tempRect.width, tempRect.height);
    }
  }, [points, drawingMode, tempRect]);

  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (drawingMode === 'polygon') {
      // Polygon mode - add point on each click
      setPoints([...points, { x, y }]);
    } else if (drawingMode === 'line') {
      // Line mode - add point (max 2 points)
      if (points.length < 2) {
        setPoints([...points, { x, y }]);
      }
    }
    // Rectangle mode handled by mouse down/up
  };

  const handleMouseDown = (e) => {
    if (drawingMode !== 'rectangle') return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    setIsDrawingRect(true);
    setRectStart({ x, y });
    setPoints([]); // Clear previous rectangle
  };

  const handleMouseMove = (e) => {
    if (!isDrawingRect || drawingMode !== 'rectangle') return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const width = x - rectStart.x;
    const height = y - rectStart.y;
    
    setTempRect({
      x: width > 0 ? rectStart.x : x,
      y: height > 0 ? rectStart.y : y,
      width: Math.abs(width),
      height: Math.abs(height)
    });
  };

  const handleMouseUp = (e) => {
    if (!isDrawingRect || drawingMode !== 'rectangle') return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    // Create rectangle as 4 corner points
    const x1 = Math.min(rectStart.x, x);
    const y1 = Math.min(rectStart.y, y);
    const x2 = Math.max(rectStart.x, x);
    const y2 = Math.max(rectStart.y, y);
    
    setPoints([
      { x: x1, y: y1 },
      { x: x2, y: y1 },
      { x: x2, y: y2 },
      { x: x1, y: y2 }
    ]);
    
    setIsDrawingRect(false);
    setRectStart(null);
    setTempRect(null);
  };

  const handleDoubleClick = () => {
    if (drawingMode === 'polygon' && points.length >= 3) {
      handleDone();
    }
  };

  const handleUndo = () => {
    setPoints(points.slice(0, -1));
  };

  const handleClear = () => {
    setPoints([]);
    setTempRect(null);
    setRectStart(null);
    setIsDrawingRect(false);
  };

  const handleModeChange = (mode) => {
    setDrawingMode(mode);
    setPoints([]);
    setTempRect(null);
    setRectStart(null);
    setIsDrawingRect(false);
  };

  const handleDone = () => {
    let isValid = false;
    
    if (drawingMode === 'polygon' && points.length >= 3) {
      isValid = true;
    } else if (drawingMode === 'rectangle' && points.length === 4) {
      isValid = true;
    } else if (drawingMode === 'line' && points.length === 2) {
      isValid = true;
    }
    
    if (isValid) {
      const zone = {
        id: Date.now(),
        name: zoneName || 'Custom Zone',
        points: points,
        color: '#ff0000',
        type: drawingMode === 'line' ? 'line_crossing' : 'exclusion',
        drawingMode: drawingMode
      };
      onZoneComplete(zone);
    }
  };

  const getInstructions = () => {
    if (drawingMode === 'polygon') {
      if (points.length === 0) return `Click to mark corners of the ${zoneName?.toLowerCase() || 'area'}`;
      if (points.length < 3) return `Keep clicking to outline the area (${3 - points.length} more needed)`;
      return 'Double-click or press Done to finish';
    } else if (drawingMode === 'rectangle') {
      if (points.length === 0) return 'Click and drag to draw a rectangle';
      return 'Rectangle drawn! Click Done to save or draw a new one';
    } else if (drawingMode === 'line') {
      if (points.length === 0) return 'Click to set the start point of the line';
      if (points.length === 1) return 'Click to set the end point of the line';
      return 'Line complete! Click Done to save';
    }
  };

  const isDoneEnabled = () => {
    if (drawingMode === 'polygon') return points.length >= 3;
    if (drawingMode === 'rectangle') return points.length === 4;
    if (drawingMode === 'line') return points.length === 2;
    return false;
  };

  return (
    <div className={`rounded-lg h-full flex flex-col ${
      theme === 'dark' 
        ? 'bg-[#1a2332] border border-gray-800' 
        : 'bg-white border border-gray-200'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className={`text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              🎨 Draw Zone: {zoneName || 'Area'}
            </h3>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Select a drawing tool below
            </p>
          </div>
          <button
            onClick={() => onCancel()}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
          </button>
        </div>
        
        {/* Drawing Mode Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => handleModeChange('polygon')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              drawingMode === 'polygon'
                ? 'bg-blue-600 text-white shadow-lg'
                : theme === 'dark'
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Pentagon className="w-4 h-4" />
            <span className="text-sm">Polygon</span>
          </button>
          
          <button
            onClick={() => handleModeChange('rectangle')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              drawingMode === 'rectangle'
                ? 'bg-blue-600 text-white shadow-lg'
                : theme === 'dark'
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Square className="w-4 h-4" />
            <span className="text-sm">Rectangle</span>
          </button>
          
          <button
            onClick={() => handleModeChange('line')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              drawingMode === 'line'
                ? 'bg-blue-600 text-white shadow-lg'
                : theme === 'dark'
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Minus className="w-4 h-4" />
            <span className="text-sm">Line</span>
          </button>
        </div>
      </div>

      {/* Drawing area */}
      <div className="flex-1 bg-black relative overflow-hidden flex items-center justify-center">
        {/* Camera snapshot */}
        <img
          ref={imageRef}
          src={cameraSnapshot || "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=675&fit=crop"}
          alt={`${camera.name} snapshot`}
          className="max-w-full max-h-full object-contain"
        />
        
        {/* Drawing canvas overlay */}
        <canvas
          ref={canvasRef}
          width={1200}
          height={675}
          onClick={handleCanvasClick}
          onDoubleClick={handleDoubleClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 cursor-crosshair"
          style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto' }}
        />

        {/* Helper text overlay */}
        <div className="absolute top-4 left-4 bg-black/80 px-4 py-3 rounded-lg max-w-md">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-blue-400 font-bold">
              {drawingMode === 'polygon' && '🔷 Polygon Mode'}
              {drawingMode === 'rectangle' && '⬛ Rectangle Mode'}
              {drawingMode === 'line' && '📏 Line Mode'}
            </span>
          </div>
          <p className="text-white text-sm">
            💡 {getInstructions()}
          </p>
          <div className="text-xs text-green-400 mt-1">
            {drawingMode === 'polygon' && `Points: ${points.length} ${points.length >= 3 ? '✓ Ready' : ''}`}
            {drawingMode === 'rectangle' && `${points.length === 4 ? '✓ Rectangle drawn' : 'Drag to draw rectangle'}`}
            {drawingMode === 'line' && `Points: ${points.length}/2 ${points.length === 2 ? '✓ Ready' : ''}`}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 border-t border-gray-700 flex items-center justify-between flex-shrink-0">
        <div className="flex gap-2">
          <button
            onClick={handleUndo}
            disabled={points.length === 0 || drawingMode === 'rectangle'}
            className={`px-4 py-2 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            ↩️ Undo
          </button>
          <button
            onClick={handleClear}
            disabled={points.length === 0}
            className={`px-4 py-2 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            🗑️ Clear All
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onCancel()}
            className={`px-4 py-2 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
            }`}
          >
            ✕ Cancel
          </button>
          <button
            onClick={handleDone}
            disabled={!isDoneEnabled()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ✓ Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default ZoneDrawingPanel;
