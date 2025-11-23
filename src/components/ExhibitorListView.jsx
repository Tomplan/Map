import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@mdi/react';
import { mdiMagnify, mdiMapMarker, mdiFilterVariant, mdiChevronUp, mdiChevronDown } from '@mdi/js';
import { useOrganizationLogo } from '../contexts/OrganizationLogoContext';
import { getLogoWithFallback } from '../utils/getDefaultLogo';
import { useFavoritesContext } from '../contexts/FavoritesContext';
import FavoriteButton from './FavoriteButton';
import { useTranslation } from 'react-i18next';
import { getTranslatedInfo } from '../hooks/useTranslatedCompanyInfo';

export default function ExhibitorListView({ markersState, selectedYear }) {
  const navigate = useNavigate();
  const { organizationLogo } = useOrganizationLogo();
  const { t, i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortField, setSortField] = useState('name'); // name | booth | favorites
  const [sortDirection, setSortDirection] = useState('asc'); // asc | desc
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortButtonRef = useRef(null);
  const sortMenuRef = useRef(null);
  const sortFieldLabels = {
    name: t('exhibitorPage.sortName') || 'Name',
    booth: t('exhibitorPage.sortBooth') || 'Booth',
    favorites: t('exhibitorPage.sortFavoritesBase') || 'Favorites'
  };

  // Favorites context
  const { favorites, isFavorite, toggleFavorite } = useFavoritesContext();

  // Raw exhibitors subset
  const exhibitors = useMemo(() => markersState.filter(m => m.id < 1000 && m.name), [markersState]);

  // Group by companyId
  const groupedExhibitors = useMemo(() => {
    const grouped = {};
    exhibitors.forEach(marker => {
      if (marker.companyId) {
        if (!grouped[marker.companyId]) {
          grouped[marker.companyId] = {
            ...marker,
            boothNumbers: [marker.glyph],
            markerIds: [marker.id]
          };
        } else {
          grouped[marker.companyId].boothNumbers.push(marker.glyph);
          grouped[marker.companyId].markerIds.push(marker.id);
        }
      }
    });
    Object.values(grouped).forEach(company => {
      company.boothNumbers.sort((a,b) => (parseInt(a)||0) - (parseInt(b)||0));
    });
    return Object.values(grouped);
  }, [exhibitors]);

  // Outside click close
  useEffect(() => {
    if (!showSortMenu) return;
    const onDocClick = (e) => {
      const btn = sortButtonRef.current;
      const menu = sortMenuRef.current;
      if (!btn || !menu) return;
      if (!btn.contains(e.target) && !menu.contains(e.target)) {
        setShowSortMenu(false);
        setTimeout(() => btn && btn.focus(), 0);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [showSortMenu]);

  // Filters
  const filteredExhibitors = useMemo(() => {
    let list = groupedExhibitors;
    if (showFavoritesOnly) list = list.filter(ex => ex.companyId && isFavorite(ex.companyId));
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(ex =>
        ex.name?.toLowerCase().includes(q) ||
        ex.boothNumbers?.some(b => b?.toLowerCase().includes(q))
      );
    }
    return list;
  }, [groupedExhibitors, showFavoritesOnly, searchTerm, isFavorite]);

  // Sorting
  const sortedExhibitors = useMemo(() => {
    const list = [...filteredExhibitors];
    const parsePrimaryBooth = (ex) => {
      if (!ex.boothNumbers || ex.boothNumbers.length === 0) return Number.MAX_SAFE_INTEGER;
      const nums = ex.boothNumbers.map(b => parseInt(b)).filter(n => !isNaN(n));
      return nums.length ? Math.min(...nums) : Number.MAX_SAFE_INTEGER;
    };
    if (sortField === 'favorites') {
      list.sort((a,b) => {
        const favA = a.companyId && isFavorite(a.companyId) ? 0 : 1;
        const favB = b.companyId && isFavorite(b.companyId) ? 0 : 1;
        if (favA !== favB) return favA - favB;
        const cmp = (a.name||'').localeCompare(b.name||'');
        return sortDirection === 'asc' ? cmp : -cmp;
      });
      return list;
    }
    if (sortField === 'name') {
      list.sort((a,b) => {
        const cmp = (a.name||'').localeCompare(b.name||'');
        return sortDirection === 'asc' ? cmp : -cmp;
      });
      return list;
    }
    if (sortField === 'booth') {
      list.sort((a,b) => {
        const cmp = parsePrimaryBooth(a) - parsePrimaryBooth(b);
        return sortDirection === 'asc' ? cmp : -cmp;
      });
      return list;
    }
    return list;
  }, [filteredExhibitors, sortField, sortDirection, isFavorite]);

  const handleExhibitorClick = (markerIds) => navigate(`/map?focus=${markerIds[0]}`);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('exhibitorPage.title')}</h1>

          {/* Search Bar */}
          <div className="relative">
            <Icon
              path={mdiMagnify}
              size={1}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder={t('exhibitorPage.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          {/* Filters and Results Count */}
          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-gray-600">
              {t('exhibitorPage.showing')} {filteredExhibitors.length} {t('exhibitorPage.of')} {exhibitors.length} {t('exhibitorPage.exhibitors')}
              {favorites.length > 0 && ` • ${favorites.length} ${t('exhibitorPage.favorited')}`}
            </div>
            <div className="flex flex-wrap gap-2 items-center relative">
              {/* Single sort dropdown button */}
              <div className="relative flex items-center gap-1" onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setShowSortMenu(false);
                  const btn = sortButtonRef.current;
                  if (btn) btn.focus();
                }
              }}>
                <button
                  type="button"
                  ref={sortButtonRef}
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className={`px-3 py-1.5 rounded-lg border text-sm flex items-center gap-1 select-none transition-colors ${
                    'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                  aria-haspopup="listbox"
                  aria-expanded={showSortMenu}
                  aria-label={`${t('exhibitorPage.sortBy')} ${sortFieldLabels[sortField]}`}
                >
                  <span className="font-medium">{sortFieldLabels[sortField]}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc'); }}
                  aria-label={`Toggle sort direction to ${sortDirection === 'asc' ? 'descending' : 'ascending'}`}
                  className="px-2 py-1.5 rounded-lg border text-sm flex items-center justify-center transition-colors bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  <Icon path={sortDirection === 'asc' ? mdiChevronUp : mdiChevronDown} size={0.6} className="text-blue-600" />
                </button>
                {showSortMenu && (
                  <ul
                    role="listbox"
                    ref={sortMenuRef}
                    tabIndex={-1}
                    className="absolute left-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow z-20 py-1"
                  >
                    <li>
                      <button
                        type="button"
                        role="option"
                        aria-selected={sortField === 'name'}
                        onClick={() => { setSortField('name'); setShowSortMenu(false); }}
                        className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 ${sortField === 'name' ? 'font-semibold text-blue-700' : 'text-gray-700'}`}
                      >{sortFieldLabels.name}</button>
                    </li>
                    <li>
                      <button
                        type="button"
                        role="option"
                        aria-selected={sortField === 'booth'}
                        onClick={() => { setSortField('booth'); setShowSortMenu(false); }}
                        className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 ${sortField === 'booth' ? 'font-semibold text-blue-700' : 'text-gray-700'}`}
                      >{sortFieldLabels.booth}</button>
                    </li>
                    {favorites.length > 0 && (
                      <li>
                        <button
                          type="button"
                          role="option"
                          aria-selected={sortField === 'favorites'}
                          onClick={() => { setSortField('favorites'); setShowSortMenu(false); }}
                          className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 ${sortField === 'favorites' ? 'font-semibold text-blue-700' : 'text-gray-700'}`}
                        >{sortFieldLabels.favorites}</button>
                      </li>
                    )}
                  </ul>
                )}
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
                  {t('exhibitorPage.favoritesOnly')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Exhibitor List */}
      <div className="max-w-screen-xl mx-auto px-4 py-4">
        {filteredExhibitors.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">{t('exhibitorPage.noExhibitors')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedExhibitors.map((exhibitor) => (
              <div
                key={exhibitor.companyId || exhibitor.id}
                onClick={() => handleExhibitorClick(exhibitor.markerIds)}
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
                      <h3 className="font-semibold text-gray-900 text-lg break-words">
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

                    {/* Booth Number(s) */}
                    {exhibitor.boothNumbers && exhibitor.boothNumbers.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Icon path={mdiMapMarker} size={0.7} className="text-orange-600" />
                        <span className="text-sm font-medium text-orange-600">
                          {t('exhibitorPage.booth')} {exhibitor.boothNumbers.join(', ')}
                        </span>
                      </div>
                    )}

                    {/* Category - Placeholder for Phase 5 */}
                    <div className="mt-2">
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {t('exhibitorPage.categoriesComingSoon')}
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
          <div className="text-sm text-blue-800">
            <p>📝 <strong>{t('exhibitorPage.phaseNote')}</strong> {t('exhibitorPage.comingInFuturePhases')}</p>
            <ul className="list-disc list-inside mt-2">
              <li>{t('exhibitorPage.categoryFiltering')}</li>
              <li>{t('exhibitorPage.sortOptions')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
