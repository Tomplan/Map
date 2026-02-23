import React, { createContext, useContext } from 'react';
import useFavorites from '../hooks/useFavorites';

const FavoritesContext = createContext(null);

/**
 * FavoritesProvider - Provides favorites context to all components
 */
export function FavoritesProvider({ selectedYear, children }) {
  const favoritesState = useFavorites(selectedYear);

  return <FavoritesContext.Provider value={favoritesState}>{children}</FavoritesContext.Provider>;
}

/**
 * useFavoritesContext - Hook to access favorites context
 */
export function useFavoritesContext() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavoritesContext must be used within FavoritesProvider');
  }
  return context;
}

/**
 * useOptionalFavoritesContext - Hook to access favorites context gracefully (returns null if not provided)
 */
export function useOptionalFavoritesContext() {
  return useContext(FavoritesContext);
}
