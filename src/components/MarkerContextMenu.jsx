import React, { useState, useEffect, useRef } from 'react';
import Icon from '@mdi/react';
import { mdiDomain, mdiClose, mdiMagnify } from '@mdi/js';
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

  // Filter available companies: subscribed and have available booth slots
  const availableCompanies = subscriptions
    .filter((sub) => {
      // Count current assignments for this company in this year
      const companyAssignments = assignments.filter(
        (a) => a.company_id === sub.company_id
      );

      const assignedBoothCount = companyAssignments.length;
      const totalBoothCount = sub.booth_count || 1;

      // Check if already assigned to this specific marker
      const isAssignedToThisMarker = companyAssignments.some(
        (a) => a.marker_id === marker.id
      );

      // Show if: NOT assigned to this marker AND has available booths
      return !isAssignedToThisMarker && assignedBoothCount < totalBoothCount;
    })
    .map((sub) => {
      const companyAssignments = assignments.filter(
        (a) => a.company_id === sub.company_id
      );
      const assignedBoothCount = companyAssignments.length;
      const totalBoothCount = sub.booth_count || 1;
      const remainingBooths = totalBoothCount - assignedBoothCount;

      return {
        id: sub.company_id,
        name: sub.company?.name || 'Unknown Company',
        logo: sub.company?.logo || null,
        website: sub.company?.website || null,
        assignedBooths: assignedBoothCount,
        totalBooths: totalBoothCount,
        remainingBooths: remainingBooths,
      };
    })
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
            <Icon path={mdiDomain} size={0.8} className="text-blue-600" />
            {marker.name || `Marker ${marker.id}`}
          </h3>
        </div>

        {/* Current Assignment */}
        {currentAssignment && (() => {
          // Calculate booth usage for currently assigned company
          const companyAssignments = assignments.filter(
            (a) => a.company_id === currentAssignment.company_id
          );
          const assignedCount = companyAssignments.length;
          const subscription = subscriptions.find(
            (s) => s.company_id === currentAssignment.company_id
          );
          const totalBooths = subscription?.booth_count || 1;
          
          return (
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
                    <Icon path={mdiDomain} size={1.2} className="text-gray-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">
                      {currentAssignment.company?.name || 'Unknown'}
                    </div>
                    <div className="text-xs text-gray-600">
                      Using {assignedCount} of {totalBooths} booth{totalBooths !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleUnassign}
                  disabled={isLoading}
                  className="ml-2 px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  title="Unassign company"
                >
                  <Icon path={mdiClose} size={0.55} className="inline" />
                </button>
              </div>
            </div>
          );
        })()}

        {/* Search Input */}
        {availableCompanies.length > 5 && (
          <div className="mb-2 relative">
            <Icon path={mdiMagnify} size={0.65} className="absolute left-2 top-2 text-gray-400" />
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
                  title={`Assign ${company.name} (${company.remainingBooths} booth${company.remainingBooths !== 1 ? 's' : ''} available)`}
                >
                  {company.logo ? (
                    <img
                      src={getLogoPath(company.logo)}
                      alt={company.name}
                      className="w-8 h-8 object-contain flex-shrink-0"
                    />
                  ) : (
                    <Icon path={mdiDomain} size={1.2} className="text-gray-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-800 truncate">
                      {company.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {company.remainingBooths} of {company.totalBooths} booth{company.totalBooths !== 1 ? 's' : ''} available
                    </div>
                  </div>
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
