import React from 'react';
import PropTypes from 'prop-types';

export default function ArrivalStatusSlider({
  checked,
  onChange,
  disabled = false,
  showLabel = true,
  arrivedLabel = 'Arrived',
  notArrivedLabel = 'Not Arrived',
  className = '',
}) {
  const statusLabel = checked ? arrivedLabel : notArrivedLabel;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={statusLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        'inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs font-medium transition-colors',
        checked ? 'bg-green-50 text-green-800' : 'bg-gray-100 text-gray-600',
        disabled ? 'cursor-not-allowed opacity-60' : 'hover:bg-opacity-80',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      title={statusLabel}
    >
      {showLabel && <span>{statusLabel}</span>}
      <span
        className={[
          'relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors',
          checked ? 'bg-green-500' : 'bg-gray-300',
        ].join(' ')}
      >
        <span
          className={[
            'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform',
            checked ? 'translate-x-4' : 'translate-x-0.5',
          ].join(' ')}
        />
      </span>
    </button>
  );
}

ArrivalStatusSlider.propTypes = {
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  showLabel: PropTypes.bool,
  arrivedLabel: PropTypes.string,
  notArrivedLabel: PropTypes.string,
  className: PropTypes.string,
};
