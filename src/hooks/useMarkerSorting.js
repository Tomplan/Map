import { useState, useMemo, useCallback } from 'react';

/**
 * Hook for managing marker sorting across multiple tabs
 *
 * @param {Array} markers - Array of marker objects
 * @param {string} activeTab - Currently active tab key
 * @returns {Object} { sortState, sortedMarkers, handleSort }
 */
export function useMarkerSorting(markers, activeTab) {
  const [sortState, setSortState] = useState({
    core: { column: 'id', direction: 'asc' },
    appearance: { column: 'id', direction: 'asc' },
    content: { column: 'id', direction: 'asc' },
    companies: { column: 'id', direction: 'asc' },
    eventSubscriptions: { column: 'id', direction: 'asc' },
    assignments: { column: 'id', direction: 'asc' },
  });

  // Handle sort change
  const handleSort = useCallback((tab, column) => {
    setSortState((prev) => {
      const current = prev[tab];
      // Toggle direction if same column, else default to asc
      const direction =
        current.column === column ? (current.direction === 'asc' ? 'desc' : 'asc') : 'asc';
      return { ...prev, [tab]: { column, direction } };
    });
  }, []);

  // Sort markers based on current tab and sort state
  const sortedMarkers = useMemo(() => {
    // Skip sorting for tabs that don't use markers
    if (
      activeTab === 'companies' ||
      activeTab === 'assignments' ||
      activeTab === 'eventSubscriptions'
    ) {
      return [];
    }

    const safeMarkers = markers || [];
    const { column, direction } = sortState[activeTab];

    return [...safeMarkers].sort((a, b) => {
      const va = a[column];
      const vb = b[column];

      // Handle null/undefined values
      if (va == null && vb == null) return 0;
      if (va == null) return direction === 'asc' ? -1 : 1;
      if (vb == null) return direction === 'asc' ? 1 : -1;

      // Numeric comparison
      if (typeof va === 'number' && typeof vb === 'number') {
        return direction === 'asc' ? va - vb : vb - va;
      }

      // String comparison with natural sort
      return direction === 'asc'
        ? String(va).localeCompare(String(vb), undefined, { numeric: true })
        : String(vb).localeCompare(String(va), undefined, { numeric: true });
    });
  }, [markers, activeTab, sortState]);

  return { sortState, sortedMarkers, handleSort };
}
