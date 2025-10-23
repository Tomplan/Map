
import React, { useState, useEffect } from 'react';

export default function BrandingSettings({ onChange, initialValues }) {
  const [logo, setLogo] = useState(initialValues?.logo || '');
  const [themeColor, setThemeColor] = useState(initialValues?.themeColor || '#2d3748');
  const [fontFamily, setFontFamily] = useState(initialValues?.fontFamily || 'Montserrat, sans-serif');
  const [eventName, setEventName] = useState(initialValues?.eventName || 'Event Map');

  // Sync local state with initialValues (for live updates)
  useEffect(() => {
    if (initialValues) {
      setLogo(initialValues.logo || '');
      setThemeColor(initialValues.themeColor || '#2d3748');
      setFontFamily(initialValues.fontFamily || 'Montserrat, sans-serif');
      setEventName(initialValues.eventName || 'Event Map');
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
    <form className="flex flex-col gap-4 p-4 bg-gray-100 rounded shadow-md max-w-md mx-auto" aria-label="Branding Settings" style={{ marginTop: '64px' }}>
      <label htmlFor="event-name" className="font-bold flex items-center gap-3">
        <span style={{ border: '1px solid #ccc', padding: '2px 6px', borderRadius: '4px', background: '#fff', color: '#222' }}>Event Name:</span>
        <input id="event-name" type="text" value={eventName} onChange={handleEventNameChange} className="border rounded px-2 py-1 w-full" placeholder="Event Map" />
      </label>
      <label htmlFor="logo-url" className="font-bold flex items-center gap-3">
        <span style={{ border: '1px solid #ccc', padding: '2px 6px', borderRadius: '4px', background: '#fff', color: '#222' }}>Logo URL:</span>
        <input id="logo-url" type="url" value={logo} onChange={handleLogoChange} className="border rounded px-2 py-1 w-full" placeholder="https://..." />
      </label>
      <label htmlFor="theme-color" className="font-bold flex items-center gap-3">
        <span style={{ border: '1px solid #ccc', padding: '2px 6px', borderRadius: '4px', background: '#fff', color: '#222' }}>Theme Color:</span>
        <input id="theme-color" type="color" value={themeColor} onChange={handleThemeColorChange} className="w-16 h-8 border border-gray-400 rounded" />
        <span className="ml-2 text-xs font-mono px-2 py-1 rounded bg-gray-200 border border-gray-300" style={{ color: '#222' }}>{themeColor}</span>
      </label>
      <label htmlFor="font-family" className="font-bold flex items-center gap-3">
        <span style={{ border: '1px solid #ccc', padding: '2px 6px', borderRadius: '4px', background: '#fff', color: '#222' }}>Font Family:</span>
        <input id="font-family" type="text" value={fontFamily} onChange={handleFontFamilyChange} className="border rounded px-2 py-1 w-full" placeholder="e.g. Montserrat, sans-serif" />
      </label>
    </form>
  );
}
