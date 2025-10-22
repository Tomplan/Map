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
      <label>
        Logo URL:
        <input type="url" value={logo} onChange={handleLogoChange} className="border rounded px-2 py-1 w-full" placeholder="https://..." />
      </label>
      <label>
        Theme Color:
        <input type="color" value={themeColor} onChange={handleThemeColorChange} className="w-16 h-8" />
      </label>
      <label>
        Font Family:
        <input type="text" value={fontFamily} onChange={handleFontFamilyChange} className="border rounded px-2 py-1 w-full" placeholder="e.g. Montserrat, sans-serif" />
      </label>
    </form>
  );
}
