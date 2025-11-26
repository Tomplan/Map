import React, { createContext, useContext } from 'react';
import useUserPreferences from '../hooks/useUserPreferences';

const PreferencesContext = createContext(null);

/**
 * PreferencesProvider - Single source of truth for user preferences
 *
 * Wraps the app and provides preference state and update functions to all components.
 * This ensures only ONE instance of useUserPreferences hook exists (one subscription).
 */
export function PreferencesProvider({ children }) {
  const { preferences, loading, updatePreference, updatePreferences } = useUserPreferences();

  return (
    <PreferencesContext.Provider value={{ preferences, loading, updatePreference, updatePreferences }}>
      {children}
    </PreferencesContext.Provider>
  );
}

/**
 * usePreferences - Hook to access preferences context
 *
 * Use this in components instead of calling useUserPreferences() directly.
 * This ensures only one database subscription exists.
 */
export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
