import { useState, useMemo, useEffect, useCallback } from 'react';
import useEventSubscriptions from '../../hooks/useEventSubscriptions';
import useCompanies from '../../hooks/useCompanies';
import useAssignments from '../../hooks/useAssignments';
import Icon from '@mdi/react';
import { mdiPlus, mdiPencil, mdiDelete, mdiCheck, mdiClose, mdiMagnify, mdiArchive, mdiContentCopy, mdiChevronUp, mdiChevronDown } from '@mdi/js';
import { getLogoPath } from '../../utils/getLogoPath';
import { useOrganizationLogo } from '../../contexts/OrganizationLogoContext';
import { supabase } from '../../supabaseClient';

/**
 * EventSubscriptionsTab - Manage year-specific company subscriptions with event logistics
 * Shows subscribed companies for the selected year with contact info, booth requirements, and meal counts
 */
export default function EventSubscriptionsTab({ selectedYear }) {
  const { organizationLogo } = useOrganizationLogo();
  const {
    subscriptions,
    loading: loadingSubscriptions,
    error: errorSubscriptions,
    subscribeCompany,
    updateSubscription,
    unsubscribeCompany,
    archiveCurrentYear,
    copyFromPreviousYear,
  } = useEventSubscriptions(selectedYear);

  const { companies } = useCompanies();
  const { assignments } = useAssignments(selectedYear);

  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isAdding, setIsAdding] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [sortBy, setSortBy] = useState('company'); // 'company' or 'booths'
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'
  const [markers, setMarkers] = useState([]); // Array of {id, glyph}
  const [loadingMarkers, setLoadingMarkers] = useState(true);

  // Load all markers with glyphText from Markers_Core and Markers_Appearance
  useEffect(() => {
    async function loadMarkers() {
      try {
        setLoadingMarkers(true);

        const { data: coreData, error: coreError } = await supabase
          .from('Markers_Core')
          .select('id')
          .lt('id', 1000) // Only load booth markers (id < 1000)
          .order('id', { ascending: true });

        if (coreError) throw coreError;

        const { data: appearanceData, error: appearanceError } = await supabase
          .from('Markers_Appearance')
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
          glyph: glyphMap[marker.id] || marker.id.toString()
        }));

        setMarkers(mergedMarkers);
      } catch (err) {
        console.error('Error loading markers:', err);
      } finally {
        setLoadingMarkers(false);
      }
    }

    loadMarkers();
  }, [selectedYear]); // Reload markers when year changes

  // Get list of available companies (not yet subscribed)
  const availableCompanies = useMemo(() => {
    const subscribedIds = new Set(subscriptions.map(s => s.company_id));
    return companies.filter(c => !subscribedIds.has(c.id));
  }, [companies, subscriptions]);

  // Get booth assignments for each subscription
  const subscriptionAssignments = useMemo(() => {
    const map = {};
    assignments.forEach(assignment => {
      if (!map[assignment.company_id]) {
        map[assignment.company_id] = [];
      }
      map[assignment.company_id].push(assignment);
    });
    return map;
  }, [assignments]);

  // Create a map of marker ID to glyph text for quick lookup
  const markerGlyphMap = useMemo(() => {
    const map = {};
    markers.forEach(marker => {
      map[marker.id] = marker.glyph;
    });
    return map;
  }, [markers]);

  // Get booth labels for a subscription (actual glyph text)
  const getBoothLabels = useCallback((companyId) => {
    const companyAssignments = subscriptionAssignments[companyId] || [];
    if (companyAssignments.length === 0) return '-';

    // Get all booth labels for this company, sorted by marker_id
    const labels = companyAssignments
      .sort((a, b) => a.marker_id - b.marker_id)
      .map(assignment => markerGlyphMap[assignment.marker_id] || assignment.marker_id.toString())
      .filter(Boolean);

    return labels.length > 0 ? labels.join(', ') : '-';
  }, [subscriptionAssignments, markerGlyphMap]);

  // Filter and sort subscriptions
  const filteredSubscriptions = useMemo(() => {
    let filtered = subscriptions;

    // Apply search filter
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(sub =>
        sub.company?.name?.toLowerCase().includes(lowercasedTerm)
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let compareValue = 0;

      if (sortBy === 'company') {
        // Sort by company name
        const nameA = (a.company?.name || '').toLowerCase();
        const nameB = (b.company?.name || '').toLowerCase();
        compareValue = nameA.localeCompare(nameB);
      } else if (sortBy === 'booths') {
        // Sort by booth labels
        const boothsA = getBoothLabels(a.company_id);
        const boothsB = getBoothLabels(b.company_id);

        // Handle '-' (no booths) - put them at the end
        if (boothsA === '-' && boothsB !== '-') return 1;
        if (boothsA !== '-' && boothsB === '-') return -1;
        if (boothsA === '-' && boothsB === '-') return 0;

        // Compare booth labels alphanumerically
        compareValue = boothsA.localeCompare(boothsB, undefined, { numeric: true });
      }

      return sortDirection === 'asc' ? compareValue : -compareValue;
    });

    return sorted;
  }, [subscriptions, searchTerm, sortBy, sortDirection, getBoothLabels]);

  // Start editing
  const handleEdit = (subscription) => {
    setEditingId(subscription.id);
    setEditForm({ ...subscription });
  };

  // Save edited subscription
  const handleSave = async () => {
    const { id, ...updates } = editForm;
    await updateSubscription(id, updates);
    setEditingId(null);
    setEditForm({});
  };

  // Cancel edit
  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  // Delete subscription
  const handleDelete = async (subscription) => {
    const companyName = subscription.company?.name || 'this company';
    const boothLabels = getBoothLabels(subscription.company_id);
    const assignmentInfo = boothLabels ? ` and their booth assignments (${boothLabels})` : '';

    if (!confirm(`Unsubscribe ${companyName} from ${selectedYear}? This will delete their subscription${assignmentInfo}.`)) {
      return;
    }
    const { error } = await unsubscribeCompany(subscription.id);
    if (error) {
      alert(`Error unsubscribing company: ${error}`);
    }
  };

  // Add new subscription
  const handleAdd = async () => {
    if (!selectedCompanyId) {
      alert('Please select a company');
      return;
    }

    const { error } = await subscribeCompany(parseInt(selectedCompanyId));
    if (!error) {
      setIsAdding(false);
      setSelectedCompanyId('');
    } else {
      alert(`Error subscribing company: ${error}`);
    }
  };

  // Archive current year
  const handleArchive = async () => {
    if (!confirm(`Archive all subscriptions for ${selectedYear}? This will move them to the archive and clear the active list.`)) {
      return;
    }
    const { data, error } = await archiveCurrentYear();
    if (error) {
      alert(`Error archiving: ${error}`);
    } else {
      alert(`Archived ${data} subscriptions for ${selectedYear}`);
    }
  };

  // Copy from previous year
  const handleCopyFromPreviousYear = async () => {
    const previousYear = selectedYear - 1;
    if (!confirm(`Copy all subscriptions from ${previousYear} to ${selectedYear}?`)) {
      return;
    }
    const { error } = await copyFromPreviousYear(previousYear);
    if (error) {
      alert(`Error copying subscriptions: ${error}`);
    }
  };

  // Toggle sort
  const handleSort = (column) => {
    if (sortBy === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to ascending
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  if (loadingSubscriptions) {
    return <div className="p-4">Loading subscriptions...</div>;
  }

  if (errorSubscriptions) {
    return <div className="p-4 text-red-600">Error: {errorSubscriptions}</div>;
  }

  return (
    <div className="p-4">
      {/* Header with search and action buttons */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon path={mdiMagnify} size={1} className="text-gray-500" />
          <input
            type="text"
            placeholder="Search subscribed companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          />
          <span className="text-sm text-gray-600">
            {filteredSubscriptions.length} of {subscriptions.length}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCopyFromPreviousYear}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            title={`Copy from ${selectedYear - 1}`}
          >
            <Icon path={mdiContentCopy} size={0.8} />
            Copy from {selectedYear - 1}
          </button>
          <button
            onClick={handleArchive}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            <Icon path={mdiArchive} size={0.8} />
            Archive {selectedYear}
          </button>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Icon path={mdiPlus} size={0.8} />
            Subscribe Company
          </button>
        </div>
      </div>

      {/* Add new subscription form */}
      {isAdding && (
        <div className="mb-4 p-4 border rounded-lg bg-blue-50">
          <h3 className="font-bold mb-3">Subscribe Company to {selectedYear}</h3>
          <div className="flex items-center gap-3">
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="flex-1 px-3 py-2 border rounded"
            >
              <option value="">Select a company...</option>
              {availableCompanies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleAdd}
              className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              <Icon path={mdiCheck} size={0.7} />
              Subscribe
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setSelectedCompanyId('');
              }}
              className="flex items-center gap-1 px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              <Icon path={mdiClose} size={0.7} />
              Cancel
            </button>
          </div>
          {availableCompanies.length === 0 && (
            <p className="text-sm text-gray-600 mt-2">All companies are already subscribed to {selectedYear}</p>
          )}
        </div>
      )}

      {/* Subscriptions table */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full" style={{ fontSize: '11px' }}>
          <thead className="bg-gray-100 text-gray-900 sticky top-0">
            <tr>
              {/* Booths - First column with sort */}
              <th
                className="p-2 text-left border-b cursor-pointer hover:bg-gray-200 select-none"
                onClick={() => handleSort('booths')}
                title="Click to sort by booth labels"
              >
                <div className="flex items-center gap-1">
                  <span>Booths</span>
                  {sortBy === 'booths' && (
                    <Icon
                      path={sortDirection === 'asc' ? mdiChevronUp : mdiChevronDown}
                      size={0.6}
                      className="text-blue-600"
                    />
                  )}
                </div>
              </th>
              {/* Company - Second column with sort */}
              <th
                className="p-2 text-left border-b cursor-pointer hover:bg-gray-200 select-none"
                onClick={() => handleSort('company')}
                title="Click to sort by company name"
              >
                <div className="flex items-center gap-1">
                  <span>Company</span>
                  {sortBy === 'company' && (
                    <Icon
                      path={sortDirection === 'asc' ? mdiChevronUp : mdiChevronDown}
                      size={0.6}
                      className="text-blue-600"
                    />
                  )}
                </div>
              </th>
              <th className="p-2 text-left border-b">Contact</th>
              <th className="p-2 text-left border-b">Phone</th>
              <th className="p-2 text-left border-b">Email</th>
              <th className="p-2 text-center border-b">Booth Count</th>
              <th className="p-2 text-left border-b">Area</th>
              <th className="p-2 text-center border-b">Breakfast (Sat)</th>
              <th className="p-2 text-center border-b">Lunch (Sat)</th>
              <th className="p-2 text-center border-b">BBQ (Sat)</th>
              <th className="p-2 text-center border-b">Breakfast (Sun)</th>
              <th className="p-2 text-center border-b">Lunch (Sun)</th>
              <th className="p-2 text-center border-b">Coins</th>
              <th className="p-2 text-left border-b">Notes</th>
              <th className="p-2 text-center border-b" style={{ minWidth: '80px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubscriptions.map((subscription) => {
              const isEditing = editingId === subscription.id;
              const company = subscription.company;
              const boothLabels = getBoothLabels(subscription.company_id);

              return (
                <tr key={subscription.id} className="hover:bg-gray-50 border-b text-gray-900">
                  {/* Assigned booths - First column */}
                  <td className="p-2">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
                      {boothLabels}
                    </span>
                  </td>

                  {/* Company name with logo - Second column */}
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <img
                        src={getLogoPath(company?.logo || organizationLogo)}
                        alt={company?.name}
                        className="w-8 h-8 object-contain"
                      />
                      <span className="font-semibold text-gray-900">{company?.name}</span>
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="p-2">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.contact || ''}
                        onChange={(e) => setEditForm({ ...editForm, contact: e.target.value })}
                        className="w-full px-2 py-1 border rounded text-xs text-gray-900"
                      />
                    ) : (
                      <span className="text-xs text-gray-900">{subscription.contact || '-'}</span>
                    )}
                  </td>

                  {/* Phone */}
                  <td className="p-2">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.phone || ''}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="w-full px-2 py-1 border rounded text-xs text-gray-900"
                      />
                    ) : (
                      <span className="text-xs text-gray-900">{subscription.phone || '-'}</span>
                    )}
                  </td>

                  {/* Email */}
                  <td className="p-2">
                    {isEditing ? (
                      <input
                        type="email"
                        value={editForm.email || ''}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full px-2 py-1 border rounded text-xs text-gray-900"
                      />
                    ) : (
                      <span className="text-xs text-gray-900">{subscription.email || '-'}</span>
                    )}
                  </td>

                  {/* Booth Count */}
                  <td className="p-2 text-center">
                    {isEditing ? (
                      <input
                        type="number"
                        min="1"
                        value={editForm.booth_count || 1}
                        onChange={(e) => setEditForm({ ...editForm, booth_count: parseInt(e.target.value) })}
                        className="w-16 px-2 py-1 border rounded text-xs text-center text-gray-900"
                      />
                    ) : (
                      <span className="text-xs text-gray-900">{subscription.booth_count}</span>
                    )}
                  </td>

                  {/* Area */}
                  <td className="p-2">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.area || ''}
                        onChange={(e) => setEditForm({ ...editForm, area: e.target.value })}
                        className="w-full px-2 py-1 border rounded text-xs text-gray-900"
                        placeholder="large field, small field..."
                      />
                    ) : (
                      <span className="text-xs text-gray-900">{subscription.area || '-'}</span>
                    )}
                  </td>

                  {/* Meals - Saturday */}
                  {['breakfast_sat', 'lunch_sat', 'bbq_sat'].map(field => (
                    <td key={field} className="p-2 text-center">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={editForm[field] || 0}
                          onChange={(e) => setEditForm({ ...editForm, [field]: parseInt(e.target.value) || 0 })}
                          className="w-12 px-1 py-1 border rounded text-xs text-center text-gray-900"
                        />
                      ) : (
                        <span className="text-xs text-gray-900">{subscription[field]}</span>
                      )}
                    </td>
                  ))}

                  {/* Meals - Sunday */}
                  {['breakfast_sun', 'lunch_sun'].map(field => (
                    <td key={field} className="p-2 text-center">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={editForm[field] || 0}
                          onChange={(e) => setEditForm({ ...editForm, [field]: parseInt(e.target.value) || 0 })}
                          className="w-12 px-1 py-1 border rounded text-xs text-center text-gray-900"
                        />
                      ) : (
                        <span className="text-xs text-gray-900">{subscription[field]}</span>
                      )}
                    </td>
                  ))}

                  {/* Coins */}
                  <td className="p-2 text-center">
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        value={editForm.coins || 0}
                        onChange={(e) => setEditForm({ ...editForm, coins: parseInt(e.target.value) || 0 })}
                        className="w-12 px-1 py-1 border rounded text-xs text-center"
                      />
                    ) : (
                      <span className="text-xs text-gray-900">{subscription.coins}</span>
                    )}
                  </td>

                  {/* Notes */}
                  <td className="p-2">
                    {isEditing ? (
                      <textarea
                        value={editForm.notes || ''}
                        onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                        className="w-full px-2 py-1 border rounded text-xs text-gray-900"
                        rows={2}
                      />
                    ) : (
                      <span className="text-xs text-gray-900">{subscription.notes || '-'}</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="p-2">
                    {isEditing ? (
                      <div className="flex gap-1 justify-center">
                        <button
                          onClick={handleSave}
                          className="p-1 bg-green-600 text-white rounded hover:bg-green-700"
                          title="Save"
                        >
                          <Icon path={mdiCheck} size={0.6} />
                        </button>
                        <button
                          onClick={handleCancel}
                          className="p-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                          title="Cancel"
                        >
                          <Icon path={mdiClose} size={0.6} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-1 justify-center">
                        <button
                          onClick={() => handleEdit(subscription)}
                          className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                          title="Edit"
                        >
                          <Icon path={mdiPencil} size={0.6} />
                        </button>
                        <button
                          onClick={() => handleDelete(subscription)}
                          className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
                          title="Unsubscribe"
                        >
                          <Icon path={mdiDelete} size={0.6} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredSubscriptions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm
              ? 'No subscriptions found matching your search'
              : `No companies subscribed to ${selectedYear} yet. Click "Subscribe Company" to add one.`}
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-900">
          <strong>Statistics for {selectedYear}:</strong> {subscriptions.length} subscribed companies
        </div>
      </div>
    </div>
  );
}
