import React, { useState } from 'react';

export default function AccessibilityToggle() {
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);

  React.useEffect(() => {
    document.body.classList.toggle('high-contrast', highContrast);
    document.body.classList.toggle('large-text', largeText);
  }, [highContrast, largeText]);

  return (
    <div className="flex gap-4 my-4">
      <button
        aria-pressed={highContrast}
        onClick={() => setHighContrast((v) => !v)}
        className="px-3 py-2 border rounded"
      >
        {highContrast ? 'Disable' : 'Enable'} High Contrast
      </button>
      <button
        aria-pressed={largeText}
        onClick={() => setLargeText((v) => !v)}
        className="px-3 py-2 border rounded"
      >
        {largeText ? 'Normal Text' : 'Large Text'}
      </button>
    </div>
  );
}
