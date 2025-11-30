import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Hook to load booth markers with their glyph text from Markers_Core and Markers_Appearance tables.
 * Returns markers with id and glyph properties.
 *
 * @param {number} [selectedYear] - Optional year parameter to trigger reload when changed
 * @returns {{ markers: Array<{id: number, glyph: string}>, loading: boolean, error: Error | null }}
 */
export function useMarkerGlyphs(selectedYear) {
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadMarkers() {
      try {
        setLoading(true);
        setError(null);

        // Load core marker data (only booth markers with id < 1000)
        const { data: coreData, error: coreError } = await supabase
          .from('markers_core')
          .select('id')
          .lt('id', 1000)
          .order('id', { ascending: true });

        if (coreError) throw coreError;

        // Load appearance data (glyph text)
        const { data: appearanceData, error: appearanceError } = await supabase
          .from('markers_appearance')
          .select('id, glyph')
          .lt('id', 1000);

        if (appearanceError) throw appearanceError;

        // Create a map of glyph text by marker id
        const glyphMap = {};
        (appearanceData || []).forEach(row => {
          if (row && row.id) {
            glyphMap[row.id] = row.glyph || '';
          }
        });

        // Merge core and appearance data
        const mergedMarkers = (coreData || []).map(marker => ({
          id: marker.id,
          glyph: glyphMap[marker.id] || marker.id.toString() // Fallback to ID if no glyph
        }));

        setMarkers(mergedMarkers);
      } catch (err) {
        console.error('Error loading markers:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    loadMarkers();
  }, [selectedYear]); // Reload when selectedYear changes (if provided)

  return { markers, loading, error };
}
