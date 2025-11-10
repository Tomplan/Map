import { useState, useMemo, useEffect } from 'react';
import useAssignments from '../../hooks/useAssignments';
import useCompanies from '../../hooks/useCompanies';
import { supabase } from '../../supabaseClient';
import Icon from '@mdi/react';
import { mdiArchive, mdiHistory, mdiMagnify, mdiCheck } from '@mdi/js';

/**
 * AssignmentsTab - Matrix view for managing yearly marker-to-company assignments
 * Grid layout: Companies (rows) x Marker IDs (columns)
 */
export default function AssignmentsTab() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('alphabetic'); // 'alphabetic', 'assignmentCount', 'unassignedFirst'
  const [markerIds, setMarkerIds] = useState([]);
  const [loadingMarkers, setLoadingMarkers] = useState(true);

  const {
    assignments,
    loading,
    error,
    assignCompanyToMarker,
    unassignCompanyFromMarker,
    archiveCurrentYear,
    loadArchivedAssignments
  } = useAssignments(selectedYear);

  const { companies } = useCompanies();

  // Load all marker IDs from Markers_Core (only booth markers < 1000)
  useEffect(() => {
    async function loadMarkerIds() {
      try {
        setLoadingMarkers(true);
        const { data, error } = await supabase
          .from('Markers_Core')
          .select('id')
          .lt('id', 1000) // Only load booth markers (id < 1000)
          .order('id', { ascending: true });

        if (error) throw error;
        setMarkerIds(data.map(m => m.id));
      } catch (err) {
        console.error('Error loading marker IDs:', err);
      } finally {
        setLoadingMarkers(false);
      }
    }

    loadMarkerIds();
  }, []);

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
    // First, filter by search term
    let filtered = searchTerm
      ? companies.filter(c => c.name?.toLowerCase().includes(searchTerm.toLowerCase()))
      : companies;

    // Then, sort based on selected option
    const sorted = [...filtered].sort((a, b) => {
      const countA = companyAssignmentCounts[a.id] || 0;
      const countB = companyAssignmentCounts[b.id] || 0;
      const markerA = companyLowestMarkers[a.id];
      const markerB = companyLowestMarkers[b.id];

      switch (sortBy) {
        case 'byMarker':
          // Sort by lowest marker ID assigned
          // Unassigned companies go last
          if (!markerA && markerB) return 1;
          if (markerA && !markerB) return -1;
          if (!markerA && !markerB) return a.name.localeCompare(b.name);
          if (markerA !== markerB) return markerA - markerB;
          // If same marker, sort alphabetically
          return a.name.localeCompare(b.name);

        case 'unassignedFirst':
          // Unassigned (0) first, then by lowest marker ID
          if (countA === 0 && countB > 0) return -1;
          if (countA > 0 && countB === 0) return 1;
          if (countA === 0 && countB === 0) return a.name.localeCompare(b.name);
          // Both assigned, sort by marker
          if (!markerA && markerB) return 1;
          if (markerA && !markerB) return -1;
          if (markerA !== markerB) return markerA - markerB;
          return a.name.localeCompare(b.name);

        case 'alphabetic':
        default:
          // Sort alphabetically
          return a.name.localeCompare(b.name);
      }
    });

    return sorted;
  }, [companies, searchTerm, sortBy, companyAssignmentCounts, companyLowestMarkers]);

  // Create assignment map: key = `${company_id}_${marker_id}`, value = assignment
  const assignmentMap = useMemo(() => {
    const map = {};
    assignments.forEach(assignment => {
      const key = `${assignment.company_id}_${assignment.marker_id}`;
      map[key] = assignment;
    });
    return map;
  }, [assignments]);

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
        alert(`Error removing assignment: ${error}`);
      }
    } else {
      // Assign
      const { error } = await assignCompanyToMarker(markerId, companyId, null);
      if (error) {
        alert(`Error creating assignment: ${error}`);
      }
    }
  };

  // Handle archive current year
  const handleArchive = async () => {
    if (!confirm(`Archive all assignments for ${selectedYear}? This will move them to the archive and clear the current year.`)) {
      return;
    }

    const { error } = await archiveCurrentYear();
    if (error) {
      alert(`Error archiving: ${error}`);
    } else {
      alert(`Successfully archived ${assignments.length} assignments for ${selectedYear}`);
    }
  };

  // Handle view archived
  const handleViewArchived = async (year) => {
    const { error } = await loadArchivedAssignments(year);
    if (error) {
      alert(`Error loading archived assignments: ${error}`);
    } else {
      alert(`Archived data loaded for ${year}. Feature coming soon: display in table.`);
    }
  };

  if (loading || loadingMarkers) {
    return <div className="p-4">Loading assignments...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      {/* Header with controls */}
      <div className="mb-4 space-y-3">
        {/* Year selector and actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <label className="font-semibold">Event Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 border rounded-lg"
            >
              {[currentYear, currentYear - 1, currentYear - 2, currentYear + 1].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <button
              onClick={() => handleViewArchived(selectedYear)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <Icon path={mdiHistory} size={0.8} />
              View Archive
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleArchive}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              disabled={assignments.length === 0}
            >
              <Icon path={mdiArchive} size={0.8} />
              Archive {selectedYear}
            </button>
          </div>
        </div>

        {/* Search, sort, and stats */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Icon path={mdiMagnify} size={1} className="text-gray-500" />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-lg"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border rounded-lg bg-white text-sm"
            >
              <option value="alphabetic">Sort: A-Z</option>
              <option value="byMarker">Sort: By marker assignment (1, 2, 3...)</option>
              <option value="unassignedFirst">Sort: Unassigned first</option>
            </select>
          </div>
          <div className="text-sm text-gray-600">
            {filteredCompanies.length} companies × {markerIds.length} markers = {assignments.length} assignments
          </div>
        </div>
      </div>

      {/* Assignment Matrix */}
      <div className="overflow-auto border rounded-lg" style={{ maxHeight: '600px' }}>
        <table className="w-full" style={{ fontSize: '11px' }}>
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-100 text-gray-900">
              <th className="p-2 text-left font-semibold border-b border-r bg-gray-200 sticky left-0 z-20" style={{ minWidth: '200px' }}>
                Company
              </th>
              {markerIds.map(markerId => (
                <th key={markerId} className="p-1 text-center border-b" style={{ minWidth: '40px', maxWidth: '40px' }}>
                  {markerId}
                </th>
              ))}
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
                {markerIds.map(markerId => {
                  const assigned = isAssigned(company.id, markerId);
                  return (
                    <td key={markerId} className="p-0 border-b border-r text-center">
                      <button
                        onClick={() => handleToggleAssignment(company.id, markerId)}
                        className={`w-full h-full p-2 transition-colors ${
                          assigned
                            ? 'bg-green-100 hover:bg-green-200 text-green-700'
                            : 'bg-white hover:bg-gray-100 text-gray-300'
                        }`}
                        title={assigned ? `Assigned to ${company.name}` : `Click to assign to ${company.name}`}
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
            <span className="font-medium">Assigned</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white border border-gray-300 rounded"></div>
            <span className="font-medium">Not assigned</span>
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
