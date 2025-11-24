import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import useEventSubscriptions from '../../hooks/useEventSubscriptions';
import useCompanies from '../../hooks/useCompanies';
import useAssignments from '../../hooks/useAssignments';
import { useMarkerGlyphs } from '../../hooks/useMarkerGlyphs';
import Icon from '@mdi/react';
import { mdiPlus, mdiPencil, mdiDelete, mdiCheck, mdiClose, mdiMagnify, mdiArchive, mdiContentCopy, mdiChevronUp, mdiChevronDown } from '@mdi/js';
import { getLogoPath } from '../../utils/getLogoPath';
import { useOrganizationLogo } from '../../contexts/OrganizationLogoContext';
import { supabase } from '../../supabaseClient';
import { useDialog } from '../../contexts/DialogContext';

/**
 * EventSubscriptionsTab - Manage year-specific company subscriptions with event logistics
 * Shows subscribed companies for the selected year with contact info, booth requirements, and meal counts
 */
export default function EventSubscriptionsTab({ selectedYear }) {
  const { t } = useTranslation();
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
  const { markers, loading: loadingMarkers } = useMarkerGlyphs(selectedYear);

  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isAdding, setIsAdding] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [sortBy, setSortBy] = useState('company'); // 'company' or 'booths'
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'

  // Dialog context
  const { confirm, toastError, toastSuccess, toastWarning } = useDialog();

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

  // Calculate totals for numeric columns
  const totals = useMemo(() => {
    return filteredSubscriptions.reduce((acc, sub) => {
      acc.booth_count += sub.booth_count || 0;
      acc.breakfast_sat += sub.breakfast_sat || 0;
      acc.lunch_sat += sub.lunch_sat || 0;
      acc.bbq_sat += sub.bbq_sat || 0;
      acc.breakfast_sun += sub.breakfast_sun || 0;
      acc.lunch_sun += sub.lunch_sun || 0;
      acc.coins += sub.coins || 0;
      return acc;
    }, {
      booth_count: 0,
      breakfast_sat: 0,
      lunch_sat: 0,
      bbq_sat: 0,
      breakfast_sun: 0,
      lunch_sun: 0,
      coins: 0
    });
  }, [filteredSubscriptions]);

  // Start editing
  const handleEdit = (subscription) => {
    setEditingId(subscription.id);
    setEditForm({ ...subscription });
  };

  // Save edited subscription
  const handleSave = async () => {
    const { id, company, ...updates } = editForm;
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

    const confirmed = await confirm({
      title: 'Unsubscribe Company',
      message: `Unsubscribe ${companyName} from ${selectedYear}? This will delete their subscription${assignmentInfo}.`,
      confirmText: 'Unsubscribe',
      variant: 'danger',
    });
    if (!confirmed) {
      return;
    }
    const { error } = await unsubscribeCompany(subscription.id);
    if (error) {
      toastError(`Error unsubscribing company: ${error}`);
    }
  };

  // Add new subscription
  const handleAdd = async () => {
    if (!selectedCompanyId) {
      toastWarning('Please select a company');
      return;
    }

    const { error } = await subscribeCompany(parseInt(selectedCompanyId));
    if (!error) {
      setIsAdding(false);
      setSelectedCompanyId('');
    } else {
      toastError(`Error subscribing company: ${error}`);
    }
  };

  // Archive current year
  const handleArchive = async () => {
    const confirmed = await confirm({
      title: 'Archive Subscriptions',
      message: `Archive all subscriptions for ${selectedYear}? This will move them to the archive and clear the active list.`,
      confirmText: 'Archive',
      variant: 'warning',
    });
    if (!confirmed) {
      return;
    }
    const { data, error } = await archiveCurrentYear();
    if (error) {
      toastError(`Error archiving: ${error}`);
    } else {
      toastSuccess(`Archived ${data} subscriptions for ${selectedYear}`);
    }
  };

  // Copy from previous year
  const handleCopyFromPreviousYear = async () => {
    const previousYear = selectedYear - 1;
    const confirmed = await confirm({
      title: 'Copy Subscriptions',
      message: `Copy all subscriptions from ${previousYear} to ${selectedYear}?`,
      confirmText: 'Copy',
      variant: 'default'
    });
    if (!confirmed) return;

    const { error } = await copyFromPreviousYear(previousYear);
    if (error) {
      toastError(`Error copying subscriptions: ${error}`);
    } else {
      toastSuccess(`Subscriptions copied from ${previousYear} to ${selectedYear}`);
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
    <div className="h-full flex flex-col p-4">
      {/* Header with search and action buttons */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Icon path={mdiMagnify} size={1} className="text-gray-500" />
          <input
            type="text"
            placeholder={t('helpPanel.subscriptions.searchPlaceholder')}
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
        <div className="mb-4 p-4 border rounded-lg bg-blue-50 flex-shrink-0">
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
      <div className="flex-1 overflow-auto border rounded-lg">
        <table className="w-full" style={{ fontSize: '11px' }}>
          <thead className="bg-gray-100 text-gray-900 sticky top-0 z-10">
            {/* Main header row with grouped columns */}
            <tr>
              {/* Booths - First column with sort */}
              <th
                className="p-2 text-left border-b cursor-pointer hover:bg-gray-200 select-none bg-gray-100"
                onClick={() => handleSort('booths')}
                title="Click to sort by booth labels"
                rowSpan={3}
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
                className="p-2 text-left border-b cursor-pointer hover:bg-gray-200 select-none bg-gray-100"
                onClick={() => handleSort('company')}
                title="Click to sort by company name"
                rowSpan={3}
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
              <th className="p-2 text-left border-b bg-gray-100" rowSpan={3}>{t('helpPanel.subscriptions.contact')}</th>
              <th className="p-2 text-left border-b bg-gray-100" rowSpan={3}>{t('helpPanel.subscriptions.phone')}</th>
              <th className="p-2 text-left border-b bg-gray-100" rowSpan={3}>{t('helpPanel.subscriptions.email')}</th>
              <th className="p-2 text-center border-b bg-gray-100">{t('helpPanel.subscriptions.boothCount')}</th>
              <th className="p-2 text-left border-b bg-gray-100" rowSpan={3}>{t('helpPanel.subscriptions.area')}</th>
              <th className="p-2 text-center border-b bg-blue-50" colSpan={3}>
                <span className="font-bold text-blue-700">{t('helpPanel.subscriptions.saturday')}</span>
              </th>
              <th className="p-2 text-center border-b bg-gray-100" colSpan={2}>
                <span className="font-bold text-green-700">{t('helpPanel.subscriptions.sunday')}</span>
              </th>
              <th className="p-2 text-center border-b bg-gray-100">{t('helpPanel.subscriptions.coins')}</th>
              <th className="p-2 text-left border-b bg-gray-100" rowSpan={3}>{t('helpPanel.subscriptions.notes')}</th>
              <th className="p-2 text-center border-b bg-gray-100" rowSpan={3} style={{ minWidth: '80px' }}>{t('helpPanel.subscriptions.actions')}</th>
            </tr>
            {/* Sub-header row for meals */}
            <tr>
              <th className="p-1 text-center border-b bg-gray-100 text-xs" style={{ width: '60px' }}></th>
              <th className="p-1 text-center border-b bg-blue-50 text-xs" style={{ width: '60px' }}>{t('helpPanel.subscriptions.breakfast')}</th>
              <th className="p-1 text-center border-b bg-blue-50 text-xs" style={{ width: '60px' }}>{t('helpPanel.subscriptions.lunch')}</th>
              <th className="p-1 text-center border-b bg-blue-50 text-xs" style={{ width: '60px' }}>{t('helpPanel.subscriptions.bbq')}</th>
              <th className="p-1 text-center border-b bg-green-50 text-xs" style={{ width: '60px' }}>{t('helpPanel.subscriptions.breakfast')}</th>
              <th className="p-1 text-center border-b bg-green-50 text-xs" style={{ width: '60px' }}>{t('helpPanel.subscriptions.lunch')}</th>
              <th className="p-1 text-center border-b bg-gray-100 text-xs" style={{ width: '60px' }}></th>
            </tr>
            {/* Totals row */}
            <tr>
              <th className="p-1 text-center border-b bg-gray-200 text-xs font-bold" style={{ width: '60px' }}>{totals.booth_count}</th>
              <th className="p-1 text-center border-b bg-blue-100 text-xs font-bold text-blue-800" style={{ width: '60px' }}>{totals.breakfast_sat}</th>
              <th className="p-1 text-center border-b bg-blue-100 text-xs font-bold text-blue-800" style={{ width: '60px' }}>{totals.lunch_sat}</th>
              <th className="p-1 text-center border-b bg-blue-100 text-xs font-bold text-blue-800" style={{ width: '60px' }}>{totals.bbq_sat}</th>
              <th className="p-1 text-center border-b bg-green-100 text-xs font-bold text-green-800" style={{ width: '60px' }}>{totals.breakfast_sun}</th>
              <th className="p-1 text-center border-b bg-green-100 text-xs font-bold text-green-800" style={{ width: '60px' }}>{totals.lunch_sun}</th>
              <th className="p-1 text-center border-b bg-gray-200 text-xs font-bold" style={{ width: '60px' }}>{totals.coins}</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubscriptions.map((subscription) => {
              const isEditing = editingId === subscription.id;
              const company = subscription.company;
              const boothLabels = getBoothLabels(subscription.company_id);

              return (
                <tr key={subscription.id} className="bg-white hover:bg-gray-50 border-b">
                  {/* Assigned booths - First column */}
                  <td className="p-2 text-left">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
                      {boothLabels}
                    </span>
                  </td>

                  {/* Company name with logo - Second column */}
                  <td className="p-2 text-left">
                    <div className="flex items-center gap-2">
                      <img
                        src={getLogoPath(company?.logo || organizationLogo)}
                        alt={company?.name}
                        className="w-8 h-8 object-contain"
                      />
                      <span className="font-semibold text-gray-700">{company?.name}</span>
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="p-2 text-left">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.contact || ''}
                        onChange={(e) => setEditForm({ ...editForm, contact: e.target.value })}
                        className="w-full px-2 py-1 border rounded text-xs bg-white text-gray-900"
                      />
                    ) : (
                      <span className="text-xs text-gray-700">{subscription.contact || '-'}</span>
                    )}
                  </td>

                  {/* Phone */}
                  <td className="p-2 text-left">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.phone || ''}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="w-full px-2 py-1 border rounded text-xs bg-white text-gray-900"
                      />
                    ) : (
                      <span className="text-xs text-gray-700">{subscription.phone || '-'}</span>
                    )}
                  </td>

                  {/* Email */}
                  <td className="p-2 text-left">
                    {isEditing ? (
                      <input
                        type="email"
                        value={editForm.email || ''}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full px-2 py-1 border rounded text-xs bg-white text-gray-900"
                      />
                    ) : (
                      <span className="text-xs text-gray-700">{subscription.email || '-'}</span>
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
                        className="w-16 px-2 py-1 border rounded text-xs text-center bg-white text-gray-900"
                      />
                    ) : (
                      <span className="text-xs text-gray-700">{subscription.booth_count}</span>
                    )}
                  </td>

                  {/* Area */}
                  <td className="p-2">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.area || ''}
                        onChange={(e) => setEditForm({ ...editForm, area: e.target.value })}
                        className="w-full px-2 py-1 border rounded text-xs bg-white text-gray-900"
                        placeholder={t('helpPanel.subscriptions.areaPlaceholder')}
                      />
                    ) : (
                      <span className="text-xs text-gray-700">{subscription.area || '-'}</span>
                    )}
                  </td>

                  {/* Meals - Saturday */}
                  {['breakfast_sat', 'lunch_sat', 'bbq_sat'].map(field => (
                    <td key={field} className="p-2 text-center bg-blue-50">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={editForm[field] || 0}
                          onChange={(e) => setEditForm({ ...editForm, [field]: parseInt(e.target.value) || 0 })}
                          className="w-12 px-1 py-1 border rounded text-xs text-center text-gray-900 bg-white"
                        />
                      ) : (
                        <span className="text-xs text-gray-700">{subscription[field]}</span>
                      )}
                    </td>
                  ))}

                  {/* Meals - Sunday */}
                  {['breakfast_sun', 'lunch_sun'].map(field => (
                    <td key={field} className="p-2 text-center bg-green-50">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={editForm[field] || 0}
                          onChange={(e) => setEditForm({ ...editForm, [field]: parseInt(e.target.value) || 0 })}
                          className="w-12 px-1 py-1 border rounded text-xs text-center text-gray-900 bg-white"
                        />
                      ) : (
                        <span className="text-xs text-gray-700">{subscription[field]}</span>
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
                        className="w-12 px-1 py-1 border rounded text-xs text-center bg-white text-gray-900"
                      />
                    ) : (
                      <span className="text-xs text-gray-700">{subscription.coins}</span>
                    )}
                  </td>

                  {/* Notes */}
                  <td className="p-2 text-left">
                    {isEditing ? (
                      <textarea
                        value={editForm.notes || ''}
                        onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                        className="w-full px-2 py-1 border rounded text-xs bg-white text-gray-900"
                        rows={2}
                      />
                    ) : (
                      <span className="text-xs text-gray-700">{subscription.notes || '-'}</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="p-2 text-center">
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
    </div>
  );
}
