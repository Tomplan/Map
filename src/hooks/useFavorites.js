import { useState, useCallback, useEffect, useRef } from 'react';

const STORAGE_KEY_PREFIX = 'favorites_';

/**
 * useFavorites - Manage favorite exhibitors
 * Persists favorites to localStorage so they survive navigation and page refreshes.
 *
 * @param {number} selectedYear - Current event year (for consistency)
 * @returns {Object} Favorites state and actions
 */
export default function useFavorites(selectedYear) {
  // Track which year the current `favorites` state belongs to.
  // We initialize it with selectedYear because the useState initializer below 
  // loads the correct data for this year immediately.
  const favoritesYearRef = useRef(selectedYear);
  
  // Initialize state from localStorage if available
  const [favorites, setFavorites] = useState(() => {
    try {
      const key = `${STORAGE_KEY_PREFIX}${selectedYear}`;
      const stored = localStorage.getItem(key);
      favoritesYearRef.current = selectedYear;
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading favorites from localStorage:', error);
      return [];
    }
  });

  // Sync to localStorage whenever favorites change
  // DEFINED FIRST so it runs before the Load effect updates the ref
  useEffect(() => {
    // If the data in `favorites` belongs to a different year than what is selected,
    // do NOT save. We are in a transition state (waiting for Load effect).
    if (favoritesYearRef.current !== selectedYear) {
      return; 
    }

    try {
      const key = `${STORAGE_KEY_PREFIX}${selectedYear}`;
      localStorage.setItem(key, JSON.stringify(favorites));
    } catch (error) {
      console.error('Error saving favorites to localStorage:', error);
    }
  }, [favorites, selectedYear]);

  // Re-load from storage when year changes
  // DEFINED SECOND
  useEffect(() => {
    // If year hasn't changed from what we have loaded, do nothing
    if (favoritesYearRef.current === selectedYear) return;

    try {
      const key = `${STORAGE_KEY_PREFIX}${selectedYear}`;
      const stored = localStorage.getItem(key);
      const newFavorites = stored ? JSON.parse(stored) : [];
      
      setFavorites(newFavorites);
      // Now that we've scheduled the update, mark the ref as matching this year
      favoritesYearRef.current = selectedYear;
    } catch (error) {
       console.error('Error reloading favorites for new year:', error);
       setFavorites([]);
       favoritesYearRef.current = selectedYear;
    }
  }, [selectedYear]);

  // Check if a company is favorited
  const isFavorite = useCallback(
    (companyId) => {
      // Ensure specific type is handled if needed, but companyId usually string/number
      return favorites.includes(companyId);
    },
    [favorites],
  );

  // Toggle favorite status
  const toggleFavorite = useCallback((companyId) => {
    setFavorites((prev) => {
      if (prev.includes(companyId)) {
        return prev.filter((id) => id !== companyId);
      } else {
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
