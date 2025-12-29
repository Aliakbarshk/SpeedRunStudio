import React from 'react';

export const RunningLogo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="SpeedRun Studio Logo"
    >
      {/* Speed Lines - Dynamic Opacity */}
      <g className="animate-pulse">
        <path d="M5 50H15" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-40" />
        <path d="M2 65H10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-20" />
        <path d="M8 35H18" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-60" />
      </g>

      {/* Main Character Group - Tilted forward for momentum */}
      <g transform="rotate(8, 50, 50)">
        {/* The Monitor/Body */}
        <rect 
          x="22" y="22" width="56" height="40" rx="10" 
          stroke="currentColor" strokeWidth="6" 
          fill="currentColor" fillOpacity="0" 
        />
        
        {/* Play Button Face */}
        <path 
          d="M44 32 L60 42 L44 52 V32 Z" 
          fill="currentColor" 
        />

        {/* Dynamic Legs */}
        {/* Back Leg (Left) - Kicking back */}
        <path 
          d="M35 62 C 35 72 25 75 15 70" 
          stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"
        />
        
        {/* Front Leg (Right) - High knee, foot planted forward */}
        <path 
          d="M65 62 C 65 75 70 75 80 85" 
          stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"
        />
      </g>
    </svg>
  );
};
