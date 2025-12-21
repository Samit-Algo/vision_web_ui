// Dashboard Content Component - Main content area with stats and camera grid
import React, { useState, useRef, useEffect } from 'react';
import StatTile from './StatTile';
import CameraCard from './CameraCard';
import { Camera, Cpu, Activity, AlertTriangle, Filter, Grid3x3, List, Map as MapIcon, ChevronDown } from 'lucide-react';
import { listCameras } from '../services/camera/cameraService';
import type { CameraResponse } from '../types/cameraTypes';

function DashboardContent({ theme, onCameraClick }) {
  // State to track selected view mode - 'grid', 'list', or 'map'
  const [viewMode, setViewMode] = useState('grid');
  
  // State to track selected filter - 'all', 'active', or 'inactive'
  const [filterMode, setFilterMode] = useState('all');
  
  // State to control filter dropdown visibility
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // State to control view dropdown visibility
  const [isViewOpen, setIsViewOpen] = useState(false);
  
  // State for cameras data
  const [cameras, setCameras] = useState<CameraResponse[]>([]);
  const [isLoadingCameras, setIsLoadingCameras] = useState(true);
  const [camerasError, setCamerasError] = useState<string | null>(null);
  
  // References for click outside detection
  const filterRef = useRef(null);
  const viewRef = useRef(null);

  // Fetch cameras on component mount
  useEffect(() => {
    const fetchCameras = async () => {
      setIsLoadingCameras(true);
      setCamerasError(null);
      
      const result = await listCameras();
      
      if (result.success && result.cameras) {
        setCameras(result.cameras);
      } else {
        setCamerasError(result.error || 'Failed to load cameras');
        console.error('Error fetching cameras:', result.error);
      }
      
      setIsLoadingCameras(false);
    };

    fetchCameras();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
      if (viewRef.current && !viewRef.current.contains(event.target)) {
        setIsViewOpen(false);
      }
    };

    if (isFilterOpen || isViewOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterOpen, isViewOpen]);

  // Calculate stats from real camera data
  const activeCameras = cameras.filter(camera => camera.stream_url && camera.stream_url.trim() !== '').length;
  const totalCameras = cameras.length;
  
  const stats = [
    { label: 'Total Devices', value: totalCameras.toString(), subtitle: `${activeCameras} active`, subtitleColor: 'green', icon: Camera, color: 'blue' },
    { label: 'Active Agents', value: '3', subtitle: 'Running smoothly', subtitleColor: 'green', icon: Activity, color: 'green' },
    { label: 'Alerts Today', value: '24', subtitle: '4 critical', subtitleColor: 'red', icon: AlertTriangle, color: 'red' },
    { label: 'System Health', value: '98.5%', subtitle: '+0.3%', subtitleColor: 'green', icon: Cpu, color: 'purple' },
  ];

  // Transform cameras to match the expected format and filter
  const transformedCameras = cameras.map(camera => ({
    id: camera.id,
    name: camera.name,
    location: camera.device_id || 'Unknown Location',
    isLive: !!(camera.stream_url && camera.stream_url.trim() !== '') || 
            !!camera.webrtc_config ||
            (camera.stream_config?.stream_type === 'webrtc' && !!camera.stream_config?.webrtc_config),
    stream_url: camera.stream_url,
    stream_config: camera.stream_config,
    webrtc_config: camera.webrtc_config,
    lat: 0, // Default values for map view
    lng: 0,
  }));

  // Filter cameras based on selected filter
  const filteredCameras = transformedCameras.filter(camera => {
    if (filterMode === 'all') return true;
    if (filterMode === 'active') return camera.isLive;
    if (filterMode === 'inactive') return !camera.isLive;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Stats Tiles Section */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((stat, index) => (
          <StatTile 
            key={index}
            label={stat.label}
            value={stat.value}
            subtitle={stat.subtitle}
            subtitleColor={stat.subtitleColor}
            icon={stat.icon}
            color={stat.color}
            theme={theme}
          />
        ))}
      </div>

      {/* Camera Grid Section */}
      <div>
        {/* Header with Live Cameras text and action buttons */}
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-xl ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Live Cameras
          </h2>
          
          {/* Filter and View buttons */}
          <div className="flex items-center gap-3">
            {/* Filter button with dropdown */}
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  theme === 'dark'
                    ? 'bg-[#1a2332] border-gray-700 text-white hover:bg-[#0f1729]'
                    : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>Filter</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Filter dropdown */}
              {isFilterOpen && (
                <div className={`absolute right-0 mt-2 w-48 ${theme === 'dark' ? 'bg-[#1a2332] border-gray-700' : 'bg-white border-gray-200'} border rounded-lg shadow-lg py-2 z-50`}>
                  <button
                    onClick={() => {
                      setFilterMode('all');
                      setIsFilterOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 ${theme === 'dark' ? 'text-white hover:bg-[#0f1729]' : 'text-gray-900 hover:bg-gray-100'} transition-colors ${filterMode === 'all' ? 'bg-blue-500/20' : ''}`}
                  >
                    <span className="flex items-center justify-between">
                      All Cameras
                      {filterMode === 'all' && <span className="text-blue-500">✓</span>}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setFilterMode('active');
                      setIsFilterOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 ${theme === 'dark' ? 'text-white hover:bg-[#0f1729]' : 'text-gray-900 hover:bg-gray-100'} transition-colors ${filterMode === 'active' ? 'bg-blue-500/20' : ''}`}
                  >
                    <span className="flex items-center justify-between">
                      Active Only
                      {filterMode === 'active' && <span className="text-blue-500">✓</span>}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setFilterMode('inactive');
                      setIsFilterOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 ${theme === 'dark' ? 'text-white hover:bg-[#0f1729]' : 'text-gray-900 hover:bg-gray-100'} transition-colors ${filterMode === 'inactive' ? 'bg-blue-500/20' : ''}`}
                  >
                    <span className="flex items-center justify-between">
                      Inactive Only
                      {filterMode === 'inactive' && <span className="text-blue-500">✓</span>}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* View button with dropdown */}
            <div className="relative" ref={viewRef}>
              <button
                onClick={() => setIsViewOpen(!isViewOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  theme === 'dark'
                    ? 'bg-[#1a2332] border-gray-700 text-white hover:bg-[#0f1729]'
                    : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
                }`}
              >
                {viewMode === 'grid' && <Grid3x3 className="w-4 h-4" />}
                {viewMode === 'list' && <List className="w-4 h-4" />}
                {viewMode === 'map' && <MapIcon className="w-4 h-4" />}
                <span>View</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* View dropdown */}
              {isViewOpen && (
                <div className={`absolute right-0 mt-2 w-48 ${theme === 'dark' ? 'bg-[#1a2332] border-gray-700' : 'bg-white border-gray-200'} border rounded-lg shadow-lg py-2 z-50`}>
                  <button
                    onClick={() => {
                      setViewMode('grid');
                      setIsViewOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 ${theme === 'dark' ? 'text-white hover:bg-[#0f1729]' : 'text-gray-900 hover:bg-gray-100'} transition-colors ${viewMode === 'grid' ? 'bg-blue-500/20' : ''}`}
                  >
                    <span className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Grid3x3 className="w-4 h-4" />
                        Grid View
                      </span>
                      {viewMode === 'grid' && <span className="text-blue-500">✓</span>}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setViewMode('list');
                      setIsViewOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 ${theme === 'dark' ? 'text-white hover:bg-[#0f1729]' : 'text-gray-900 hover:bg-gray-100'} transition-colors ${viewMode === 'list' ? 'bg-blue-500/20' : ''}`}
                  >
                    <span className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <List className="w-4 h-4" />
                        List View
                      </span>
                      {viewMode === 'list' && <span className="text-blue-500">✓</span>}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setViewMode('map');
                      setIsViewOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 ${theme === 'dark' ? 'text-white hover:bg-[#0f1729]' : 'text-gray-900 hover:bg-gray-100'} transition-colors ${viewMode === 'map' ? 'bg-blue-500/20' : ''}`}
                  >
                    <span className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <MapIcon className="w-4 h-4" />
                        Map View
                      </span>
                      {viewMode === 'map' && <span className="text-blue-500">✓</span>}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Camera display based on selected view mode */}
        {isLoadingCameras ? (
          <div className={`flex items-center justify-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p>Loading cameras...</p>
            </div>
          </div>
        ) : camerasError ? (
          <div className={`flex items-center justify-center py-12 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
            <div className="text-center">
              <p className="mb-2">Error loading cameras</p>
              <p className="text-sm opacity-75">{camerasError}</p>
            </div>
          </div>
        ) : filteredCameras.length === 0 ? (
          <div className={`flex items-center justify-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            <div className="text-center">
              <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No cameras found</p>
            </div>
          </div>
        ) : (
          <>
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredCameras.map((camera) => (
                  <CameraCard 
                    key={camera.id}
                    id={camera.id}
                    name={camera.name}
                    location={camera.location}
                    isLive={camera.isLive}
                    streamUrl={camera.stream_url}
                    streamConfig={camera.stream_config}
                    webrtcConfig={camera.webrtc_config}
                    theme={theme}
                    onClick={() => onCameraClick(camera)}
                  />
                ))}
              </div>
            )}

            {viewMode === 'list' && (
              <div className="space-y-4">
                {filteredCameras.map((camera) => (
                  <CameraCard 
                    key={camera.id}
                    id={camera.id}
                    name={camera.name}
                    location={camera.location}
                    isLive={camera.isLive}
                    streamUrl={camera.stream_url}
                    streamConfig={camera.stream_config}
                    webrtcConfig={camera.webrtc_config}
                    theme={theme}
                    onClick={() => onCameraClick(camera)}
                    viewMode="list"
                  />
                ))}
              </div>
            )}

            {viewMode === 'map' && (
          <div className={`w-full h-[600px] rounded-lg overflow-hidden ${theme === 'dark' ? 'bg-[#1a2332]' : 'bg-gray-200'} relative`}>
            {/* Map placeholder with pins */}
            <div className="w-full h-full relative" style={{ 
              backgroundImage: 'linear-gradient(to bottom, #e5e7eb 0%, #d1d5db 100%)',
              backgroundSize: '50px 50px',
            }}>
              {/* Grid pattern to simulate map */}
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: `
                  linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
                `,
                backgroundSize: '50px 50px'
              }}></div>

              {/* Camera pins on map */}
              {filteredCameras.map((camera, index) => {
                // Position cameras in a scattered pattern
                const positions = [
                  { top: '20%', left: '30%' },
                  { top: '40%', left: '60%' },
                  { top: '60%', left: '25%' },
                  { top: '30%', left: '70%' },
                  { top: '70%', left: '50%' },
                  { top: '50%', left: '40%' },
                ];
                const position = positions[index % positions.length];

                return (
                  <div
                    key={camera.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                    style={position}
                    onClick={() => onCameraClick(camera)}
                  >
                    {/* Pin marker */}
                    <div className={`relative ${camera.isLive ? 'text-blue-500' : 'text-gray-500'}`}>
                      <Camera className="w-8 h-8 drop-shadow-lg" />
                      {camera.isLive && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-white"></div>
                      )}
                    </div>
                    
                    {/* Tooltip on hover */}
                    <div className={`absolute left-1/2 -translate-x-1/2 top-10 px-3 py-2 rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 ${
                      theme === 'dark' ? 'bg-[#1a2332] text-white border border-gray-700' : 'bg-white text-gray-900 border border-gray-300'
                    }`}>
                      <div className="text-sm">{camera.name}</div>
                      <div className="text-xs opacity-70">{camera.location}</div>
                    </div>
                  </div>
                );
              })}

              {/* Map legend */}
              <div className={`absolute bottom-4 left-4 px-4 py-3 rounded-lg shadow-lg ${
                theme === 'dark' ? 'bg-[#1a2332] border border-gray-700' : 'bg-white border border-gray-300'
              }`}>
                <div className={`text-sm mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Camera Status</div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-blue-500" />
                    <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Active Camera</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-gray-500" />
                    <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Inactive Camera</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default DashboardContent;