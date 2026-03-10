import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { parsePdfInvoice } from '../../utils/pdfParser';
import { useTranslation } from 'react-i18next';
import { getBaseUrl } from '../../utils/getBaseUrl';
import Icon from '@mdi/react';
import {
  mdiRefresh,
  mdiAlertCircleOutline,
  mdiCheck,
  mdiCancel,
  mdiUpload,
  mdiMagnify,
  mdiChevronUp,
  mdiChevronDown,
  mdiDelete,
} from '@mdi/js';
import useCompanies from '../../hooks/useCompanies';
import useEventSubscriptions from '../../hooks/useEventSubscriptions';
import useOrganizationSettings from '../../hooks/useOrganizationSettings';
import { useDialog } from '../../contexts/DialogContext';

// ── Verification Modal ──────────────────────────────────────────────────
function MatchVerificationModal({ invoice, company, onConfirm, onCancel, onCreateNew }) {
  const [shouldPatch, setShouldPatch] = React.useState(false);
  let inv = {};
  try { inv = JSON.parse(invoice.notes || '{}'); } catch (_) {}

  const fields = [
    { label: 'Company name', inv: invoice.company_name, cmp: company.name },
    { label: 'Contact',      inv: inv.contact_name,     cmp: company.contact_name },
    { label: 'Email',        inv: inv.contact_email,    cmp: company.contact_email || company.email },
    { label: 'Phone',        inv: inv.contact_phone,    cmp: company.contact_phone || company.phone },
    { label: 'Address',      inv: [inv.address_line1, inv.address_line2].filter(Boolean).join(', '), cmp: [company.address_line1, company.address_line2].filter(Boolean).join(', ') },
    { label: 'Postal / City',inv: [inv.postal_code, inv.city].filter(Boolean).join('  '), cmp: [company.postal_code, company.city].filter(Boolean).join('  ') },
    { label: 'Country',      inv: inv.country,          cmp: company.country },
    { label: 'VAT',          inv: inv.vat_number,       cmp: company.vat_number },
  ];

  // Check if any invoice field would fill an empty company field
  const hasPatchableData = fields.some(f => f.inv && !f.cmp);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Confirm company match</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Invoice <span className="font-semibold text-blue-600">{invoice.invoice_number}</span> matches
              &nbsp;<span className="font-semibold text-green-700">{company.name}</span> — verify the details below.
            </p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 p-1 rounded">✕</button>
        </div>

        {/* Side-by-side table */}
        <div className="p-5">
          <div className="grid grid-cols-2 gap-3 mb-1">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 rounded px-3 py-1.5">Invoice data (parsed)</div>
            <div className="text-xs font-bold uppercase tracking-wider text-green-700 bg-green-50 rounded px-3 py-1.5">Company record (database)</div>
          </div>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {fields.map((f, i) => {
              const differs = f.inv && f.cmp && f.inv !== f.cmp;
              const missing = f.inv && !f.cmp;
              return (
                <div key={i} className={`grid grid-cols-[120px_1fr_1fr] text-sm border-b border-gray-100 last:border-0 ${differs ? 'bg-amber-50' : missing ? 'bg-blue-50/30' : ''}`}>
                  <div className="px-3 py-2 font-medium text-gray-500 text-xs flex items-center border-r border-gray-100">{f.label}</div>
                  <div className="px-3 py-2 text-gray-800 border-r border-gray-100 break-all">{f.inv || <span className="text-gray-300">—</span>}</div>
                  <div className={`px-3 py-2 break-all ${differs ? 'text-amber-800' : 'text-gray-800'}`}>
                    {f.cmp || <span className="text-gray-300">—</span>}
                    {differs && <span className="ml-1 text-xs text-amber-600">(differs)</span>}
                    {missing && <span className="ml-1 text-xs text-blue-500">(empty)</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Patch option */}
          {hasPatchableData && (
            <label className="flex items-center gap-2 mt-4 text-sm text-gray-700 cursor-pointer select-none">
              <input type="checkbox" checked={shouldPatch} onChange={e => setShouldPatch(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600" />
              Fill empty company fields from invoice data (contact, address, VAT)
            </label>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <button onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
            Cancel
          </button>
          <div className="flex gap-3">
            <button onClick={onCreateNew}
              className="px-4 py-2 text-sm bg-white text-orange-600 border border-orange-300 rounded-lg hover:bg-orange-50 transition">
              No match — create new company
            </button>
            <button onClick={() => onConfirm(invoice, company, shouldPatch)}
              className="px-5 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm">
              ✓ Confirm match &amp; sync
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
// ── End MatchVerificationModal ──────────────────────────────────────────────

export default function InvoiceSyncTab({ selectedYear }) {
  const baseUrl = getBaseUrl();
  const { t } = useTranslation();
  const { companies } = useCompanies();
  const { settings } = useOrganizationSettings();
  const { subscriptions, subscribeCompany, unsubscribeCompany } =
    useEventSubscriptions(selectedYear);
  const { toastSuccess, toastWarning, toastError, confirm } = useDialog();

  const [invoices, setInvoices] = useState([]);

  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRow = (id) => {
    const next = new Set(expandedRows);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedRows(next);
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [isActionsOpen, setIsActionsOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [verifyModal, setVerifyModal] = useState(null); // { invoice, company } | null
  const fileInputRef = useRef(null);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('staged_invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const sorted = (data || []).sort((a, b) => {
        // Keep everything in original uploaded order, don't move approved to the bottom
        // so users can see the 'subscribed' state on the same row.
        return new Date(b.created_at) - new Date(a.created_at);
      });

      setInvoices(sorted);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(err?.message || 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();

    // Subscribe to realtime changes so the UI clears when the database table is cleared externally
    const channel = supabase
      .channel('staged_invoices_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staged_invoices' }, () => {
        fetchInvoices();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleClearAll = async () => {
    const yes = await confirm({
      title: 'Clear Staging Area',
      message: 'Are you sure you want to delete ALL staged invoices? This cannot be undone.',
      confirmText: 'Clear All',
      cancelText: 'Cancel',
    });

    if (yes) {
      setLoading(true);
      setIsActionsOpen(false);
      try {
        const { error: deleteError } = await supabase
          .from('staged_invoices')
          .delete()
          .not('id', 'is', null);

        if (deleteError) throw deleteError;

        await fetchInvoices();
        toastSuccess('Staging area cleared successfully');
      } catch (err) {
        console.error('Error clearing staged invoices:', err);
        toastError('Failed to clear staged invoices: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    setUploading(true);
    setUploadProgress({ current: 0, total: files.length });
    setIsActionsOpen(false);
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    let duplicateCount = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          // Pass the list of allowed strings from settings (if any exist)
          const allowedItems = settings?.invoice_allowed_items || [];
          const parsedData = await parsePdfInvoice(file, allowedItems);

          // If the parser marked this document as irrelevant (no allowed items found), skip it entirely
          if (parsedData.is_relevant === false) {
            skippedCount++;
            continue;
          }

          const payload = {
            invoice_number:
              parsedData.invoice_number || `UNKNOWN-REF-${Math.floor(Math.random() * 10000)}`,
            company_name: parsedData.company_name,
            email: '',
            phone: '',
            stands_count: parsedData.stands_count,
            meals_count: parsedData.meals_count,
            // store breakdown as well so editing/sync can use real numbers
            breakfast_sat: parsedData.breakfast ?? 0,
            lunch_sat: parsedData.lunch ?? 0,
            bbq_sat: parsedData.bbq ?? 0,
            breakfast_sun: 0,
            lunch_sun: 0,
            area_preference: '',
            notes: JSON.stringify({
              rawNotes: parsedData.opmerkingen || '',
              notes: parsedData.notes || '',
              date: parsedData.invoice_date || '',
              line_items: parsedData.line_items || [],
              client_block: parsedData.client_details || [],
              filename: file.name,
              // Structured fields extracted from the client address block
              contact_name: parsedData.contact_name || null,
              contact_email: parsedData.contact_email || null,
              contact_phone: parsedData.contact_phone || null,
              address_line1: parsedData.address_line1 || null,
              address_line2: parsedData.address_line2 || null,
              postal_code: parsedData.postal_code || null,
              city: parsedData.city || null,
              country: parsedData.country || null,
              vat_number: parsedData.vat_number || null,
            }),
          };

          const { data, error } = await supabase.from('staged_invoices').insert([payload]).select();

          if (!error) {
            successCount++;
          } else if (error.code === '23505') {
            // Unique violation: invoice_number already exists
            duplicateCount++;
            console.warn(`Duplicate invoice ${parsedData.invoice_number} skipped.`);
          } else {
            console.error('Error uploading invoice:', parsedData.invoice_number, error);
            errorCount++;
          }
        } catch (pdfErr) {
          console.error(`Failed to parse PDF ${file.name}:`, pdfErr);
          errorCount++;
        }
        setUploadProgress({ current: i + 1, total: files.length });
      }

      // Show summary
      if (duplicateCount > 0) {
        toastWarning(`${duplicateCount} invoice(s) already exist and were skipped.`);
      }

      if (errorCount > 0) {
        toastError(
          `Uploaded ${successCount} invoices. ${errorCount} failed. ${skippedCount > 0 ? `Skipped ${skippedCount} non-event invoices.` : ''}`,
        );
      } else if (successCount > 0) {
        toastSuccess(`Successfully uploaded ${successCount} invoices.`);
      } else if (duplicateCount === 0 && skippedCount > 0) {
        toastSuccess(
          `Uploaded ${successCount} invoices. Skipped ${skippedCount} non-event invoices.`,
        );
      }

      // Refresh the list
      await fetchInvoices();
    } catch (err) {
      console.error('Upload error:', err);
      toastError('Failed to process one or more PDFs. ' + err.message);
    } finally {
      setUploading(false);
      setUploadProgress({ current: 0, total: 0 });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleStatusChange = async (id, newStatus, companyName = null) => {
    const inv = invoices.find((i) => i.id === id);
    if (!inv) return;

    if (inv.status === 'approved' && newStatus === 'pending') {
      const yes = await confirm({
        title: 'Undo Subscription',
        message:
          'This will revert the invoice to pending. Do you also want to delete the created subscription for "' +
          (companyName || inv.company_name) +
          '"?',
      });

      if (yes) {
        const matchName = companies.find(
          (c) => c.name.toLowerCase() === (inv.company_name || '').toLowerCase(),
        );
        if (matchName?.id && unsubscribeCompany) {
          try {
            const tempSub = subscriptions.find((s) => s.company_id === matchName.id);
            if (tempSub) {
              await unsubscribeCompany(tempSub.id);
              toastSuccess('Subscription removed.');
            } else {
              // Could not find subscription for the matched company
              console.warn(
                'Could not find active subscription to remove for Company ID:',
                matchName.id,
              );
            }
          } catch (e) {
            console.error(e);
          }
        }
      } else {
        return; // aborted
      }
    }

    try {
      const { error } = await supabase
        .from('staged_invoices')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setInvoices((prev) =>
        prev.map((invItem) => (invItem.id === id ? { ...invItem, status: newStatus } : invItem)),
      );
      toastSuccess('Invoice status updated');
    } catch (err) {
      console.error('Error updating status:', err);
      toastError(err?.message || 'Unknown error occurred');
    }
  };

  const handleDeleteInvoice = async (invoice) => {
    if (invoice.status === 'approved') {
      toastError('Cannot delete an invoice that is already subscribed.');
      return;
    }
    const yes = await confirm({
      title: 'Confirm Deletion',
      message: 'Are you sure you want to permanently delete this staged invoice?',
    });
    if (!yes) return;
    try {
      const { error } = await supabase.from('staged_invoices').delete().eq('id', invoice.id);
      if (error) throw error;
      setInvoices((prev) => prev.filter((inv) => inv.id !== invoice.id));
      toastSuccess('Invoice deleted successfully.');
    } catch (err) {
      console.error('Error deleting invoice:', err);
      toastError(err?.message || 'Failed to delete invoice.');
    }
  };

  // ─── Sync helpers ─────────────────────────────────────────────────────────────

  // Core subscription creation — called both from modal confirm and direct create path.
  const doSync = async (invoice, companyId) => {
    const breakfastVal = invoice.breakfast_sat ?? invoice.breakfast ?? 0;
    const lunchVal = invoice.lunch_sat ?? invoice.lunch ?? invoice.meals_count ?? 0;
    const bbqVal = invoice.bbq_sat ?? invoice.bbq ?? 0;
    const lunchSatVal = Math.ceil(lunchVal / 2);
    const lunchSunVal = Math.floor(lunchVal / 2);

    const subResult = await subscribeCompany(companyId, {
      booth_count: invoice.stands_count || 1,
      area: invoice.area_preference || '',
      notes:
        'Imported from Invoice ' +
        invoice.invoice_number +
        '. Meals ordered: ' +
        (invoice.meals_count || 0) +
        '. ' +
        (invoice.notes || ''),
      phone: invoice.phone,
      email: invoice.email,
      breakfast_sat: breakfastVal,
      lunch_sat: lunchSatVal,
      bbq_sat: bbqVal,
      breakfast_sun: 0,
      lunch_sun: lunchSunVal,
    });

    if (subResult?.error) throw new Error(subResult.error);
    await handleStatusChange(invoice.id, 'approved');
    toastSuccess('Successfully synced subscription!');
  };

  // Called when user confirms a match in the MatchVerificationModal.
  const handleConfirmMatch = async (invoice, company, shouldPatch) => {
    setVerifyModal(null);
    try {
      // Persist the company link on the staged invoice record.
      await supabase
        .from('staged_invoices')
        .update({ company_id: company.id })
        .eq('id', invoice.id);

      // Update local state so approve button becomes active immediately.
      setInvoices((prev) =>
        prev.map((i) => (i.id === invoice.id ? { ...i, company_id: company.id } : i)),
      );
      // Optionally patch empty company fields from the extracted invoice data.
      if (shouldPatch) {
        let inv = {};
        try { inv = JSON.parse(invoice.notes || '{}'); } catch (_) {}
        const patch = {};
        const fill = (field, val) => { if (val && !company[field]) patch[field] = val; };
        fill('contact_name',  inv.contact_name);
        fill('contact_email', inv.contact_email);
        fill('contact_phone', inv.contact_phone);
        fill('address_line1', inv.address_line1);
        fill('address_line2', inv.address_line2);
        fill('postal_code',   inv.postal_code);
        fill('city',          inv.city);
        fill('country',       inv.country);
        fill('vat_number',    inv.vat_number);
        if (Object.keys(patch).length > 0) {
          await supabase.from('companies').update(patch).eq('id', company.id);
        }
      }

      await doSync(invoice, company.id);
    } catch (err) {
      toastError('Sync failed: ' + (err?.message || String(err)));
    }
  };

  const handleApproveAndSync = async (invoice) => {
    // Already verified — company_id was confirmed in the modal. Just confirm & sync.
    if (invoice.company_id) {
      const company = companies.find((c) => c.id === invoice.company_id);
      const yes = await confirm({
        title: 'Sync to subscription',
        message:
          'Confirmed match: "' +
          invoice.company_name +
          '" → "' +
          (company?.name || 'company #' + invoice.company_id) +
          '". Create subscription now?',
      });
      if (!yes) return;
      try { await doSync(invoice, invoice.company_id); }
      catch (err) { toastError('Sync failed: ' + (err?.message || String(err))); }
      return;
    }

    // Not yet verified — open the verification flow.
    const matchedCompany = companies.find(
      (c) => c.name.toLowerCase() === (invoice.company_name || '').toLowerCase(),
    );

    if (!matchedCompany) {
      // No company record at all — prompt to create one.
      const yes = await confirm({
        title: 'Company Not Found',
        message: 'No company named "' + invoice.company_name + '" found. Create it automatically?',
      });
      if (!yes) return;

      try {
        const { data: newCompany, error: createError } = await supabase
          .from('companies')
          .insert([{ name: invoice.company_name, phone: invoice.phone || '', email: invoice.email || '' }])
          .select()
          .single();
        if (createError) throw createError;
        await doSync(invoice, newCompany.id);
      } catch (err) {
        toastError('Failed to create company: ' + (err?.message || String(err)));
      }
      return;
    }

    // Match found — open side-by-side verification modal.
    setVerifyModal({ invoice, company: matchedCompany });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return (
      <Icon
        path={sortConfig.direction === 'asc' ? mdiChevronUp : mdiChevronDown}
        size={0.6}
        className="inline ml-1"
      />
    );
  };

  const processedInvoices = React.useMemo(() => {
    let result = [...invoices];

    // Calculate match info to sort/filter accurately
    result = result.map((inv) => {
      const matchName = companies.find(
        (c) => c.name.toLowerCase() === (inv.company_name || '').toLowerCase(),
      );

      let parsedDate = '';
      try {
        const parsedNotes = JSON.parse(inv.notes || '{}');
        parsedDate = parsedNotes.date || '';
      } catch (e) {}

      return { ...inv, hasMatch: !!matchName, matchName: matchName?.name, date: parsedDate };
    });

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (inv) =>
          (inv.company_name || '').toLowerCase().includes(lower) ||
          (inv.invoice_number || '').toLowerCase().includes(lower),
      );
    }

    result.sort((a, b) => {
      if (sortConfig.key === 'date') {
        const parseDutchDate = (d) => {
          if (!d) return 0;
          // Map dutch month abbreviations to JS month index (0-11)
          const months = {
            jan: 0,
            feb: 1,
            mrt: 2,
            apr: 3,
            mei: 4,
            jun: 5,
            jul: 6,
            aug: 7,
            sep: 8,
            okt: 9,
            nov: 10,
            dec: 11,
          };

          // normalize "6 mrt 2026" or "01-01-2026"
          const p = d
            .toLowerCase()
            .replace(/[^a-z0-9]/g, ' ')
            .trim()
            .split(/\s+/);
          if (p.length >= 3) {
            const day = parseInt(p[0], 10);
            let month = months[p[1].substring(0, 3)];
            if (month === undefined) month = parseInt(p[1], 10) - 1; // fallback to numerical
            const year = parseInt(p[2], 10);
            if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
              return new Date(year, month, day).getTime(); // returns sortable chronological UNIX timestamp
            }
          }
          return 0; // Invalid/empty dates bubble down to 0
        };

        const timeA = parseDutchDate(a.date);
        const timeB = parseDutchDate(b.date);

        if (timeA < timeB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (timeA > timeB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      }

      // Default string/number sorting for everything else
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [invoices, searchTerm, sortConfig, companies]);

  return (
    <div>
      {/* Match Verification Modal */}
      {verifyModal && (
        <MatchVerificationModal
          invoice={verifyModal.invoice}
          company={verifyModal.company}
          onConfirm={handleConfirmMatch}
          onCancel={() => setVerifyModal(null)}
          onCreateNew={async () => {
            const { invoice } = verifyModal;
            setVerifyModal(null);
            const yes = await confirm({
              title: 'Create New Company',
              message: `Create a new company record for "${invoice.company_name}" and sync?`,
            });
            if (!yes) return;
            try {
              const { data: newCo, error: ce } = await supabase
                .from('companies')
                .insert([{ name: invoice.company_name, phone: invoice.phone || '', email: invoice.email || '' }])
                .select()
                .single();
              if (ce) throw ce;
              await doSync(invoice, newCo.id);
            } catch (err) {
              toastError('Failed to create company: ' + (err?.message || String(err)));
            }
          }}
        />
      )}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
          {t('adminNav.invoices', 'Invoices')}
        </h1>
        <div className="flex-1 max-w-md mx-6 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon path={mdiMagnify} size={0.8} className="text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
            placeholder="Search invoices or companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept=".pdf"
            multiple
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            onClick={fetchInvoices}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Icon path={mdiRefresh} size={0.8} />
            Refresh
          </button>

          <div className="relative">
            <button
              onClick={() => setIsActionsOpen(!isActionsOpen)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-all"
              title={t('common.actionsMenu', 'Actions')}
            >
              <span>{t('common.actions', 'Actions')}</span>
              <Icon path={isActionsOpen ? mdiChevronUp : mdiChevronDown} size={0.7} />
            </button>

            {isActionsOpen && (
              <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-1">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                  Data Tools
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 bg-transparent disabled:opacity-50 cursor-pointer"
                >
                  <Icon path={mdiUpload} size={0.8} />
                  {uploading ? 'Importing...' : 'Import PDF(s)'}
                </button>
                <div className="border-t border-gray-100 my-1"></div>
                <button
                  onClick={handleClearAll}
                  disabled={loading || invoices.length === 0}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 bg-transparent disabled:opacity-50 cursor-pointer"
                >
                  <Icon path={mdiDelete} size={0.8} className="text-red-500" />
                  Clear Staging Area
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {uploading && uploadProgress.total > 0 && (
        <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-2 relative overflow-hidden">
          <div className="flex justify-between items-center text-sm font-medium text-gray-700 relative z-10">
            <span>
              Importing PDFs ({Math.round((uploadProgress.current / uploadProgress.total) * 100)}%)
            </span>
            <span>
              {uploadProgress.current} / {uploadProgress.total}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5 relative z-10 shadow-inner overflow-hidden">
            <div
              className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 flex items-center justify-end pr-1"
              style={{
                width: `${Math.round((uploadProgress.current / uploadProgress.total) * 100)}%`,
              }}
            >
              <div className="w-1.5 h-1.5 bg-white rounded-full opacity-50 shadow"></div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-2">
          <Icon path={mdiAlertCircleOutline} size={1} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 flex flex-col items-center justify-center text-gray-500">
          <p className="mb-4">No staged invoices found. Have you imported them yet?</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Icon path={mdiUpload} size={1} />
            {uploading ? 'Importing...' : 'Import PDF(s)'}
          </button>
        </div>
      ) : (
        <>
          {editingInvoice && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                  <h2 className="text-xl font-semibold">
                    Edit Invoice {editingInvoice.invoice_number}
                  </h2>
                  <button
                    onClick={() => setEditingInvoice(null)}
                    className="text-gray-400 hover:text-gray-600 p-2"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex justify-end mb-4">
                    <a
                      href={
                        baseUrl +
                        'invoices/' +
                        editingInvoice.invoice_number +
                        '.pdf'
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded"
                    >
                      View Original PDF ↗
                    </a>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name
                    </label>
                    <datalist id="companies-list">
                      {companies.map((c) => (
                        <option key={c.id} value={c.name} />
                      ))}
                    </datalist>
                    <input
                      type="text"
                      list="companies-list"
                      value={editingInvoice.company_name || ''}
                      onChange={(e) =>
                        setEditingInvoice({ ...editingInvoice, company_name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Connect to an existing company by entering their exact name, or edit the typo.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Stands Count (1 stands = 6x6, 2 stands = 6x12)
                      </label>
                      <input
                        type="number"
                        value={editingInvoice.stands_count || 0}
                        onChange={(e) =>
                          setEditingInvoice({
                            ...editingInvoice,
                            stands_count: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        If the PDF says Standhuur 6x12, enter 2.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Meals Count
                      </label>
                      <input
                        type="number"
                        value={editingInvoice.meals_count || 0}
                        onChange={(e) =>
                          setEditingInvoice({
                            ...editingInvoice,
                            meals_count: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  {/* note: we intentionally do not expose breakfast/lunch/bbq edits here
                      because those values are derived from the PDF or meals_count and
                      can be adjusted manually once the invoice has been synced to a
                      subscription. */}
                  <button
                      onClick={async () => {
                        try {
                          const { error } = await supabase
                            .from('staged_invoices')
                            .update({
                              company_name: editingInvoice.company_name,
                              stands_count: editingInvoice.stands_count,
                              meals_count: editingInvoice.meals_count,
                              breakfast_sat: editingInvoice.breakfast_sat,
                              lunch_sat: editingInvoice.lunch_sat,
                              bbq_sat: editingInvoice.bbq_sat,
                              breakfast_sun: editingInvoice.breakfast_sun,
                              lunch_sun: editingInvoice.lunch_sun,
                              notes: editingInvoice.notes,
                            })
                            .eq('id', editingInvoice.id);

                          if (error) throw error;

                          setInvoices((prev) =>
                            prev.map((inv) => (inv.id === editingInvoice.id ? editingInvoice : inv)),
                          );
                          toastSuccess('Invoice updated');
                          setEditingInvoice(null);
                        } catch (err) {
                          toastError(err.message);
                        }
                      }}
                    className="px-4 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-lg transition-colors shadow-sm cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className="bg-white rounded-xl shadow overflow-hidden overflow-x-auto border border-gray-100">
            <table className="w-full text-left border-collapse bg-white table-auto">
              <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
                <tr>
                  <th
                    className="px-2 py-2 border-b border-gray-200 cursor-pointer hover:bg-gray-100 w-[100px]"
                    onClick={() => handleSort('invoice_number')}
                  >
                    Invoice {getSortIcon('invoice_number')}
                  </th>
                  <th
                    className="px-2 py-2 border-b border-gray-200 cursor-pointer hover:bg-gray-100 w-[150px]"
                    onClick={() => handleSort('company_name')}
                  >
                    Company {getSortIcon('company_name')}
                  </th>
                  <th
                    className="px-2 py-2 border-b border-gray-200 cursor-pointer hover:bg-gray-100 text-left w-[120px]"
                    onClick={() => handleSort('date')}
                  >
                    Date {getSortIcon('date')}
                  </th>
                  <th className="px-2 py-2 border-b border-gray-200 text-left">Item</th>
                  {/* split meal columns */}

                  <th
                    className="px-4 py-3 text-center border-b border-gray-200 cursor-pointer hover:bg-gray-100 w-[80px]"
                    onClick={() => handleSort('status')}
                  >
                    Status {getSortIcon('status')}
                  </th>
                  <th className="px-4 py-3 text-right border-b border-gray-200 w-[120px]">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-100">
                {processedInvoices.map((inv) => {
                  const matchName = companies.find(
                    (c) => c.name.toLowerCase() === (inv.company_name || '').toLowerCase(),
                  );

                  let parsedData = {};
                  try {
                    parsedData = JSON.parse(inv.notes || '{}');
                  } catch (e) {}

                  // Support old format strings vs new JSON payload fallback
                  const rawNotesFallback =
                    typeof inv.notes === 'string' && !inv.notes.startsWith('{') ? inv.notes : '';
                  const lineItems = parsedData.line_items || [];
                  const clientBlock = parsedData.client_block || [];
                  const isExpanded = expandedRows.has(inv.id);
                  const firstItem =
                    lineItems.length > 0 ? lineItems[0].item || lineItems[0].description : 'N/A';
                  const hasMore = lineItems.length > 1;
                  // compute area aggregate from each line item
                  const areaList = lineItems
                    .map((li) => li.area)
                    .filter(Boolean)
                    .filter((v, i, a) => a.indexOf(v) === i); // unique
                  const areaString = areaList.join(', ');

                  return (
                    <React.Fragment key={inv.id}>
                      <tr
                        onClick={() => toggleRow(inv.id)}
                        className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                      >
                        <td className="px-2 py-2 font-medium text-blue-600 w-[100px] overflow-hidden truncate align-top">
                          <a
                            href={
                              baseUrl + 'invoices/' + inv.invoice_number + '.pdf'
                            }
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title="Open PDF"
                            className="hover:underline truncate block w-full"
                          >
                            {inv.invoice_number}
                          </a>
                        </td>
                        <td className="px-2 py-2 border-r border-gray-50 align-top w-[150px] overflow-hidden truncate">
                          <div className="font-medium text-gray-900 truncate">{inv.company_name}</div>
                          {inv.status !== 'approved' && (
                            matchName ? (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleApproveAndSync(inv); }}
                                className="text-xs font-semibold px-1.5 py-0.5 rounded border mt-1 inline-block transition-colors cursor-pointer"
                                style={inv.company_id
                                  ? { color: '#166534', background: '#dcfce7', borderColor: '#86efac' }
                                  : { color: '#854d0e', background: '#fef9c3', borderColor: '#fde047' }}
                                title={inv.company_id ? 'Verified — click to re-check' : 'Click to verify match'}
                              >
                                {inv.company_id ? '✓ Verified: ' : '? Match: '}{matchName.name}
                              </button>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleApproveAndSync(inv); }}
                                className="text-xs text-orange-700 font-semibold bg-orange-100 px-1.5 py-0.5 rounded border border-orange-300 mt-1 inline-block hover:bg-orange-200 transition-colors cursor-pointer"
                                title="Click to verify or create company"
                              >
                                ⚠ No match — verify
                              </button>
                            )
                          )}
                        </td>
                        <td className="px-2 py-2 border-r border-gray-50 text-gray-600 whitespace-nowrap align-top w-[120px]">
                          {parsedData.date || 'N/A'}
                        </td>
                        <td className="px-2 py-2 border-r border-gray-50 align-top">
                          <span className="text-sm text-indigo-700 font-medium whitespace-nowrap overflow-hidden truncate block">
                            {firstItem}{' '}
                            {hasMore && (
                              <span className="text-xs text-gray-500 font-normal">
                                (+{lineItems.length - 1} more)
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-center border-r border-gray-50 align-top w-[80px]">
                          <span
                            className={
                              'px-2 py-1 rounded text-xs font-semibold ' +
                              (inv.status === 'approved'
                                ? 'bg-green-100 text-green-700 border border-green-200'
                                : inv.status === 'rejected'
                                  ? 'bg-red-100 text-red-700 border border-red-200'
                                  : 'bg-yellow-100 text-yellow-700 border border-yellow-300')
                            }
                          >
                            {inv.status === 'approved'
                              ? 'SUBSCRIBED'
                              : inv.status
                                ? inv.status.toUpperCase()
                                : 'PENDING'}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-right w-[120px] align-top">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApproveAndSync(inv);
                              }}
                              disabled={inv.status !== 'pending' || !inv.company_id}
                              className="p-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed"
                              title={inv.status !== 'pending' ? 'Already synced' : !inv.company_id ? 'Verify company first (click the badge above)' : 'Sync to subscription'}
                            >
                              <Icon path={mdiCheck} size={0.8} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(inv.id, 'rejected');
                              }}
                              disabled={inv.status === 'rejected'}
                              className="p-2 bg-white border border-gray-300 text-red-600 rounded hover:bg-red-50 disabled:opacity-50"
                              title="Reject"
                            >
                              <Icon path={mdiCancel} size={0.8} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteInvoice(inv);
                              }}
                              className="p-2 bg-white border border-gray-300 text-red-500 rounded hover:bg-red-50"
                              title="Delete Invoice"
                            >
                              <Icon path={mdiDelete} size={0.8} className="text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Expandable Subrow */}
                      {isExpanded && (
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <td colSpan="6" className="p-4 bg-slate-50 border-x border-gray-200">
                            {/* compact summary row with counts */}
                            <div className="mb-3 text-sm text-gray-700">
                              <strong>Stands:</strong> {inv.stands_count} &nbsp;|
                              <strong>Sat:</strong> B {inv.breakfast_sat} L {inv.lunch_sat} BBQ {inv.bbq_sat} &nbsp;|
                              <strong>Sun:</strong> B {inv.breakfast_sun} L {inv.lunch_sun}
                            </div>
                            <div className="flex flex-col lg:flex-row gap-6">
                              {/* Sub Box 1: Client Address from PDF */}
                              <div className="flex-1 bg-white p-4 rounded border border-gray-300 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                <div className="flex justify-between items-center mb-3">
                                  <h4 className="text-[11px] tracking-wider font-bold text-gray-500 uppercase flex items-center gap-2">
                                    <Icon path={mdiMagnify} size={0.5} /> Parsed Client Details
                                  </h4>
                                </div>
                                <div className="text-sm text-gray-800 space-y-1 font-mono leading-relaxed bg-gray-50 border border-gray-100 p-3 rounded">
                                  {clientBlock && clientBlock.length > 0 ? (
                                    clientBlock.map((line, i) => <div key={i}>{line}</div>)
                                  ) : (
                                    <em className="text-gray-400 font-sans">
                                      Could not extract spatial block. Was it parsed by the new
                                      format?
                                    </em>
                                  )}
                                </div>
                              </div>

                              {/* Sub Box 2: Line Items */}
                              <div className="flex-[2] bg-white p-4 rounded border border-gray-300 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                                <h4 className="text-[11px] tracking-wider font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                                  Line Items Extracted (JSON)
                                </h4>
                                {lineItems && lineItems.length > 0 ? (
                                  <div className="border border-gray-100 rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                      <thead>
                                        <tr className="border-b border-gray-200 text-left text-gray-500 bg-gray-50">
                                          <th className="py-2 px-3 font-medium uppercase text-[10px] tracking-wider">
                                            Description
                                          </th>
                                          <th className="py-2 px-3 font-medium uppercase text-[10px] tracking-wider text-right border-l border-gray-100">
                                            Quantity
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-100">
                                        {lineItems.map((item, idx) => (
                                          <tr
                                            key={idx}
                                            className="hover:bg-slate-50 transition-colors bg-white"
                                          >
                                            <td className="py-2.5 px-3 text-gray-800 font-medium">
                                              {item.item || item.description}
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-bold text-indigo-700 border-l border-gray-50 bg-indigo-50/20">
                                              {item.quantity}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <div className="text-sm text-gray-500 p-6 text-center bg-gray-50 rounded border border-dashed border-gray-300">
                                    No structured items parsed in JSON. Have you wiped and
                                    re-uploaded using the new parser?
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
