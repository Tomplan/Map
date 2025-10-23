import React, { useState } from 'react';

export default function BrandingSettings({ onChange }) {
  const [logo, setLogo] = useState('');
  const [themeColor, setThemeColor] = useState('#2d3748');
  const [fontFamily, setFontFamily] = useState('Montserrat, sans-serif');

  function handleLogoChange(e) {
    setLogo(e.target.value);
    onChange({ logo: e.target.value, themeColor, fontFamily });
  }
  function handleThemeColorChange(e) {
    setThemeColor(e.target.value);
    onChange({ logo, themeColor: e.target.value, fontFamily });
  }
  function handleFontFamilyChange(e) {
    setFontFamily(e.target.value);
    onChange({ logo, themeColor, fontFamily: e.target.value });
  }

  return (
    <form className="flex flex-col gap-4 p-4 bg-gray-100 rounded shadow-md max-w-md mx-auto" aria-label="Branding Settings">
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
