import { useState, useCallback } from 'react';

/**
 * useFavorites - Manage favorite exhibitors in session memory only
 * No persistence - favorites cleared when page is closed (perfect for one-day events)
 *
 * @param {number} selectedYear - Current event year (for consistency)
 * @returns {Object} Favorites state and actions
 */
export default function useFavorites(selectedYear) {
  // Session-only favorites (no localStorage!)
  const [favorites, setFavorites] = useState([]);

  // Check if a company is favorited
  const isFavorite = useCallback(
    (companyId) => {
      return favorites.includes(companyId);
    },
    [favorites],
  );

  // Toggle favorite status
  const toggleFavorite = useCallback((companyId) => {
    setFavorites((prev) => {
      if (prev.includes(companyId)) {
        // Remove from favorites
        return prev.filter((id) => id !== companyId);
      } else {
        // Add to favorites
        return [...prev, companyId];
      }
    });
  }, []);

  // Add to favorites
  const addFavorite = useCallback((companyId) => {
    setFavorites((prev) => {
      if (!prev.includes(companyId)) {
        return [...prev, companyId];
      }
      return prev;
    });
  }, []);

  // Remove from favorites
  const removeFavorite = useCallback((companyId) => {
    setFavorites((prev) => prev.filter((id) => id !== companyId));
  }, []);

  // Clear all favorites
  const clearAllFavorites = useCallback(() => {
    setFavorites([]);
  }, []);

  return {
    favorites, // Array of company IDs
    isFavorite, // (companyId) => boolean
    toggleFavorite, // (companyId) => void
    addFavorite, // (companyId) => void
    removeFavorite, // (companyId) => void
    clearAllFavorites, // () => void
  };
}
