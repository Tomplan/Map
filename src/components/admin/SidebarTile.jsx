import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '@mdi/react';
import PropTypes from 'prop-types';

/**
 * SidebarTile - Reusable tile component for admin sidebar navigation
 * Ensures consistent styling and width across all sidebar tiles
 *
 * @param {string} to - Navigation path (for Link variant)
 * @param {function} onClick - Click handler (for button variant)
 * @param {string} icon - MDI icon path
 * @param {string} label - Tile label text
 * @param {string|number} badge - Optional badge/count to display
 * @param {boolean} isActive - Whether this tile is currently active
 * @param {boolean} isCollapsed - Whether sidebar is in collapsed state (icon-only)
 * @param {string} ariaLabel - Optional aria-label for accessibility
 */
export default function SidebarTile({
  to,
  onClick,
  icon,
  label,
  badge,
  isActive = false,
  isCollapsed = false,
  ariaLabel
}) {
  // Handle collapsed state (icon-only, centered)
  if (isCollapsed) {
    const collapsedClasses = "flex items-center justify-center px-3 py-3 rounded-lg transition-colors";
    const collapsedStateClasses = isActive
      ? "bg-blue-50 text-blue-700 font-semibold"
      : "text-gray-700 hover:bg-gray-50";

    const collapsedClassName = `${collapsedClasses} ${collapsedStateClasses}`;

    const collapsedContent = (
      <Icon path={icon} size={1} />
    );

    if (to) {
      return (
        <Link
          to={to}
          className={collapsedClassName}
          title={label}
          aria-label={ariaLabel || label}
        >
          {collapsedContent}
        </Link>
      );
    }

    return (
      <button
        onClick={onClick}
        className={collapsedClassName}
        title={label}
        aria-label={ariaLabel || label}
      >
        {collapsedContent}
      </button>
    );
  }

  // Expanded state (full tile)
  const baseClasses = "flex items-center gap-3 px-4 w-full py-3 rounded-lg transition-colors border bg-white";
  const stateClasses = isActive
    ? "bg-blue-50 text-blue-700 font-semibold border-blue-200"
    : "text-gray-700 hover:bg-gray-50 border-gray-200";

  const className = `${baseClasses} ${stateClasses}`;

  const content = (
    <>
      <span className="flex-none w-5 h-5 flex items-center justify-center text-gray-600">
        <Icon path={icon} size={1.1} />
      </span>
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge !== null && (
        <div className="text-sm font-semibold text-gray-800">{badge}</div>
      )}
    </>
  );

  // If 'to' prop is provided, render as Link (navigation)
  if (to) {
    return (
      <Link
        to={to}
        className={className}
        aria-label={ariaLabel || label}
      >
        {content}
      </Link>
    );
  }

  // Otherwise render as button
  return (
    <button
      onClick={onClick}
      className={className}
      aria-label={ariaLabel || label}
    >
      {content}
    </button>
  );
}

SidebarTile.propTypes = {
  to: PropTypes.string,
  onClick: PropTypes.func,
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  badge: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  isActive: PropTypes.bool,
  isCollapsed: PropTypes.bool,
  ariaLabel: PropTypes.string,
};
