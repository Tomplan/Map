import React, { useState, useEffect, useRef } from 'react';
import { MdBusiness, MdClose, MdSearch } from 'react-icons/md';
import { getLogoPath } from '../utils/getLogoPath';

/**
 * MarkerContextMenu - Right-click context menu for marker-company assignment
 * 
 * Shows list of subscribed companies and allows quick assignment/unassignment
 * Only visible in manager view (isAdminView=true)
 */
function MarkerContextMenu({
  marker,
  subscriptions,
  assignments,
  onAssign,
  onUnassign,
  isLoading,
  onClose,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef(null);

  // Find current assignment for this marker
  const currentAssignment = assignments.find((a) => a.marker_id === marker.id);

  // Filter available companies: subscribed but not assigned to this marker
  const availableCompanies = subscriptions
    .filter((sub) => {
      // Exclude if already assigned to this marker
      const isAssigned = assignments.some(
        (a) => a.marker_id === marker.id && a.company_id === sub.company_id
      );
      return !isAssigned;
    })
    .map((sub) => ({
      id: sub.company_id,
      name: sub.company?.name || 'Unknown Company',
      logo: sub.company?.logo || null,
      website: sub.company?.website || null,
    }))
    .filter((company) =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Focus search input when menu opens
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const handleAssign = async (companyId) => {
    await onAssign(marker.id, companyId);
    onClose();
  };

  const handleUnassign = async () => {
    if (currentAssignment) {
      await onUnassign(marker.id, currentAssignment.company_id);
      onClose();
    }
  };

  return (
    <div className="p-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-300">
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <MdBusiness className="text-blue-600" />
            {marker.name || `Marker ${marker.id}`}
          </h3>
        </div>

        {/* Current Assignment */}
        {currentAssignment && (
          <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {currentAssignment.company?.logo ? (
                  <img
                    src={getLogoPath(currentAssignment.company.logo)}
                    alt={currentAssignment.company.name}
                    className="w-8 h-8 object-contain flex-shrink-0"
                  />
                ) : (
                  <MdBusiness className="w-8 h-8 text-gray-400 flex-shrink-0" />
                )}
                <span className="text-sm font-medium text-gray-800 truncate">
                  {currentAssignment.company?.name || 'Unknown'}
                </span>
              </div>
              <button
                onClick={handleUnassign}
                disabled={isLoading}
                className="ml-2 px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                title="Unassign company"
              >
                <MdClose className="inline" size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Search Input */}
        {availableCompanies.length > 5 && (
          <div className="mb-2 relative">
            <MdSearch className="absolute left-2 top-2 text-gray-400" size={16} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search companies..."
              className="w-full pl-8 pr-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Available Companies List */}
        <div className="max-h-64 overflow-y-auto">
          {availableCompanies.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-4">
              {searchTerm
                ? 'No companies match your search'
                : currentAssignment
                ? 'No other companies available'
                : 'No subscribed companies available'}
            </div>
          ) : (
            <div className="space-y-1">
              {availableCompanies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => handleAssign(company.id)}
                  disabled={isLoading}
                  className="w-full flex items-center gap-2 p-2 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
                  title={`Assign ${company.name}`}
                >
                  {company.logo ? (
                    <img
                      src={getLogoPath(company.logo)}
                      alt={company.name}
                      className="w-8 h-8 object-contain flex-shrink-0"
                    />
                  ) : (
                    <MdBusiness className="w-8 h-8 text-gray-400 flex-shrink-0" />
                  )}
                  <span className="text-sm text-gray-800 truncate flex-1">
                    {company.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="mt-2 text-xs text-center text-blue-600">
            Processing...
          </div>
        )}
      </div>
  );
}

export default MarkerContextMenu;
