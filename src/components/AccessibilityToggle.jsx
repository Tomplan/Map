import React, { useState } from 'react';

export default function AccessibilityToggle() {
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);

  React.useEffect(() => {
    document.body.classList.toggle('high-contrast', highContrast);
    document.body.classList.toggle('large-text', largeText);
  }, [highContrast, largeText]);

  return (
    <div className="flex gap-4 my-4" role="group" aria-label="Accessibility options">
      <button
        aria-pressed={highContrast}
        aria-label={highContrast ? 'Disable high contrast mode' : 'Enable high contrast mode'}
        onClick={() => setHighContrast((v) => !v)}
        className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
        tabIndex={0}
      >
        {highContrast ? 'Disable' : 'Enable'} High Contrast
      </button>
      <button
        aria-pressed={largeText}
        aria-label={largeText ? 'Switch to normal text size' : 'Switch to large text size'}
        onClick={() => setLargeText((v) => !v)}
        className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
        tabIndex={0}
      >
        {largeText ? 'Normal Text' : 'Large Text'}
      </button>
    </div>
  );
}
