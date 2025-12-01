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
  // use a fixed icon column (32px) so icon center lines up with collapsed state
  // (collapsed aside is 64px wide -> icon center at 32px). Using w-8 (32px)
  // keeps the visual center identical in both states when we preserve the
  // same left padding in expanded mode.
  iconClass = 'w-8 h-8',
  // default label classes so text appearance is consistent across tiles
  // include `text-left` so all tile labels are left-aligned by default
  labelClass = 'text-sm font-medium text-left',
  ariaLabel
}) {
  // Debug logging for badge changes
  React.useEffect(() => {
    console.log(`SidebarTile "${label}" - badge changed to:`, badge);
  }, [badge, label]);
  // Unified rendering: always mount label + badge so we can animate them
  // with transform and opacity without remounting nodes. This avoids
  // clipping/mount delay when toggling the sidebar and yields a smoother
  // animation. The container class will vary between collapsed and
  // expanded states but structure stays identical.
  const collapsedClasses = "relative flex items-center px-2 py-2 w-full rounded-lg transition-all duration-500 ease-in-out border no-underline";
  const collapsedStateClasses = isActive
    ? "bg-blue-50 text-gray-700 hover:text-gray-700 font-semibold border-blue-200"
    : "bg-white text-gray-700 hover:text-gray-700 hover:bg-gray-50 border-transparent";

  // Expanded tile base layout — px-2 keeps the icon column aligned with
  // collapsed center as described in earlier changes.
  const expandedBase = "flex items-center gap-3 px-2 w-full py-2 rounded-lg transition-all duration-500 ease-in-out border no-underline";
  const expandedStateClasses = isActive
    ? "bg-blue-50 text-gray-700 hover:text-gray-700 font-semibold border-blue-200"
    : "bg-white text-gray-700 hover:text-gray-700 hover:bg-gray-50 border-gray-200";

  const containerClass = isCollapsed
    ? `${collapsedClasses} ${collapsedStateClasses}`
    : `${expandedBase} ${expandedStateClasses}`;

  // Expanded state (full tile)
  // Keep px-4 on expanded tiles so the icon column sits 16px from the left
  // edge. With icon wrapper width of 32px (w-8), the icon center will be
  // at 16 + 16 = 32px which exactly matches the collapsed center for
  // the 64px collapsed sidebar.
  // Match the sidebar `nav` padding (p-2) so the icon column center matches
  // between collapsed (centered inside 64px aside less nav padding) and
  // expanded (tile with left padding). Using px-2 here gives the correct
  // 8px left offset so the icon center stays at 32px from the left edge.
  const baseClasses = "flex items-center gap-3 px-2 w-full py-3 rounded-lg transition-all duration-300 border bg-white";
  const stateClasses = isActive
    ? "bg-blue-50 text-blue-700 font-semibold border-blue-200"
    : "text-gray-700 hover:bg-gray-50 border-gray-200";

  // Icon always present. The label and badge remain mounted and are
  // animated between collapsed/expanded states with transform/opacity. When
  // collapsed the label is taken out of the flow (absolute) and hidden so
  // it doesn't affect layout; when expanded it behaves as a normal flex
  // child.
  const content = (
    <>
      <span className={`flex-none ${iconClass} flex items-center justify-center text-gray-600 transition-all duration-500 ease-in-out`}>
        <Icon path={icon} size={1} />
      </span>

      <span
        className={`${labelClass} ${isCollapsed ? 'absolute left-0 opacity-0 -translate-x-2 pointer-events-none' : 'flex-1 opacity-100 translate-x-0'}`}
      >
        {label}
      </span>

      {badge !== undefined && badge !== null && (
        <div className={`${isCollapsed ? 'opacity-0 pointer-events-none w-0' : 'text-sm font-semibold text-gray-800'}`}>{badge}</div>
      )}
    </>
  );

  // If 'to' prop is provided, render as Link (navigation)
  if (to) {
    return (
      <Link
        to={to}
        className={containerClass}
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
      className={containerClass}
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
  // optional overrides for per-tile fine tuning
  iconClass: PropTypes.string,
  labelClass: PropTypes.string,
};
