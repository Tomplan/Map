import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useAssignments from '../../hooks/useAssignments';
import useEventSubscriptions from '../../hooks/useEventSubscriptions';
import { useMarkerGlyphs } from '../../hooks/useMarkerGlyphs';
import useUserPreferences from '../../hooks/useUserPreferences';
import { supabase } from '../../supabaseClient';
import Icon from '@mdi/react';
import { mdiArchive, mdiHistory, mdiMagnify, mdiCheck, mdiChevronUp, mdiChevronDown } from '@mdi/js';
import { useDialog } from '../../contexts/DialogContext';

/**
 * AssignmentsTab - Matrix view for managing yearly marker-to-company assignments
 * Grid layout: Subscribed Companies (rows) x Marker IDs (columns)
 * Only shows companies that are subscribed to the selected year
 */
const SORT_STORAGE_KEY = 'assignmentsTab_sortPreferences';

export default function AssignmentsTab({ selectedYear }) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');

  // Load user preferences from database
  const { preferences, loading: preferencesLoading, updatePreferences } = useUserPreferences();

  // Load sort preferences from localStorage (fallback for backwards compatibility)
  const loadSortPreferences = () => {
    try {
      const stored = localStorage.getItem(SORT_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading sort preferences:', error);
    }
    return {
      sortBy: 'alphabetic',
      sortDirection: 'asc',
      columnSort: 'markerId',
      columnSortDirection: 'asc'
    };
  };

  const initialPrefs = loadSortPreferences();
  const [sortBy, setSortBy] = useState(initialPrefs.sortBy); // 'alphabetic', 'byMarker', 'unassignedFirst'
  const [sortDirection, setSortDirection] = useState(initialPrefs.sortDirection); // 'asc' or 'desc'
  const [columnSort, setColumnSort] = useState(initialPrefs.columnSort); // 'markerId' or 'glyphText'
  const [columnSortDirection, setColumnSortDirection] = useState(initialPrefs.columnSortDirection); // 'asc' or 'desc'

  // Sync with database preferences when they load
  useEffect(() => {
    if (!preferencesLoading && preferences) {
      setSortBy(preferences.assignments_sort_by || 'alphabetic');
      setSortDirection(preferences.assignments_sort_direction || 'asc');
      setColumnSort(preferences.assignments_column_sort || 'markerId');
      setColumnSortDirection(preferences.assignments_column_sort_direction || 'asc');
    }
  }, [preferencesLoading, preferences]);
  const { markers, loading: loadingMarkers } = useMarkerGlyphs();

  const {
    assignments,
    loading,
    error,
    assignCompanyToMarker,
    unassignCompanyFromMarker,
    archiveCurrentYear,
    loadArchivedAssignments
  } = useAssignments(selectedYear);

  // Load subscriptions to filter companies
  const { subscriptions } = useEventSubscriptions(selectedYear);

  // Dialog context
  const { confirm, toastError, toastSuccess, toastInfo } = useDialog();

  // Extract subscribed companies with their info
  const subscribedCompanies = useMemo(() => {
    return subscriptions.map(sub => ({
      id: sub.company_id,
      name: sub.company?.name || 'Unknown',
      logo: sub.company?.logo || '',
    }));
  }, [subscriptions]);

  // Save sort preferences to database and localStorage whenever they change
  useEffect(() => {
    // Save to localStorage for backwards compatibility
    try {
      const localPrefs = {
        sortBy,
        sortDirection,
        columnSort,
        columnSortDirection
      };
      localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify(localPrefs));
    } catch (error) {
      console.error('Error saving sort preferences to localStorage:', error);
    }

    // Update database if preferences are loaded
    if (!preferencesLoading && preferences) {
      const dbUpdates = {
        assignments_sort_by: sortBy,
        assignments_sort_direction: sortDirection,
        assignments_column_sort: columnSort,
        assignments_column_sort_direction: columnSortDirection
      };

      // Only update if values have changed
      if (
        preferences.assignments_sort_by !== sortBy ||
        preferences.assignments_sort_direction !== sortDirection ||
        preferences.assignments_column_sort !== columnSort ||
        preferences.assignments_column_sort_direction !== columnSortDirection
      ) {
        updatePreferences(dbUpdates);
      }
    }
  }, [sortBy, sortDirection, columnSort, columnSortDirection, preferencesLoading, preferences, updatePreferences]);

  // Count assignments per company (for badge display)
  const companyAssignmentCounts = useMemo(() => {
    const counts = {};
    assignments.forEach(assignment => {
      counts[assignment.company_id] = (counts[assignment.company_id] || 0) + 1;
    });
    return counts;
  }, [assignments]);

  // Get lowest marker ID for each company (for sorting by marker position)
  const companyLowestMarkers = useMemo(() => {
    const lowestMarkers = {};
    assignments.forEach(assignment => {
      if (!lowestMarkers[assignment.company_id] || assignment.marker_id < lowestMarkers[assignment.company_id]) {
        lowestMarkers[assignment.company_id] = assignment.marker_id;
      }
    });
    return lowestMarkers;
  }, [assignments]);

  // Filter and sort companies based on search and sort option
  const filteredCompanies = useMemo(() => {
    // Only show subscribed companies for the selected year
    // First, filter by search term
    let filtered = searchTerm
      ? subscribedCompanies.filter(c => c.name?.toLowerCase().includes(searchTerm.toLowerCase()))
      : subscribedCompanies;

    // Then, sort based on selected option
    const sorted = [...filtered].sort((a, b) => {
      const countA = companyAssignmentCounts[a.id] || 0;
      const countB = companyAssignmentCounts[b.id] || 0;
      const markerA = companyLowestMarkers[a.id];
      const markerB = companyLowestMarkers[b.id];

      let result = 0;

      switch (sortBy) {
        case 'byMarker':
          // Sort by lowest marker ID assigned
          // Unassigned companies go last
          if (!markerA && markerB) result = 1;
          else if (markerA && !markerB) result = -1;
          else if (!markerA && !markerB) result = a.name.localeCompare(b.name);
          else if (markerA !== markerB) result = markerA - markerB;
          else result = a.name.localeCompare(b.name); // If same marker, sort alphabetically
          break;

        case 'unassignedFirst':
          // Unassigned (0) first, then by lowest marker ID
          if (countA === 0 && countB > 0) result = -1;
          else if (countA > 0 && countB === 0) result = 1;
          else if (countA === 0 && countB === 0) result = a.name.localeCompare(b.name);
          else {
            // Both assigned, sort by marker
            if (!markerA && markerB) result = 1;
            else if (markerA && !markerB) result = -1;
            else if (markerA !== markerB) result = markerA - markerB;
            else result = a.name.localeCompare(b.name);
          }
          break;

        case 'alphabetic':
        default:
          // Sort alphabetically
          result = a.name.localeCompare(b.name);
          break;
      }

      // Apply sort direction
      return sortDirection === 'desc' ? -result : result;
    });

    return sorted;
  }, [subscribedCompanies, searchTerm, sortBy, sortDirection, companyAssignmentCounts, companyLowestMarkers]);

  // Sort markers by column sort criteria
  const sortedMarkers = useMemo(() => {
    const sorted = [...markers].sort((a, b) => {
      let result = 0;

      if (columnSort === 'glyphText') {
        // Sort alphabetically by glyph text
        result = a.glyph.localeCompare(b.glyph, undefined, { numeric: true, sensitivity: 'base' });
      } else {
        // Sort by marker ID (default)
        result = a.id - b.id;
      }

      return columnSortDirection === 'desc' ? -result : result;
    });

    return sorted;
  }, [markers, columnSort, columnSortDirection]);

  // Create assignment map: key = `${company_id}_${marker_id}`, value = assignment
  const assignmentMap = useMemo(() => {
    const map = {};
    assignments.forEach(assignment => {
      const key = `${assignment.company_id}_${assignment.marker_id}`;
      map[key] = assignment;
    });
    return map;
  }, [assignments]);

  // Track which markers have any assignments (for column styling)
  const markerHasAssignments = useMemo(() => {
    const markerAssignments = new Set();
    assignments.forEach(assignment => {
      markerAssignments.add(assignment.marker_id);
    });
    return markerAssignments;
  }, [assignments]);

  // Check if a marker has any assignments
  const isMarkerAssigned = (markerId) => {
    return markerHasAssignments.has(markerId);
  };

  // Check if a company is assigned to a marker
  const isAssigned = (companyId, markerId) => {
    const key = `${companyId}_${markerId}`;
    return !!assignmentMap[key];
  };

  // Get assignment for company/marker combo
  const getAssignment = (companyId, markerId) => {
    const key = `${companyId}_${markerId}`;
    return assignmentMap[key];
  };

  // Toggle assignment
  const handleToggleAssignment = async (companyId, markerId) => {
    const assignment = getAssignment(companyId, markerId);

    if (assignment) {
      // Unassign
      const { error } = await unassignCompanyFromMarker(markerId, companyId);
      if (error) {
        toastError(`Error removing assignment: ${error}`);
      }
    } else {
      // Assign - Check if marker already has assignments
      const existingAssignments = assignments.filter(a => a.marker_id === markerId);

      if (existingAssignments.length > 0) {
        // Get company and marker info
        const newCompany = subscribedCompanies.find(c => c.id === companyId);
        const newCompanyName = newCompany?.name || 'this company';
        const marker = sortedMarkers.find(m => m.id === markerId);
        const boothLabel = marker?.glyph || markerId;

        // Build warning message
        let warningMessage;
        if (existingAssignments.length === 1) {
          const existingCompany = subscribedCompanies.find(
            c => c.id === existingAssignments[0].company_id
          );
          const existingCompanyName = existingCompany?.name || 'another company';
          warningMessage = `Booth ${boothLabel} is already assigned to ${existingCompanyName}.\n\nAssign ${newCompanyName} as an additional company for this booth?`;
        } else {
          const companyNames = existingAssignments
            .map(a => {
              const comp = subscribedCompanies.find(c => c.id === a.company_id);
              return comp?.name;
            })
            .filter(Boolean)
            .join(', ');
          warningMessage = `Booth ${boothLabel} is already assigned to ${existingAssignments.length} companies: ${companyNames}.\n\nAssign ${newCompanyName} as another company for this booth?`;
        }

        // Show confirmation
        const confirmed = await confirm({
          title: 'Multiple Assignments',
          message: warningMessage,
          confirmText: 'Assign',
          variant: 'warning',
        });
        if (!confirmed) {
          return; // User cancelled
        }
      }

      // Proceed with assignment
      const { error } = await assignCompanyToMarker(markerId, companyId, null);
      if (error) {
        toastError(`Error creating assignment: ${error}`);
      }
    }
  };

  // Handle archive current year
  const handleArchive = async () => {
    const confirmed = await confirm({
      title: 'Archive Assignments',
      message: `Archive all assignments for ${selectedYear}? This will move them to the archive and clear the current year.`,
      confirmText: 'Archive',
      variant: 'warning',
    });
    if (!confirmed) {
      return;
    }

    const { error } = await archiveCurrentYear();
    if (error) {
      toastError(`Error archiving: ${error}`);
    } else {
      toastSuccess(`Successfully archived ${assignments.length} assignments for ${selectedYear}`);
    }
  };

  // Handle view archived
  const handleViewArchived = async (year) => {
    const { error } = await loadArchivedAssignments(year);
    if (error) {
      toastError(`Error loading archived assignments: ${error}`);
    } else {
      toastInfo(`Archived data loaded for ${year}. Feature coming soon: display in table.`);
    }
  };

  if (loading || loadingMarkers) {
    return <div className="p-4">Loading assignments...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="h-full flex flex-col p-4">
      {/* Header with search and action buttons */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Icon path={mdiMagnify} size={1} className="text-gray-500" />
          <input
            type="text"
            placeholder={t('helpPanel.assignments.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          />
          <span className="text-sm text-gray-600">
            {filteredCompanies.length} of {subscribedCompanies.length}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleViewArchived(selectedYear)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            title={`View archived assignments for ${selectedYear}`}
          >
            <Icon path={mdiHistory} size={0.8} />
            <span>{t('helpPanel.assignments.archive')}</span>
          </button>
          <button
            onClick={handleArchive}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={assignments.length === 0}
            title={`Archive all assignments for ${selectedYear}`}
          >
            <Icon path={mdiArchive} size={0.8} />
          </button>
          {/* Sort Controls */}
          <div className="flex items-end gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('helpPanel.assignments.sortCompanies')}</label>
                <div className="flex items-center border border-gray-300 rounded-md shadow-sm bg-white">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="flex-1 pl-3 pr-3 py-1.5 border-0 rounded-l-md bg-white text-gray-900 text-sm focus:ring-0 appearance-none"
                    title="Sort table rows"
                  >
                    <option value="alphabetic">A-Z</option>
                    <option value="byMarker">{t('helpPanel.assignments.byMarker')}</option>
                    <option value="unassignedFirst">{t('helpPanel.assignments.unassignedFirst')}</option>
                  </select>
                  <button
                    onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                    className="px-2 py-1.5 border-l border-gray-300 text-gray-500 hover:bg-gray-50 rounded-r-md"
                    title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
                  >
                      <Icon path={sortDirection === 'asc' ? mdiChevronUp : mdiChevronDown} size={0.8} />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('helpPanel.assignments.sortMarkers')}</label>
                <div className="flex items-center border border-gray-300 rounded-md shadow-sm bg-white">
                  <select
                    value={columnSort}
                    onChange={(e) => setColumnSort(e.target.value)}
                    className="flex-1 pl-3 pr-3 py-1.5 border-0 rounded-l-md bg-white text-gray-900 text-sm focus:ring-0 appearance-none"
                    title="Sort table columns"
                  >
                    <option value="markerId">{t('helpPanel.assignments.markerId')}</option>
                    <option value="glyphText">{t('helpPanel.assignments.glyphText')}</option>
                  </select>
                  <button
                    onClick={() => setColumnSortDirection(columnSortDirection === 'asc' ? 'desc' : 'asc')}
                    className="px-2 py-1.5 border-l border-gray-300 text-gray-500 hover:bg-gray-50 rounded-r-md"
                    title={columnSortDirection === 'asc' ? 'Ascending' : 'Descending'}
                  >
                      <Icon path={columnSortDirection === 'asc' ? mdiChevronUp : mdiChevronDown} size={0.8} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Assignment Matrix */}
      <div className="flex-1 overflow-auto border rounded-lg relative" style={{ maxHeight: 'calc(100vh - 8rem)' }}>
        <table className="w-full table-auto border-separate" style={{ fontSize: '11px' }}>
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-100 text-gray-900">
              <th
                className="p-2 text-left font-semibold border-b border-r bg-gray-200 sticky left-0 top-0 z-20"
                style={{ minWidth: '200px', top: 0, left: 0, background: '#f3f4f6' }}
              >
                Company
              </th>
              {sortedMarkers.map(marker => {
                const hasAssignment = isMarkerAssigned(marker.id);
                return (
                  <th
                    key={marker.id}
                    className={`p-1 text-center border-b ${hasAssignment ? '' : 'bg-gray-200'}`}
                    style={{ minWidth: '45px', maxWidth: '45px' }}
                    title={`Marker ID: ${marker.id}, Booth: ${marker.glyph}${hasAssignment ? '' : ' (Unassigned)'}`}
                  >
                    <div className={`font-semibold ${hasAssignment ? '' : 'text-gray-500'}`}>
                      {marker.glyph}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {filteredCompanies.map((company) => {
              const assignmentCount = companyAssignmentCounts[company.id] || 0;
              return (
                <tr key={company.id} className="hover:bg-gray-50">
                  <td className="p-2 border-b border-r bg-white sticky left-0 z-10">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-gray-900 truncate" title={company.name}>
                        {company.name}
                      </div>
                      <span
                        className={`inline-flex items-center justify-center min-w-[24px] h-5 px-1.5 rounded-full text-xs font-medium ${
                          assignmentCount === 0
                            ? 'bg-gray-200 text-gray-600'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                        title={`${assignmentCount} assignment${assignmentCount !== 1 ? 's' : ''}`}
                      >
                        {assignmentCount}
                      </span>
                    </div>
                  </td>
                {sortedMarkers.map(marker => {
                  const assigned = isAssigned(company.id, marker.id);
                  const markerHasAnyAssignment = isMarkerAssigned(marker.id);
                  return (
                    <td key={marker.id} className={`p-0 border-b border-r text-center ${markerHasAnyAssignment ? '' : 'bg-gray-100'}`}>
                      <button
                        onClick={() => handleToggleAssignment(company.id, marker.id)}
                        className={`w-full h-full p-2 transition-colors ${
                          assigned
                            ? 'bg-green-100 hover:bg-green-200 text-green-700'
                            : markerHasAnyAssignment
                            ? 'bg-white hover:bg-gray-100 text-gray-300'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-400'
                        }`}
                        title={assigned ? `${company.name} → Booth ${marker.glyph}` : `Assign ${company.name} to Booth ${marker.glyph}`}
                      >
                        {assigned && <Icon path={mdiCheck} size={0.6} />}
                      </button>
                    </td>
                  );
                })}
              </tr>
              );
            })}
          </tbody>
        </table>

        {filteredCompanies.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm
              ? 'No companies found matching your search'
              : `No companies available. Add companies in the Companies tab.`}
          </div>
        )}
      </div>

      {/* Legend and Stats */}
      <div className="mt-4 p-3 bg-gray-100 rounded-lg space-y-2">
        <div className="flex items-center gap-4 text-sm text-gray-900">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-100 border border-green-200 rounded flex items-center justify-center">
              <Icon path={mdiCheck} size={0.5} className="text-green-700" />
            </div>
            <span className="font-medium">{t('helpPanel.assignments.assigned')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 border-2 border-gray-300 bg-white rounded"></div>
            <span className="font-medium">{t('helpPanel.assignments.notAssigned')}</span>
          </div>
        </div>
        <div className="text-sm text-gray-900">
          <strong>Statistics for {selectedYear}:</strong> {assignments.length} assignments,
          {' '}{new Set(assignments.map(a => a.company_id)).size} unique companies,
          {' '}{new Set(assignments.map(a => a.marker_id)).size} markers assigned
        </div>
      </div>
    </div>
  );
}
