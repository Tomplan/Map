import React, { useState, useEffect } from 'react';
import { getLogoPath } from '../utils/getLogoPath';

export default function BrandingSettings({ onChange, initialValues }) {
  const [logo, setLogo] = useState(
    initialValues?.logo || `${import.meta.env.BASE_URL}assets/logos/4x4Vakantiebeurs.png`,
  );
  const [themeColor, setThemeColor] = useState(initialValues?.themeColor || '#ffffff');
  const [fontFamily, setFontFamily] = useState(initialValues?.fontFamily || 'Arvo, Sans-serif');
  const [eventName, setEventName] = useState(initialValues?.eventName || '4x4 Vakantiebeurs');

  // Sync local state with initialValues (for live updates)
  useEffect(() => {
    if (initialValues) {
      setLogo(initialValues.logo || `${import.meta.env.BASE_URL}assets/logos/4x4Vakantiebeurs.png`);
      setThemeColor(initialValues.themeColor || '#ffffff');
      setFontFamily(initialValues.fontFamily || 'Arvo, Sans-serif');
      setEventName(initialValues.eventName || '4x4 Vakantiebeurs');
    }
  }, [initialValues]);

  function handleLogoChange(e) {
    setLogo(e.target.value);
    onChange({ id: 1, logo: e.target.value, themeColor, fontFamily, eventName });
  }
  function handleThemeColorChange(e) {
    setThemeColor(e.target.value);
    onChange({ id: 1, logo, themeColor: e.target.value, fontFamily, eventName });
  }
  function handleFontFamilyChange(e) {
    setFontFamily(e.target.value);
    onChange({ id: 1, logo, themeColor, fontFamily: e.target.value, eventName });
  }
  function handleEventNameChange(e) {
    setEventName(e.target.value);
    onChange({ id: 1, logo, themeColor, fontFamily, eventName: e.target.value });
  }

  return (
    <form
      className="flex flex-col gap-4 p-4 bg-gray-100 rounded shadow-md w-full"
      aria-label="Branding Settings"
      style={{ marginTop: '0px' }}
    >
      {/* Removed Event Name label, just show input */}
      {/* <input id="event-name" type="text" value={eventName} onChange={handleEventNameChange} className="border rounded px-2 py-1 w-full mb-4" placeholder="Event Name" /> */}
      <div
        className="flex items-center justify-center w-full"
        style={{
          position: 'relative',
          margin: '0 auto',
          width: '100%',
          background: '#fff',
          borderRadius: 16,
          border: '2px solid #2563eb',
          boxShadow: '0 2px 8px rgba(37,99,235,0.08)',
          padding: '10px 10px',
          color: '#2563eb',
        }}
      >
        {/* Logo and Event Name on one line */}
        <div className="flex items-center w-full" style={{ gap: 10 }}>
          {logo && (
            <img
              src={getLogoPath(logo)}
              alt="Logo"
              style={{
                height: 44,
                width: 44,
                objectFit: 'contain',
                borderRadius: 8,
                border: '1px solid #2563eb',
                background: '#fff',
                marginRight: 2,
              }}
            />
          )}
          <input
            type="text"
            value={eventName}
            onChange={handleEventNameChange}
            className="px-3 py-2 rounded border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-bold flex-grow"
            style={{ color: '#2563eb', background: '#f8fafc', minWidth: 180, maxWidth: 550 }}
            placeholder="Event Name"
          />
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <input
              type="text"
              value={logo}
              onChange={handleLogoChange}
              className="px-3 py-2 rounded border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-bold flex-grow"
              style={{ color: '#2563eb', background: '#f8fafc', minWidth: 180, maxWidth: 560 }}
              placeholder="Logo URL"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
