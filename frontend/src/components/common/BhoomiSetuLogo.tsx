import React from 'react';

export interface BhoomiSetuLogoProps {
  size?: number | string;
  variant?: 'badge' | 'color' | 'white';
  className?: string;
  style?: React.CSSProperties;
}

export const BhoomiSetuLogo: React.FC<BhoomiSetuLogoProps> = ({
  size = 40,
  variant = 'badge',
  className = '',
  style = {}
}) => {
  const pixelSize = typeof size === 'number' ? `${size}px` : size;

  if (variant === 'white') {
    return (
      <svg
        width={pixelSize}
        height={pixelSize}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
        aria-label="BhoomiSetu Logo"
      >
        {/* Outer squircle border */}
        <rect x="5" y="5" width="90" height="90" rx="22" stroke="#ffffff" strokeWidth="2.5" strokeOpacity="0.8" fill="rgba(255, 255, 255, 0.08)" />

        {/* Cadastral land plots (Bhoomi) */}
        <path d="M14 68 L36 60 L46 66 L20 78 Z" fill="#ffffff" fillOpacity="0.35" />
        <path d="M54 66 L64 60 L86 68 L76 78 Z" fill="#ffffff" fillOpacity="0.35" />
        <path d="M24 76 L50 67 L76 76 L50 86 Z" fill="#ffffff" fillOpacity="0.65" />
        <path d="M50 67 L50 86" stroke="#ffffff" strokeWidth="1.2" strokeDasharray="2 1.5" strokeOpacity="0.9" />

        {/* Bridge roadway */}
        <path d="M14 62 Q50 56 86 62" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.9" />

        {/* Main suspension arch (Setu) */}
        <path d="M18 62 C26 36 74 36 82 62" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" />

        {/* Suspension vertical pillars */}
        <line x1="32" y1="45" x2="32" y2="59.5" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.75" />
        <line x1="41" y1="39.5" x2="41" y2="58" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.75" />
        <line x1="50" y1="38" x2="50" y2="57.5" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.75" />
        <line x1="59" y1="39.5" x2="59" y2="58" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.75" />
        <line x1="68" y1="45" x2="68" y2="59.5" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.75" />

        {/* Keystone node / GIS beacon */}
        <circle cx="50" cy="25" r="7.5" fill="#ffffff" />
        <circle cx="50" cy="25" r="3" fill="#0a2540" />

        {/* Coordinate crosshairs */}
        <line x1="50" y1="13" x2="50" y2="16" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.8" />
        <line x1="50" y1="34" x2="50" y2="37" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.8" />
        <line x1="38" y1="25" x2="41" y2="25" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.8" />
        <line x1="59" y1="25" x2="62" y2="25" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.8" />
      </svg>
    );
  }

  // Full Color Badge / Icon
  return (
    <svg
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      aria-label="BhoomiSetu Logo"
    >
      <defs>
        <linearGradient id="bs_bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0a2540" />
          <stop offset="100%" stopColor="#051626" />
        </linearGradient>
        <linearGradient id="bs_bridge" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0066cc" />
          <stop offset="50%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
        <linearGradient id="bs_land1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <linearGradient id="bs_land2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="bs_gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>

      {/* Modern Badge Shield */}
      <rect x="4" y="4" width="92" height="92" rx="22" fill="url(#bs_bg)" />
      <rect x="5" y="5" width="90" height="90" rx="21" stroke="#38bdf8" strokeOpacity="0.3" strokeWidth="1.5" />

      {/* Cadastral Land Plots (Bhoomi) */}
      <path d="M14 68 L36 60 L46 66 L20 78 Z" fill="url(#bs_land2)" opacity="0.85" />
      <path d="M54 66 L64 60 L86 68 L76 78 Z" fill="url(#bs_land2)" opacity="0.85" />

      <path d="M24 76 L50 67 L76 76 L50 86 Z" fill="url(#bs_land1)" />
      <path d="M24 76 L50 67 L50 86 Z" fill="#047857" opacity="0.3" />
      <path d="M50 67 L50 86" stroke="#ffffff" strokeWidth="1.2" strokeDasharray="2 1.5" opacity="0.7" />

      {/* The Bridge Arch (Setu) */}
      <path d="M14 62 Q50 56 86 62" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
      <path d="M14 62 Q50 56 86 62" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />

      <path d="M18 62 C26 36 74 36 82 62" stroke="url(#bs_bridge)" strokeWidth="4.5" strokeLinecap="round" />

      {/* Suspension Cables */}
      <line x1="32" y1="45" x2="32" y2="59.5" stroke="#93c5fd" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
      <line x1="41" y1="39.5" x2="41" y2="58" stroke="#93c5fd" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
      <line x1="50" y1="38" x2="50" y2="57.5" stroke="#93c5fd" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
      <line x1="59" y1="39.5" x2="59" y2="58" stroke="#93c5fd" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
      <line x1="68" y1="45" x2="68" y2="59.5" stroke="#93c5fd" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />

      {/* Central Keystone / GIS Geospatial Marker Node (Saffron/Gold) */}
      <circle cx="50" cy="25" r="7.5" fill="url(#bs_gold)" />
      <circle cx="50" cy="25" r="3.5" fill="#ffffff" />

      {/* Subtle GIS Coordinate Crosshairs */}
      <line x1="50" y1="13" x2="50" y2="16" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="50" y1="34" x2="50" y2="37" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="38" y1="25" x2="41" y2="25" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="59" y1="25" x2="62" y2="25" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
};

export default BhoomiSetuLogo;
