import { useState, useMemo } from 'react';
import useAssignments from '../../hooks/useAssignments';
import useCompanies from '../../hooks/useCompanies';
import Icon from '@mdi/react';
import { mdiPlus, mdiDelete, mdiArchive, mdiHistory, mdiMagnify } from '@mdi/js';

/**
 * AssignmentsTab - Manage yearly marker-to-company assignments
 * Supports yearly archiving and viewing history
 */
export default function AssignmentsTab() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [newAssignment, setNewAssignment] = useState({ marker_id: '', company_id: '', booth_number: '' });

  const {
    assignments,
    loading,
    error,
    assignCompanyToMarker,
    deleteAssignment,
    archiveCurrentYear,
    loadArchivedAssignments
  } = useAssignments(selectedYear);

  const { companies } = useCompanies();

  // Filter assignments based on search
  const filteredAssignments = useMemo(() => {
    if (!searchTerm) return assignments;
    const term = searchTerm.toLowerCase();
    return assignments.filter((a) =>
      a.company?.name?.toLowerCase().includes(term) ||
      a.booth_number?.toLowerCase().includes(term) ||
      a.marker_id?.toString().includes(term)
    );
  }, [assignments, searchTerm]);

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

  // Handle create new assignment
  const handleCreateAssignment = async () => {
    if (!newAssignment.marker_id || !newAssignment.company_id) {
      alert('Marker ID and Company are required');
      return;
    }

    const { error } = await assignCompanyToMarker(
      parseInt(newAssignment.marker_id),
      parseInt(newAssignment.company_id),
      newAssignment.booth_number
    );

    if (error) {
      alert(`Error creating assignment: ${error}`);
    } else {
      setIsAssigning(false);
      setNewAssignment({ marker_id: '', company_id: '', booth_number: '' });
    }
  };

  // Handle delete assignment
  const handleDeleteAssignment = async (id, companyName) => {
    if (!confirm(`Remove assignment for "${companyName}"?`)) {
      return;
    }

    const { error } = await deleteAssignment(id);
    if (error) {
      alert(`Error deleting assignment: ${error}`);
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

  if (loading) {
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
              onClick={() => setIsAssigning(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Icon path={mdiPlus} size={0.8} />
              New Assignment
            </button>
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

        {/* Search */}
        <div className="flex items-center gap-2">
          <Icon path={mdiMagnify} size={1} className="text-gray-500" />
          <input
            type="text"
            placeholder="Search by company, booth number, or marker ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg"
          />
          <span className="text-sm text-gray-600">
            {filteredAssignments.length} of {assignments.length} assignments
          </span>
        </div>
      </div>

      {/* Create new assignment form */}
      {isAssigning && (
        <div className="mb-4 p-4 border rounded-lg bg-blue-50">
          <h3 className="font-bold mb-3">New Assignment for {selectedYear}</h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Marker ID *</label>
              <input
                type="number"
                placeholder="Marker ID"
                value={newAssignment.marker_id}
                onChange={(e) => setNewAssignment({ ...newAssignment, marker_id: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Company *</label>
              <select
                value={newAssignment.company_id}
                onChange={(e) => setNewAssignment({ ...newAssignment, company_id: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">Select company...</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Booth Number</label>
              <input
                type="text"
                placeholder="Booth Number"
                value={newAssignment.booth_number}
                onChange={(e) => setNewAssignment({ ...newAssignment, booth_number: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleCreateAssignment}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Create Assignment
            </button>
            <button
              onClick={() => {
                setIsAssigning(false);
                setNewAssignment({ marker_id: '', company_id: '', booth_number: '' });
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Assignments table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="py-2 px-3 text-left border-b">Assignment ID</th>
              <th className="py-2 px-3 text-left border-b">Marker ID</th>
              <th className="py-2 px-3 text-left border-b">Booth #</th>
              <th className="py-2 px-3 text-left border-b">Company</th>
              <th className="py-2 px-3 text-left border-b">Logo</th>
              <th className="py-2 px-3 text-left border-b">Location</th>
              <th className="py-2 px-3 text-left border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssignments.map((assignment) => (
              <tr key={assignment.id} className="hover:bg-gray-50">
                <td className="py-2 px-3 border-b">{assignment.id}</td>
                <td className="py-2 px-3 border-b font-mono">{assignment.marker_id}</td>
                <td className="py-2 px-3 border-b font-semibold">{assignment.booth_number || '-'}</td>
                <td className="py-2 px-3 border-b">
                  <div className="font-semibold">{assignment.company?.name || 'Unknown'}</div>
                  {assignment.company?.website && (
                    <a
                      href={assignment.company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {assignment.company.website.substring(0, 30)}...
                    </a>
                  )}
                </td>
                <td className="py-2 px-3 border-b">
                  {assignment.company?.logo ? (
                    <img
                      src={assignment.company.logo}
                      alt={assignment.company.name}
                      className="h-8 object-contain"
                    />
                  ) : (
                    <span className="text-gray-400 text-sm">No logo</span>
                  )}
                </td>
                <td className="py-2 px-3 border-b text-xs text-gray-600">
                  {assignment.marker?.lat && assignment.marker?.lng &&
                   typeof assignment.marker.lat === 'number' && typeof assignment.marker.lng === 'number'
                    ? `${assignment.marker.lat.toFixed(4)}, ${assignment.marker.lng.toFixed(4)}`
                    : '-'}
                </td>
                <td className="py-2 px-3 border-b">
                  <button
                    onClick={() => handleDeleteAssignment(assignment.id, assignment.company?.name)}
                    className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
                    title="Remove assignment"
                  >
                    <Icon path={mdiDelete} size={0.7} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredAssignments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm
              ? 'No assignments found matching your search'
              : `No assignments for ${selectedYear}. Click "New Assignment" to create one.`}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mt-4 p-3 bg-gray-100 rounded-lg">
        <div className="text-sm text-gray-700">
          <strong>Statistics for {selectedYear}:</strong> {assignments.length} assignments,
          {' '}{new Set(assignments.map(a => a.company_id)).size} unique companies,
          {' '}{new Set(assignments.map(a => a.marker_id)).size} markers assigned
        </div>
      </div>
    </div>
  );
}
