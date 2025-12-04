import React from 'react';
import PropTypes from 'prop-types';
import Icon from '@mdi/react';
import { mdiStar } from '@mdi/js';

/**
 * FavoritesFilterButton - Map control button to filter favorites
 * Positioned in top-left corner, below the search control
 *
 * Visual Requirements:
 * - 44x44px circular button
 * - Active: Yellow background (#fef3c7), yellow star icon
 * - Inactive: White background, gray star icon
 * - Matches ExhibitorListView yellow active state
 */
export default function FavoritesFilterButton({ isActive, onClick, favoritesCount, isAdminView }) {
  return (
    <button
      onClick={onClick}
      className={`
        rounded-full shadow-md
        flex items-center justify-center
        transition-all duration-200
        ${
          isActive
            ? 'bg-yellow-100 border-2 border-yellow-300'
            : 'bg-white border-2 border-transparent hover:bg-gray-50'
        }
      `}
      style={{
        position: 'absolute',
        top: isAdminView ? '110px' : '60px', // Search control height (44px) + gap (10px) + top margin (10px)
        left: '10px',
        zIndex: 1002,
        width: '44px',
        height: '44px',
      }}
      title={
        isActive
          ? `Showing ${favoritesCount} favorite${favoritesCount !== 1 ? 's' : ''} only`
          : `Show ${favoritesCount} favorite${favoritesCount !== 1 ? 's' : ''} only`
      }
      aria-label={isActive ? 'Show all exhibitors' : 'Show favorites only'}
      aria-pressed={isActive}
    >
      <Icon path={mdiStar} size={1} className={isActive ? 'text-yellow-600' : 'text-gray-400'} />
    </button>
  );
}

FavoritesFilterButton.propTypes = {
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  favoritesCount: PropTypes.number.isRequired,
};
