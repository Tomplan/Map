import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Icon from '@mdi/react';
import { mdiInformationOutline } from '@mdi/js';

/**
 * Tooltip Component
 * 
 * Displays contextual help on hover or click.
 * Can be used inline or as a floating tooltip.
 * 
 * @param {string} content - Tooltip text content
 * @param {string} position - Tooltip position: 'top' | 'bottom' | 'left' | 'right'
 * @param {node} children - Optional custom trigger element (defaults to info icon)
 * @param {string} trigger - 'hover' | 'click' | 'both'
 */
export default function Tooltip({ 
  content, 
  position = 'top',
  children,
  trigger = 'hover',
  className = ''
}) {
  const [isVisible, setIsVisible] = useState(false);

  const showTooltip = () => setIsVisible(true);
  const hideTooltip = () => setIsVisible(false);
  const toggleTooltip = () => setIsVisible(!isVisible);

  // Position classes
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  // Arrow classes
  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-800',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-800',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-800',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-800'
  };

  // Event handlers based on trigger type
  const getEventHandlers = () => {
    if (trigger === 'hover') {
      return {
        onMouseEnter: showTooltip,
        onMouseLeave: hideTooltip,
        onFocus: showTooltip,
        onBlur: hideTooltip
      };
    }
    if (trigger === 'click') {
      return {
        onClick: toggleTooltip
      };
    }
    if (trigger === 'both') {
      return {
        onMouseEnter: showTooltip,
        onMouseLeave: hideTooltip,
        onClick: toggleTooltip,
        onFocus: showTooltip,
        onBlur: hideTooltip
      };
    }
    return {};
  };

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      {/* Trigger Element */}
      <div
        {...getEventHandlers()}
        className="cursor-help"
        role="button"
        tabIndex={0}
        aria-label="Show tooltip"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleTooltip();
          }
        }}
      >
        {children || (
          <Icon 
            path={mdiInformationOutline} 
            size={0.7} 
            className="text-blue-500 hover:text-blue-600 transition-colors"
          />
        )}
      </div>

      {/* Tooltip Content */}
      {isVisible && (
        <div
          className={`absolute z-50 ${positionClasses[position]} pointer-events-none`}
          role="tooltip"
        >
          <div className="bg-gray-800 text-white text-sm rounded-lg px-3 py-2 shadow-lg max-w-xs whitespace-normal">
            {content}
            {/* Arrow */}
            <div 
              className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`}
            />
          </div>
        </div>
      )}

      {/* Click-outside handler for click trigger */}
      {isVisible && trigger !== 'hover' && (
        <div
          className="fixed inset-0 z-40"
          onClick={hideTooltip}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

Tooltip.propTypes = {
  content: PropTypes.string.isRequired,
  position: PropTypes.oneOf(['top', 'bottom', 'left', 'right']),
  children: PropTypes.node,
  trigger: PropTypes.oneOf(['hover', 'click', 'both']),
  className: PropTypes.string,
};

/**
 * IconWithTooltip - Convenience component for common use case
 * Shows info icon with tooltip on hover
 */
export function IconWithTooltip({ content, position = 'top', iconSize = 0.7 }) {
  return (
    <Tooltip content={content} position={position}>
      <Icon 
        path={mdiInformationOutline} 
        size={iconSize} 
        className="text-blue-500 hover:text-blue-600 transition-colors"
      />
    </Tooltip>
  );
}

IconWithTooltip.propTypes = {
  content: PropTypes.string.isRequired,
  position: PropTypes.oneOf(['top', 'bottom', 'left', 'right']),
  iconSize: PropTypes.number,
};
