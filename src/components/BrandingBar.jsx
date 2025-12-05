import React from 'react';
import LanguageToggle from './LanguageToggle';
import { getLogoPath } from '../utils/getLogoPath';

export default function BrandingBar({ logo, themeColor, fontFamily, eventName }) {
  // Match dashboard/zoom button style
  const bgColor = themeColor || '#fff';
  const borderColor = '#1976d2';
  const textColor = '#1976d2';
  return (
    <div
      className="flex items-center justify-center gap-3 shadow rounded-full"
      style={{
        position: 'fixed',
        bottom: 5,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 900,
        background: bgColor,
        border: `2px solid ${borderColor}`,
        padding: '0.1rem 0.5rem',
        minHeight: 20,
        minWidth: 0,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        fontFamily: fontFamily || 'inherit',
        width: 'auto',
        maxWidth: '90vw',
        opacity: 0.85,
      }}
      aria-label="Event Branding"
    >
      {logo && (
        <img
          src={getLogoPath(logo)}
          alt="Event Logo"
          style={{ height: 20, width: 20, objectFit: 'contain', marginRight: 2 }}
        />
      )}
      <span style={{ fontWeight: 300, fontSize: 12, color: textColor, whiteSpace: 'nowrap' }}>
        {eventName || 'Event Map'}
      </span>
    </div>
  );
}
