import { useState, useEffect, useCallback } from 'react';

/**
 * useFavorites - Manage favorite exhibitors in localStorage
 * Stores favorites per event year
 *
 * @param {number} selectedYear - Current event year
 * @returns {Object} Favorites state and actions
 */
export default function useFavorites(selectedYear) {
  const STORAGE_KEY = `event_favorites_${selectedYear}`;

  // Initialize favorites from localStorage
  const [favorites, setFavorites] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading favorites from localStorage:', error);
      return [];
    }
  });

  // Persist to localStorage whenever favorites change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch (error) {
      console.error('Error saving favorites to localStorage:', error);
    }
  }, [favorites, STORAGE_KEY]);

  // Check if a company is favorited
  const isFavorite = useCallback(
    (companyId) => {
      return favorites.includes(companyId);
    },
    [favorites]
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
    favorites,           // Array of company IDs
    isFavorite,          // (companyId) => boolean
    toggleFavorite,      // (companyId) => void
    addFavorite,         // (companyId) => void
    removeFavorite,      // (companyId) => void
    clearAllFavorites,   // () => void
  };
}
