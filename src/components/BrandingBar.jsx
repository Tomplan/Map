import React from 'react';

export default function BrandingBar({ logo, themeColor, fontFamily }) {
  return (
    <header
      className="w-full flex items-center justify-between px-4 py-2 shadow-md"
      style={{
        background: themeColor || '#1a202c',
        fontFamily: fontFamily || 'inherit',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 3000,
        width: '100%'
      }}
      aria-label="Event Branding"
    >
      {logo && (
        <img src={logo} alt="Event Logo" className="h-10 w-auto mr-4" />
      )}
      <span className="text-xl font-bold text-white">Event Map</span>
    </header>
  );
}
