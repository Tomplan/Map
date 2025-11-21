import React from 'react';
import PropTypes from 'prop-types';
import Icon from '@mdi/react';
import { mdiStar, mdiStarOutline } from '@mdi/js';

/**
 * FavoriteButton - Reusable button for toggling favorite status
 *
 * @param {boolean} isFavorite - Whether item is currently favorited
 * @param {function} onToggle - Callback when favorite is toggled
 * @param {string} size - Icon size (sm, md, lg)
 * @param {string} className - Additional CSS classes
 */
export default function FavoriteButton({
  isFavorite,
  onToggle,
  size = 'md',
  className = '',
}) {
  const sizeMap = {
    sm: 0.8,
    md: 1,
    lg: 1.2,
  };

  const iconSize = sizeMap[size] || sizeMap.md;

  const handleClick = (e) => {
    e.stopPropagation(); // Prevent parent click events
    e.preventDefault();
    onToggle();
  };

  return (
    <button
      onClick={handleClick}
      className={`transition-all ${
        isFavorite
          ? 'text-yellow-500 hover:text-yellow-600'
          : 'text-gray-400 hover:text-yellow-500'
      } ${className}`}
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Icon
        path={isFavorite ? mdiStar : mdiStarOutline}
        size={iconSize}
        className="drop-shadow-sm"
      />
    </button>
  );
}

FavoriteButton.propTypes = {
  isFavorite: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
};

FavoriteButton.defaultProps = {
  size: 'md',
  className: '',
};
