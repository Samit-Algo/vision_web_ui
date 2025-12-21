// Sidebar Component - Left navigation sidebar
import React from 'react';
import { Eye, Home, Camera, Bell, Settings, Users, BarChart3, PanelLeftClose, PanelLeft } from 'lucide-react';

function Sidebar({ isCollapsed, onToggle, theme }) {
  return (
    <div className={`${isCollapsed ? 'w-20' : 'w-64'} ${theme === 'dark' ? 'bg-[#1a2332] border-gray-800' : 'bg-white border-gray-200'} flex flex-col border-r transition-all duration-300`}>
      
      {/* Navigation menu items */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          
          {/* Dashboard menu item - Active state */}
          <li>
            <button className={`w-full flex items-center gap-3 px-4 py-3 text-white bg-[#3366ff] rounded-lg transition-colors`} title="Dashboard">
              <Home className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>Dashboard</span>}
            </button>
          </li>

          {/* Cameras menu item */}
          <li>
            <button className={`w-full flex items-center gap-3 px-4 py-3 ${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-[#0f1729]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'} rounded-lg transition-colors`} title="Cameras">
              <Camera className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>Cameras</span>}
            </button>
          </li>

          {/* Alerts menu item */}
          <li>
            <button className={`w-full flex items-center gap-3 px-4 py-3 ${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-[#0f1729]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'} rounded-lg transition-colors`} title="Alerts">
              <Bell className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>Alerts</span>}
            </button>
          </li>

          {/* Analytics menu item */}
          <li>
            <button className={`w-full flex items-center gap-3 px-4 py-3 ${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-[#0f1729]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'} rounded-lg transition-colors`} title="Analytics">
              <BarChart3 className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>Analytics</span>}
            </button>
          </li>

          {/* Agents menu item */}
          <li>
            <button className={`w-full flex items-center gap-3 px-4 py-3 ${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-[#0f1729]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'} rounded-lg transition-colors`} title="Agents">
              <Users className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>Agents</span>}
            </button>
          </li>

          {/* Settings menu item */}
          <li>
            <button className={`w-full flex items-center gap-3 px-4 py-3 ${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-[#0f1729]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'} rounded-lg transition-colors`} title="Settings">
              <Settings className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>Settings</span>}
            </button>
          </li>
        </ul>
      </nav>

      {/* Bottom section - Toggle button */}
      <div className={`p-4 border-t ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
        {/* Toggle collapse/expand button */}
        <button
          onClick={onToggle}
          className={`w-full flex items-center gap-3 px-4 py-3 ${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-[#0f1729]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'} rounded-lg transition-colors`}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <PanelLeft className="w-5 h-5 flex-shrink-0" />
          ) : (
            <>
              <PanelLeftClose className="w-5 h-5 flex-shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default Sidebar;