import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@mdi/react';
import { mdiMagnify, mdiMapMarker, mdiFilterVariant } from '@mdi/js';
import { useOrganizationLogo } from '../contexts/OrganizationLogoContext';
import { getLogoWithFallback } from '../utils/getDefaultLogo';
import { useFavoritesContext } from '../contexts/FavoritesContext';
import FavoriteButton from './FavoriteButton';
import { useTranslation } from 'react-i18next';
import { getTranslatedInfo } from '../hooks/useTranslatedCompanyInfo';

/**
 * ExhibitorListView - List view of all exhibitors with favorites
 */
export default function ExhibitorListView({ markersState, selectedYear }) {
  const navigate = useNavigate();
  const { organizationLogo } = useOrganizationLogo();
  const { i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Favorites management from context
  const { favorites, isFavorite, toggleFavorite } = useFavoritesContext();

  // Filter markers: only show booth markers (id < 1000) with company assignments
  const exhibitors = useMemo(() => {
    return markersState
      .filter((marker) => marker.id < 1000 && marker.name) // Booth markers with companies
      .sort((a, b) => {
        // Sort by company name
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
  }, [markersState]);

  // Apply search and favorites filters
  const filteredExhibitors = useMemo(() => {
    let filtered = exhibitors;

    // Apply favorites filter
    if (showFavoritesOnly) {
      filtered = filtered.filter((exhibitor) =>
        exhibitor.companyId && isFavorite(exhibitor.companyId)
      );
    }

    // Apply search filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter((exhibitor) =>
        exhibitor.name?.toLowerCase().includes(lowerSearch) ||
        exhibitor.glyph?.toLowerCase().includes(lowerSearch)
      );
    }

    return filtered;
  }, [exhibitors, searchTerm, showFavoritesOnly, isFavorite]);

  const handleExhibitorClick = (markerId) => {
    // Navigate to map and focus on this marker (opens popup/bottom sheet)
    navigate(`/map?focus=${markerId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Exhibitors</h1>

          {/* Search Bar */}
          <div className="relative">
            <Icon
              path={mdiMagnify}
              size={1}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search exhibitors or booth number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          {/* Filters and Results Count */}
          <div className="mt-3 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {filteredExhibitors.length} of {exhibitors.length} exhibitors
              {favorites.length > 0 && ` • ${favorites.length} favorited`}
            </div>

            {/* Favorites Only Toggle */}
            {favorites.length > 0 && (
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  showFavoritesOnly
                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                <Icon path={mdiFilterVariant} size={0.7} />
                Favorites Only
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Exhibitor List */}
      <div className="max-w-screen-xl mx-auto px-4 py-4">
        {filteredExhibitors.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No exhibitors found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredExhibitors.map((exhibitor) => (
              <div
                key={exhibitor.id}
                onClick={() => handleExhibitorClick(exhibitor.id)}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer p-4"
              >
                <div className="flex items-center gap-4">
                  {/* Logo */}
                  <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200">
                    <img
                      src={getLogoWithFallback(exhibitor.logo, organizationLogo)}
                      alt={exhibitor.name}
                      className="max-w-full max-h-full object-contain p-2"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-gray-900 text-lg truncate">
                        {exhibitor.name}
                      </h3>

                      {/* Favorite Button */}
                      {exhibitor.companyId && (
                        <FavoriteButton
                          isFavorite={isFavorite(exhibitor.companyId)}
                          onToggle={() => toggleFavorite(exhibitor.companyId)}
                          size="md"
                          className="flex-shrink-0"
                        />
                      )}
                    </div>

                    {/* Booth Number */}
                    {exhibitor.glyph && (
                      <div className="flex items-center gap-1 mt-1">
                        <Icon path={mdiMapMarker} size={0.7} className="text-orange-600" />
                        <span className="text-sm font-medium text-orange-600">
                          Booth {exhibitor.glyph}
                        </span>
                      </div>
                    )}

                    {/* Category - Placeholder for Phase 5 */}
                    <div className="mt-2">
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        Coming Soon: Categories
                      </span>
                    </div>

                    {/* Info Preview */}
                    {(() => {
                      const translatedInfo = getTranslatedInfo(
                        exhibitor.company_translations,
                        i18n.language,
                        exhibitor.info
                      );
                      return translatedInfo ? (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {translatedInfo}
                        </p>
                      ) : null;
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Phase 3 Notice */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            📝 <strong>Note:</strong> Coming in future phases:
            <ul className="list-disc list-inside mt-2">
              <li>Category filtering</li>
              <li>Sort options</li>
            </ul>
          </p>
        </div>
      </div>
    </div>
  );
}
