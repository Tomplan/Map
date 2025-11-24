import React from 'react';

/**
 * Small badge component to indicate whether a feature is "Global" (applies to all years)
 * or "Event-specific" (changes when the admin switches the year).
 */
export default function YearScopeBadge({ scope = 'global' }) {
  const label = scope === 'global' ? 'Global (all years)' : 'Event-specific (changes with year)';
  const color = scope === 'global' ? 'bg-green-100 text-green-800' : 'bg-blue-50 text-blue-800';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color} border border-transparent`} aria-hidden>
      {label}
    </span>
  );
}
