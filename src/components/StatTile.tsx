// Stat Tile Component - Displays a single statistic card
import React from 'react';

function StatTile({ label, value, subtitle, subtitleColor, icon: Icon, color, theme }) {
  // Color mapping for border and icons
  const borderColorClasses = {
    blue: 'border-l-blue-500',
    green: 'border-l-green-500',
    purple: 'border-l-purple-500',
    red: 'border-l-red-500',
  };

  const iconColorClasses = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    purple: 'text-purple-500',
    red: 'text-red-500',
  };

  const subtitleColorClasses = {
    green: 'text-green-500',
    red: 'text-red-500',
    blue: 'text-blue-500',
    purple: 'text-purple-500',
  };

  return (
    <div 
      className={`p-4 rounded-lg border-l-4 ${borderColorClasses[color]} ${
        theme === 'dark' 
          ? 'bg-[#1a2332] border-t border-r border-b border-gray-800' 
          : 'bg-white border-t border-r border-b border-gray-200'
      }`}
    >
      {/* Top section with label and icon */}
      <div className="flex justify-between items-start mb-3">
        <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          {label}
        </div>
        <Icon className={`w-4 h-4 ${iconColorClasses[color]}`} />
      </div>

      {/* Value - Large number */}
      <div className={`text-2xl mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
        {value}
      </div>

      {/* Subtitle - Additional info */}
      <div className={`text-xs ${subtitleColorClasses[subtitleColor]}`}>
        {subtitle}
      </div>
    </div>
  );
}

export default StatTile;