import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import useEventSubscriptions from '../../hooks/useEventSubscriptions';
import useCompanies from '../../hooks/useCompanies';
import useAssignments from '../../hooks/useAssignments';
import { useMarkerGlyphs } from '../../hooks/useMarkerGlyphs';
import Icon from '@mdi/react';
import {
  mdiPlus,
  mdiCheck,
  mdiClose,
  mdiPencil,
  mdiDelete,
  mdiMagnify,
  mdiArchive,
  mdiContentCopy,
  mdiChevronUp,
  mdiChevronDown,
} from '@mdi/js';
import { getLogoPath, getResponsiveLogoSources } from '../../utils/getLogoPath';
import { useOrganizationLogo } from '../../contexts/OrganizationLogoContext';
import { supabase } from '../../supabaseClient';
import { useDialog } from '../../contexts/DialogContext';
import { formatPhoneForDisplay, getPhoneFlag } from '../../utils/formatPhone';
import ExportButton from '../common/ExportButton';
import ImportButton from '../common/ImportButton';
import SubscriptionEditModal from './SubscriptionEditModal';
import {
  addLineItem,
  deactivateLineItem,
  getActiveLineItems,
  appendHistory,
  formatHistoryTimestamp,
} from '../../utils/subscriptionLineItems';

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
    reload,
  } = useEventSubscriptions(selectedYear);

  const { companies } = useCompanies();
  const { assignments, reload: reloadAssignments } = useAssignments(selectedYear);
  const { markers, loading: loadingMarkers } = useMarkerGlyphs(selectedYear);

  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [sortBy, setSortBy] = useState('company'); // 'company' or 'booths'
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [notesExpandedIds, setNotesExpandedIds] = useState(new Set());

  // Modal state for editing
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState(null);

  // Subscription history-selection modal state
  const [subHistoryModal, setSubHistoryModal] = useState(null);
  const [subHistorySelection, setSubHistorySelection] = useState([]);

  // Merge-add modal state (adding counts to existing subscription)
  const MERGE_FIELDS = [
    { key: 'booth_count',   label: 'Booths',           col: 'bg-gray-50' },
    { key: 'breakfast_sat', label: 'Breakfast (Sat)',  col: 'bg-blue-50' },
    { key: 'lunch_sat',     label: 'Lunch (Sat)',      col: 'bg-blue-50' },
    { key: 'bbq_sat',       label: 'BBQ (Sat)',        col: 'bg-blue-50' },
    { key: 'breakfast_sun', label: 'Breakfast (Sun)',  col: 'bg-green-50' },
    { key: 'lunch_sun',     label: 'Lunch (Sun)',      col: 'bg-green-50' },
  ];
  const [mergeModal, setMergeModal] = useState(null); // { subscription } | null
  const [mergeValues, setMergeValues] = useState({});

  // Dialog context
  const { confirm, toastError, toastSuccess, toastWarning } = useDialog();

  // Get list of all companies for the add selector (subscribed ones can still be merged)
  const availableCompanies = useMemo(() => {
    return [...companies].sort((a, b) => a.name.localeCompare(b.name));
  }, [companies]);

  // Get booth assignments for each subscription
  const subscriptionAssignments = useMemo(() => {
    const map = {};
    assignments.forEach((assignment) => {
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
    markers.forEach((marker) => {
      map[marker.id] = marker.glyph;
    });
    return map;
  }, [markers]);

  // Get booth labels for a subscription (actual glyph text)
  const getBoothLabels = useCallback(
    (companyId) => {
      const companyAssignments = subscriptionAssignments[companyId] || [];
      if (companyAssignments.length === 0) return '-';

      // Get all booth labels for this company, sorted by marker_id
      const labels = companyAssignments
        .sort((a, b) => a.marker_id - b.marker_id)
        .map(
          (assignment) => markerGlyphMap[assignment.marker_id] || assignment.marker_id.toString(),
        )
        .filter(Boolean);

      return labels.length > 0 ? labels.join(', ') : '-';
    },
    [subscriptionAssignments, markerGlyphMap],
  );

  // Filter and sort subscriptions
  const filteredSubscriptions = useMemo(() => {
    let filtered = subscriptions;

    // Apply search filter
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      filtered = filtered.filter((sub) =>
        sub.company?.name?.toLowerCase().includes(lowercasedTerm),
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
    return filteredSubscriptions.reduce(
      (acc, sub) => {
        acc.booth_count += sub.booth_count || 0;
        acc.breakfast_sat += sub.breakfast_sat || 0;
        acc.lunch_sat += sub.lunch_sat || 0;
        acc.bbq_sat += sub.bbq_sat || 0;
        acc.breakfast_sun += sub.breakfast_sun || 0;
        acc.lunch_sun += sub.lunch_sun || 0;
        acc.coins += sub.coins || 0;
        return acc;
      },
      {
        booth_count: 0,
        breakfast_sat: 0,
        lunch_sat: 0,
        bbq_sat: 0,
        breakfast_sun: 0,
        lunch_sun: 0,
        coins: 0,
      },
    );
  }, [filteredSubscriptions]);

  // Start editing - open modal
  const handleEdit = (subscription) => {
    setEditingSubscription(subscription);
    setIsEditModalOpen(true);
  };

  // Save from modal
  const handleModalSave = async (updates) => {
    const sub = editingSubscription;

    // Build a human-readable summary of what changed
    const FIELD_LABELS = {
      booth_count: 'Booths',
      area: 'Area',
      breakfast_sat: 'Breakfast (Sat)',
      lunch_sat: 'Lunch (Sat)',
      bbq_sat: 'BBQ (Sat)',
      breakfast_sun: 'Breakfast (Sun)',
      lunch_sun: 'Lunch (Sun)',
      coins: 'Coins',
      notes: 'Notes',
    };
    const changes = Object.entries(FIELD_LABELS)
      .filter(([key]) => key in updates && String(updates[key] ?? '') !== String(sub[key] ?? ''))
      .map(([key, label]) => `${label}: ${sub[key] ?? ''} → ${updates[key] ?? ''}`);

    if (changes.length === 0) {
      setIsEditModalOpen(false);
      setEditingSubscription(null);
      return;
    }

    try {
      // Append history line
      await appendHistory(sub.id, 'Manually edited on ' + formatHistoryTimestamp() + ': ' + changes.join(', '));

      // Create edit line item with count deltas (if any count changed)
      // Coins is intentionally excluded — it bypasses line items and is updated directly.
      const COUNT_FIELDS = ['booth_count', 'breakfast_sat', 'lunch_sat', 'bbq_sat', 'breakfast_sun', 'lunch_sun'];
      const countDeltas = {};
      let hasCountChange = false;
      for (const field of COUNT_FIELDS) {
        if (field in updates) {
          const delta = (updates[field] || 0) - (sub[field] || 0);
          if (delta !== 0) {
            countDeltas[field] = delta;
            hasCountChange = true;
          }
        }
      }

      // Detect area/notes changes
      const areaChanged = 'area' in updates && updates.area !== sub.area;
      const notesChanged = 'notes' in updates && updates.notes !== sub.notes;

      // Coins bypasses the line-item system — update directly on the subscription.
      // Must run AFTER addLineItem because recalculateTotals now computes
      // coins = booth_count × default_coins; an explicit manual edit overrides that.
      const coinsChanged = 'coins' in updates && Number(updates.coins || 0) !== Number(sub.coins || 0);

      if (hasCountChange || areaChanged || notesChanged) {
        await addLineItem(sub.id, {
          source: 'edit',
          counts: countDeltas,
          area: areaChanged ? updates.area : undefined,
          notes: notesChanged ? updates.notes : undefined,
          description: 'Manually edited: ' + changes.join(', '),
        });
      }

      if (coinsChanged) {
        await updateSubscription(sub.id, { coins: Number(updates.coins) || 0 });
      }

      setIsEditModalOpen(false);
      setEditingSubscription(null);
      toastSuccess('Subscription updated successfully');
    } catch (e) {
      toastError('Error updating subscription: ' + (e?.message || String(e)));
    }
  };

  // Close modal
  const handleModalClose = () => {
    setIsEditModalOpen(false);
    setEditingSubscription(null);
  };

  // Delete subscription
  const handleDelete = async (subscription) => {
    const companyName = subscription.company?.name || 'this company';
    const boothLabels = getBoothLabels(subscription.company_id);
    const assignmentInfo = boothLabels && boothLabels !== '-' ? ` and their booth assignments (${boothLabels})` : '';

    // Helper: revert all invoices for a company — resets approved/rejected line items back to
    // pending in notes, and resets the invoice-level status if it was approved/partially_approved.
    const revertInvoicesForCompany = async (companyId) => {
      try {
        const { data: allInvoices } = await supabase
          .from('staged_invoices')
          .select('id, status, notes')
          .eq('company_id', companyId);
        if (!allInvoices || allInvoices.length === 0) return;
        for (const inv of allInvoices) {
          let notes = {};
          try { notes = JSON.parse(inv.notes || '{}'); } catch (_) {}
          const hasApprovedItems = notes.line_items?.some(
            (item) => item.status === 'approved' || item.status === 'rejected',
          );
          const needsStatusReset =
            inv.status === 'approved' || inv.status === 'partially_approved';
          if (!hasApprovedItems && !needsStatusReset) continue;
          if (notes.line_items) {
            notes.line_items = notes.line_items.map((item) => ({ ...item, status: 'pending' }));
          }
          const updatePayload = { notes: JSON.stringify(notes), updated_at: new Date().toISOString() };
          if (needsStatusReset) updatePayload.status = 'pending';
          await supabase.from('staged_invoices').update(updatePayload).eq('id', inv.id);
        }
      } catch (_) {}
    };

    // Helper: revert invoice line items matching specific subscription line item records
    const revertLineItemInvoices = async (companyId, lineItems) => {
      const invoiceItems = lineItems.filter(li => li.source === 'invoice' && li.source_ref);
      const byInvoice = {};
      for (const li of invoiceItems) {
        if (!byInvoice[li.source_ref]) byInvoice[li.source_ref] = [];
        byInvoice[li.source_ref].push(li);
      }
      for (const [invoiceNumber, items] of Object.entries(byInvoice)) {
        try {
          const { data: invRows } = await supabase
            .from('staged_invoices')
            .select('id, status, notes')
            .eq('invoice_number', invoiceNumber)
            .eq('company_id', companyId);
          if (!invRows || invRows.length === 0) continue;
          for (const inv of invRows) {
            let notes = {};
            try { notes = JSON.parse(inv.notes || '{}'); } catch (_) {}
            if (!notes.line_items) continue;
            let changed = false;
            const itemDescs = items.map(li => (li.description || '').toLowerCase());
            notes.line_items = notes.line_items.map((item) => {
              const desc = (item.item || item.description || '').toLowerCase();
              const matches = itemDescs.some(d => desc.includes(d) || d.includes(desc));
              if (matches && item.status !== 'pending') {
                changed = true;
                return { ...item, status: 'pending' };
              }
              return item;
            });
            if (!changed) continue;
            const allResolved = notes.line_items.length > 0 &&
              notes.line_items.every(i => i.status === 'approved' || i.status === 'rejected');
            const allApproved = allResolved && notes.line_items.every(i => i.status === 'approved');
            let newStatus = inv.status;
            if (inv.status === 'approved' || inv.status === 'partially_approved') {
              newStatus = allResolved ? (allApproved ? 'approved' : 'partially_approved') : 'pending';
            }
            const updatePayload = { notes: JSON.stringify(notes), updated_at: new Date().toISOString() };
            if (newStatus !== inv.status) updatePayload.status = newStatus;
            await supabase.from('staged_invoices').update(updatePayload).eq('id', inv.id);
          }
        } catch (_) {}
      }
    };

    // Fetch active line items for this subscription
    const activeItems = await getActiveLineItems(subscription.id);

    if (activeItems.length > 1) {
      // Multiple line items — let user choose which to remove
      await new Promise((resolve) => {
        setSubHistorySelection(activeItems.map(li => li.id));
        setSubHistoryModal({
          sub: subscription,
          companyName,
          lineItems: activeItems,
          onConfirm: async (selectedIds) => {
            setSubHistoryModal(null);
            const removeAll = selectedIds.length === activeItems.length;
            try {
              if (removeAll) {
                const { error } = await unsubscribeCompany(subscription.id);
                if (error) throw new Error(error);
                await reloadAssignments(true);
                await revertInvoicesForCompany(subscription.company_id);
                toastSuccess('Subscription deleted.');
              } else {
                const selectedItems = activeItems.filter(li => selectedIds.includes(li.id));
                for (const li of selectedItems) {
                  await deactivateLineItem(li.id);
                }
                await revertLineItemInvoices(subscription.company_id, selectedItems);
                for (const li of selectedItems) {
                  await appendHistory(subscription.id,
                    'Removed on ' + formatHistoryTimestamp() + ': ' + (li.description || 'Line item #' + li.id));
                }
                const remaining = await getActiveLineItems(subscription.id);
                if (remaining.length === 0) {
                  await unsubscribeCompany(subscription.id);
                  await reloadAssignments(true);
                  toastSuccess('Subscription deleted.');
                } else {
                  toastSuccess('Selected items removed.');
                }
              }
            } catch (e) {
              toastError('Failed to update subscription: ' + (e?.message || String(e)));
            }
            resolve();
          },
          onCancel: () => {
            setSubHistoryModal(null);
            resolve();
          },
        });
      });
      return;
    }

    // Single or no line items — simple confirm
    const confirmed = await confirm({
      title: t('helpPanel.subscriptions.unsubscribeCompany', 'Unsubscribe Company'),
      message: t(
        'helpPanel.subscriptions.unsubscribeMessage',
        'Unsubscribe {{companyName}} from {{year}}? This will delete their subscription{{assignmentInfo}}.',
        { companyName, year: selectedYear, assignmentInfo },
      ),
      confirmText: t('helpPanel.subscriptions.unsubscribeConfirm', 'Unsubscribe'),
      variant: 'danger',
    });
    if (!confirmed) return;
    if (activeItems.length === 1) {
      await deactivateLineItem(activeItems[0].id);
    }
    const { error } = await unsubscribeCompany(subscription.id);
    if (error) {
      toastError(`Error unsubscribing company: ${error}`);
    } else {
      await reloadAssignments(true);
      await revertInvoicesForCompany(subscription.company_id);
    }
  };

  // Add new subscription
  const handleAdd = async () => {
    if (!selectedCompanyId) {
      toastWarning('Please select a company');
      return;
    }

    const companyIdInt = parseInt(selectedCompanyId);
    const existing = subscriptions.find((s) => s.company_id === companyIdInt);

    if (existing) {
      // Company already subscribed — open merge modal
      const initial = {};
      MERGE_FIELDS.forEach((f) => { initial[f.key] = 0; });
      setMergeValues(initial);
      setMergeModal({ subscription: existing });
      return;
    }

    const { error } = await subscribeCompany(companyIdInt, {
      history: 'Manually added on ' + new Date().toLocaleDateString('en-GB'),
    });
    if (!error) {
      setIsAdding(false);
      setSelectedCompanyId('');
    } else {
      toastError(`Error subscribing company: ${error}`);
    }
  };

  const handleMergeConfirm = async () => {
    if (!mergeModal) return;
    const { subscription } = mergeModal;
    const hasAny = MERGE_FIELDS.some((f) => (mergeValues[f.key] || 0) > 0);
    if (!hasAny) {
      toastWarning('Enter at least one value to add.');
      return;
    }
    const addedParts = MERGE_FIELDS
      .filter((f) => (mergeValues[f.key] || 0) > 0)
      .map((f) => f.label + ' +' + mergeValues[f.key])
      .join(', ');
    try {
      await addLineItem(subscription.id, {
        source: 'manual',
        counts: {
          booth_count: mergeValues.booth_count || 0,
          breakfast_sat: mergeValues.breakfast_sat || 0,
          lunch_sat: mergeValues.lunch_sat || 0,
          bbq_sat: mergeValues.bbq_sat || 0,
          breakfast_sun: mergeValues.breakfast_sun || 0,
          lunch_sun: mergeValues.lunch_sun || 0,
        },
        description: 'Manually added: ' + addedParts,
      });
      await appendHistory(subscription.id,
        'Manually added on ' + formatHistoryTimestamp() + ': ' + addedParts);
      toastSuccess('Subscription updated.');
      setMergeModal(null);
      setIsAdding(false);
      setSelectedCompanyId('');
      await reload?.();
    } catch (e) {
      toastError('Failed to update subscription: ' + (e?.message || String(e)));
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
      variant: 'default',
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
    <div className="h-full flex flex-col p-4" data-testid="subscriptions-container">
      {/* Header with search and action buttons */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Icon path={mdiMagnify} size={1} className="text-gray-500" />
          <input
            data-testid="subscriptions-search"
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
        <div className="flex gap-2 relative z-50">
          <button
            onClick={() => setIsAdding(true)}
            data-testid="subscribe-company-button"
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Icon path={mdiPlus} size={0.8} />
            {t('helpPanel.subscriptions.subscribeCompany', 'Subscribe Company')}
          </button>

          <div className="relative">
            <button
              onClick={() => setIsActionsOpen(!isActionsOpen)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-all"
              title={t('common.actionsMenu')}
            >
              <span>{t('common.actions')}</span>
              <Icon path={isActionsOpen ? mdiChevronUp : mdiChevronDown} size={0.7} />
            </button>

            {isActionsOpen && (
              <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-1">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                  Data Tools
                </div>

                <ImportButton
                  dataType="event_subscriptions"
                  existingData={subscriptions}
                  eventYear={selectedYear}
                  additionalData={{
                    supabase,
                    selectedYear,
                  }}
                  onImportComplete={async () => {
                    await reload();
                    setIsActionsOpen(false);
                  }}
                  buttonClassName="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 bg-transparent"
                  className="block w-full"
                />

                <ExportButton
                  dataType="event_subscriptions"
                  data={subscriptions}
                  additionalData={{
                    supabase,
                    eventYear: selectedYear,
                  }}
                  filename={`subscriptions-${selectedYear}-${new Date().toISOString().split('T')[0]}`}
                  buttonClassName="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 justify-between bg-transparent"
                  className="block w-full"
                />

                <button
                  onClick={() => {
                    handleCopyFromPreviousYear();
                    setIsActionsOpen(false);
                  }}
                  data-testid="copy-from-previous-year-button"
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  title={`Copy from ${selectedYear - 1}`}
                >
                  <Icon path={mdiContentCopy} size={0.7} className="text-gray-400" />
                  <span>Copy from {selectedYear - 1}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add new subscription form */}
      {isAdding && (
        <div className="mb-4 p-4 border rounded-lg bg-blue-50 flex-shrink-0">
          <h3 className="font-bold mb-3">
            {t('helpPanel.subscriptions.subscribeCompanyTo', 'Subscribe Company to {{year}}', {
              year: selectedYear,
            })}
          </h3>
          <div className="flex items-center gap-3">
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="flex-1 px-3 py-2 border rounded"
            >
              <option value="">Select a company...</option>
              {availableCompanies.map((company) => {
                const alreadySubscribed = subscriptions.some((s) => s.company_id === company.id);
                return (
                  <option key={company.id} value={company.id}>
                    {company.name}{alreadySubscribed ? ' (already subscribed — add more)' : ''}
                  </option>
                );
              })}
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
            <p className="text-sm text-gray-600 mt-2">No companies found.</p>
          )}
        </div>
      )}

      {/* Subscriptions table */}
      <div className="flex-1 overflow-auto border rounded-lg" data-testid="subscriptions-table">
        <table className="w-full" style={{ fontSize: '11px' }}>
          <thead className="bg-gray-100 text-gray-900 sticky top-0 z-10">
            {/* Main header row with grouped columns */}
            <tr>
              {/* Expand toggle column */}
              <th className="p-2 border-b bg-gray-100" style={{ width: '28px' }} rowSpan={3} />
              {/* Booths - with sort */}
              <th
                className="p-2 text-left border-b cursor-pointer hover:bg-gray-200 select-none bg-gray-100"
                onClick={() => handleSort('booths')}
                title="Click to sort by booth labels"
                rowSpan={3}
              >
                <div className="flex items-center gap-1">
                  <span>{t('helpPanel.subscriptions.booths', 'Booths')}</span>
                  {sortBy === 'booths' && (
                    <Icon path={sortDirection === 'asc' ? mdiChevronUp : mdiChevronDown} size={0.6} className="text-blue-600" />
                  )}
                </div>
              </th>
              {/* Company - with sort */}
              <th
                className="p-2 text-left border-b cursor-pointer hover:bg-gray-200 select-none bg-gray-100"
                onClick={() => handleSort('company')}
                title="Click to sort by company name"
                rowSpan={3}
              >
                <div className="flex items-center gap-1">
                  <span>{t('helpPanel.subscriptions.company', 'Company')}</span>
                  {sortBy === 'company' && (
                    <Icon path={sortDirection === 'asc' ? mdiChevronUp : mdiChevronDown} size={0.6} className="text-blue-600" />
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
              <th className="p-2 text-center border-b bg-gray-100" rowSpan={3} style={{ minWidth: '80px' }}>
                {t('helpPanel.subscriptions.actions')}
              </th>
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
              const company = subscription.company;
              const boothLabels = getBoothLabels(subscription.company_id);
              const isHistoryExpanded = expandedIds.has(subscription.id);
              const isNotesExpanded = notesExpandedIds.has(subscription.id);
              const historyLines = (subscription.history || '')
                .split('\n')
                .map((l) => l.trim())
                .filter((l) => l.length > 0)
                .reverse();
              // count visible columns for the colspan on the expanded rows
              const colSpan = 14;
              const toggleNotes = () => {
                setNotesExpandedIds((prev) => {
                  const next = new Set(prev);
                  if (next.has(subscription.id)) next.delete(subscription.id);
                  else next.add(subscription.id);
                  return next;
                });
              };

              return (
                <React.Fragment key={subscription.id}>
                  <tr
                    className={`hover:bg-gray-50 border-b align-top cursor-pointer ${isNotesExpanded ? 'bg-amber-50/40' : 'bg-white'}`}
                    onClick={(e) => {
                      if (e.target.closest('[data-history-toggle]') || e.target.closest('[data-actions]')) return;
                      toggleNotes();
                    }}
                  >
                    {/* History expand toggle */}
                    <td className="p-1 text-center">
                      <button
                        data-history-toggle
                        onClick={() =>
                          setExpandedIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(subscription.id)) next.delete(subscription.id);
                            else next.add(subscription.id);
                            return next;
                          })
                        }
                        className="text-gray-400 hover:text-gray-700"
                        title={isHistoryExpanded ? 'Hide history' : 'Show history'}
                      >
                        <Icon path={isHistoryExpanded ? mdiChevronUp : mdiChevronDown} size={0.6} />
                      </button>
                    </td>

                    {/* Assigned booths */}
                    <td className="p-2 text-left">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
                        {boothLabels}
                      </span>
                    </td>

                    {/* Company name with logo */}
                    <td className="p-2 text-left">
                      <div className="flex items-center gap-2">
                        <img
                          {...(() => {
                            const source = company?.logo || organizationLogo;
                            const s = getResponsiveLogoSources(source);
                            if (s) return { src: s.src, srcSet: s.srcSet, sizes: s.sizes };
                            return { src: getLogoPath(source) };
                          })()}
                          alt={company?.name}
                          className="w-8 h-8 object-contain"
                        />
                        <span className="font-semibold text-gray-700">{company?.name}</span>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="p-2 text-left">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-gray-700">{subscription.contact || '-'}</span>
                        {company?.contact_name && company.contact_name !== subscription.contact && (
                          <span className="text-xs text-gray-400 border-t border-gray-200 pt-0.5">{company.contact_name}</span>
                        )}
                        {company?.contact_name_2 && company.contact_name_2 !== (company.contact_name || subscription.contact) && (
                          <span className="text-xs text-gray-400 border-t border-gray-200 pt-0.5">{company.contact_name_2}</span>
                        )}
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="p-2 text-left">
                      <div className="flex flex-col gap-0.5">
                        {subscription.phone ? (
                          <span className="text-xs text-gray-700 flex items-center gap-1">
                            <span>{getPhoneFlag(subscription.phone)}</span>
                            <span>{formatPhoneForDisplay(subscription.phone)}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                        {company?.contact_phone && company.contact_phone !== subscription.phone && (
                          <span className="text-xs text-gray-400 flex items-center gap-1 border-t border-gray-200 pt-0.5">
                            <span>{getPhoneFlag(company.contact_phone)}</span>
                            <span>{formatPhoneForDisplay(company.contact_phone)}</span>
                          </span>
                        )}
                        {company?.contact_phone_2 && company.contact_phone_2 !== (company.contact_phone || subscription.phone) && (
                          <span className="text-xs text-gray-400 flex items-center gap-1 border-t border-gray-200 pt-0.5">
                            <span>{getPhoneFlag(company.contact_phone_2)}</span>
                            <span>{formatPhoneForDisplay(company.contact_phone_2)}</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Email */}
                    <td className="p-2 text-left">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-gray-700">{subscription.email || '-'}</span>
                        {company?.contact_email && company.contact_email !== subscription.email && (
                          <span className="text-xs text-gray-400 border-t border-gray-200 pt-0.5">{company.contact_email}</span>
                        )}
                        {company?.contact_email_2 && company.contact_email_2 !== (company.contact_email || subscription.email) && (
                          <span className="text-xs text-gray-400 border-t border-gray-200 pt-0.5">{company.contact_email_2}</span>
                        )}
                      </div>
                    </td>

                    {/* Booth Count */}
                    <td className="p-2 text-center">
                      <span className="text-xs text-gray-700">{subscription.booth_count}</span>
                    </td>

                    {/* Area */}
                    <td className="p-2">
                      <span className="text-xs text-gray-700">{subscription.area || '-'}</span>
                    </td>

                    {/* Meals - Saturday */}
                    {['breakfast_sat', 'lunch_sat', 'bbq_sat'].map((field) => (
                      <td key={field} className="p-2 text-center bg-blue-50">
                        <span className="text-xs text-gray-700">{subscription[field]}</span>
                      </td>
                    ))}

                    {/* Meals - Sunday */}
                    {['breakfast_sun', 'lunch_sun'].map((field) => (
                      <td key={field} className="p-2 text-center bg-green-50">
                        <span className="text-xs text-gray-700">{subscription[field]}</span>
                      </td>
                    ))}

                    {/* Coins */}
                    <td className="p-2 text-center">
                      <span className="text-xs text-gray-700">{subscription.coins}</span>
                    </td>

                    {/* Actions */}
                    <td className="p-2 text-center" data-actions>
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
                    </td>
                  </tr>

                  {/* Expandable notes row (click row to toggle) */}
                  {isNotesExpanded && subscription.notes && (
                    <tr className="bg-amber-50/60 border-b">
                      <td colSpan={colSpan} className="px-8 py-2 text-left">
                        <p className="text-xs text-gray-700 whitespace-pre-wrap">{subscription.notes}</p>
                      </td>
                    </tr>
                  )}

                  {/* Expandable history row (arrow to toggle) */}
                  {isHistoryExpanded && (
                    <tr className="bg-gray-50 border-b">
                      <td colSpan={colSpan} className="px-8 py-3 text-left">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 text-left">History</p>
                        {historyLines.length === 0 ? (
                          <p className="text-xs text-gray-400 text-left">No history recorded.</p>
                        ) : (
                          <ul className="space-y-1">
                            {historyLines.map((line, i) => (
                              <li
                                key={i}
                                className={`text-xs px-2 py-1 rounded ${
                                  line.startsWith('[')
                                    ? 'text-gray-400 bg-gray-100'
                                    : 'text-gray-700 bg-white border border-gray-200'
                                }`}
                              >
                                {line}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>

        {filteredSubscriptions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm
              ? t('admin.noSearchResults', 'No subscriptions found matching your search')
              : t(
                  'helpPanel.subscriptions.noCompaniesSubscribed',
                  'No companies subscribed to {{year}} yet. Click "Subscribe Company" to add one.',
                  { year: selectedYear },
                )}
          </div>
        )}
      </div>

      {/* Merge-add modal: add counts to an already-subscribed company */}
      {mergeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Add to {mergeModal.subscription.company?.name || 'Existing Subscription'}</h2>
              <p className="text-sm text-gray-500 mt-1">
                <strong>{mergeModal.subscription.company?.name}</strong> is already subscribed for <strong>{mergeModal.subscription.event_year}</strong>.
                Enter the amounts to add to their current subscription.
              </p>
            </div>
            <div className="px-6 py-4 space-y-3">
              {MERGE_FIELDS.map((f) => (
                <div key={f.key} className={`flex items-center justify-between rounded px-3 py-2 ${f.col}`}>
                  <span className="text-sm font-medium text-gray-700">
                    {f.label}
                    <span className="ml-2 text-xs text-gray-400">
                      (current: {mergeModal.subscription[f.key] || 0})
                    </span>
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={mergeValues[f.key] || ''}
                    onChange={(e) =>
                      setMergeValues((prev) => ({
                        ...prev,
                        [f.key]: Math.max(0, parseInt(e.target.value) || 0),
                      }))
                    }
                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => { setMergeModal(null); }}
                className="px-4 py-2 rounded font-medium text-sm border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleMergeConfirm}
                className="px-4 py-2 rounded font-medium text-sm bg-green-600 hover:bg-green-700 text-white"
              >
                Add to subscription
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Line Item Selection Modal */}
      {subHistoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Remove Subscription Contributions</h2>
              <p className="text-sm text-gray-500 mt-1">
                Select which items to remove for <strong>{subHistoryModal.companyName}</strong>.
                Removing all items will delete the subscription.
              </p>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
              <label className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer border border-gray-200 bg-gray-50">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  checked={subHistorySelection.length === subHistoryModal.lineItems.length}
                  onChange={(e) =>
                    setSubHistorySelection(
                      e.target.checked ? subHistoryModal.lineItems.map(li => li.id) : [],
                    )
                  }
                />
                <span className="text-sm font-semibold text-gray-700">Select all ({subHistoryModal.lineItems.length})</span>
              </label>
              {subHistoryModal.lineItems.map((li) => {
                const countParts = [
                  li.booth_count > 0 && li.booth_count + ' booth(s)',
                  li.breakfast_sat > 0 && li.breakfast_sat + ' breakfast sat',
                  li.lunch_sat > 0 && li.lunch_sat + ' lunch sat',
                  li.bbq_sat > 0 && li.bbq_sat + ' BBQ sat',
                  li.breakfast_sun > 0 && li.breakfast_sun + ' breakfast sun',
                  li.lunch_sun > 0 && li.lunch_sun + ' lunch sun',
                  li.coins > 0 && li.coins + ' coins',
                ].filter(Boolean).join(', ');
                return (
                  <label key={li.id} className="flex items-start gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500 mt-0.5"
                      checked={subHistorySelection.includes(li.id)}
                      onChange={(e) =>
                        setSubHistorySelection((prev) =>
                          e.target.checked ? [...prev, li.id] : prev.filter((id) => id !== li.id),
                        )
                      }
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-gray-800 block">{li.description || li.source + (li.source_ref ? ' — ' + li.source_ref : '')}</span>
                      {countParts && <span className="text-xs text-gray-500 block">{countParts}</span>}
                      {li.area && <span className="text-xs text-blue-600 block">Area: {li.area}</span>}
                      {li.notes && <span className="text-xs text-green-700 block">Notes: {li.notes}</span>}
                    </div>
                  </label>
                );
              })}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={subHistoryModal.onCancel} className="px-4 py-2 rounded font-medium text-sm border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">Cancel</button>
              <button
                disabled={subHistorySelection.length === 0}
                onClick={() => subHistoryModal.onConfirm(subHistorySelection)}
                className={
                  'px-4 py-2 rounded font-medium text-sm ' +
                  (subHistorySelection.length === subHistoryModal.lineItems.length
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-amber-500 hover:bg-amber-600 text-white')
                }
              >
                {subHistorySelection.length === subHistoryModal.lineItems.length
                  ? 'Delete subscription'
                  : `Remove ${subHistorySelection.length} selected`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal — conditionally rendered so it remounts fresh on each open */}
      {isEditModalOpen && editingSubscription && (
        <SubscriptionEditModal
          onClose={handleModalClose}
          subscription={editingSubscription}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
}
