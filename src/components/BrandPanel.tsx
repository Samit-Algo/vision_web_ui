// BrandPanel Component - The blue left side panel with branding
import React from 'react';
import { Eye } from 'lucide-react';

function BrandPanel() {
  return (
    <div className="bg-gradient-to-br from-[#4d8dff] via-[#3366ff] to-[#7d9cff] p-12 md:w-1/2 flex flex-col justify-between relative overflow-hidden">
      
      {/* Decorative background circle */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3"></div>
      
      {/* Main content container - centered vertically */}
      <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10">
        
        {/* Eye icon in a white circle */}
        <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center mb-6">
          <Eye className="w-10 h-10 text-[#3366ff]" strokeWidth={2} />
        </div>
        
        {/* Brand name */}
        <h1 className="text-white text-4xl mb-2">AI ORA</h1>
        
        {/* Tagline */}
        <p className="text-white/90 text-xl mb-8">Your Vision Copilot</p>
        
        {/* Description text */}
        <p className="text-white/80 text-sm max-w-sm leading-relaxed">
          Monitor what matters. Create intelligent agents that watch, learn, and alert you in real-time. Your security, reimagined.
        </p>
      </div>
      
      {/* Bottom links */}
      <div className="flex justify-center gap-8 text-white/90 text-sm relative z-10">
        <button className="hover:text-white transition-colors">
          Get help
        </button>
        <button className="hover:text-white transition-colors">
          Explore features
        </button>
      </div>
    </div>
  );
}

export default BrandPanel;
