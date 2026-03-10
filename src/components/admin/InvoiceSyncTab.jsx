import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { parsePdfInvoice } from '../../utils/pdfParser';
import { useTranslation } from 'react-i18next';
import Icon from '@mdi/react';
import {
  mdiRefresh,
  mdiAlertCircleOutline,
  mdiSync,
  mdiUpload,
  mdiMagnify,
  mdiChevronUp,
  mdiChevronDown,
  mdiDeleteOutline,
} from '@mdi/js';
import useCompanies from '../../hooks/useCompanies';
import useEventSubscriptions from '../../hooks/useEventSubscriptions';
import useOrganizationSettings from '../../hooks/useOrganizationSettings';
import { useDialog } from '../../contexts/DialogContext';

export default function InvoiceSyncTab({ selectedYear }) {
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

  const handleApproveAndSync = async (invoice) => {
    const matchedCompany = companies.find(
      (c) => c.name.toLowerCase() === (invoice.company_name || '').toLowerCase(),
    );

    let companyId = matchedCompany?.id || null;

    if (!companyId) {
      const yes = await confirm({
        title: 'Company Not Found',
        message: 'No company named "' + invoice.company_name + '" found. Create it automatically?',
      });
      if (!yes) return;

      try {
        const { data: newCompany, error: createError } = await supabase
          .from('companies')
          .insert([
            {
              name: invoice.company_name,
              phone: invoice.phone || '',
              email: invoice.email || '',
            },
          ])
          .select()
          .single();

        if (createError) throw createError;
        companyId = newCompany.id;
      } catch (err) {
        toastError('Failed to create company: ' + (err?.message || String(err)));
        return;
      }
    } else {
      const yes = await confirm({
        title: 'Confirm Sync',
        message:
          'Create subscription for "' +
          invoice.company_name +
          '"? Stands: ' +
          (invoice.stands_count || 1),
      });
      if (!yes) return;
    }

    try {
      // compute breakdown values from the parsed invoice; fall back
      // to the old meals_count logic when necessary
      const breakfastVal = invoice.breakfast ?? 0;
      const lunchVal = invoice.lunch ?? invoice.meals_count ?? 0;
      const bbqVal = invoice.bbq ?? 0;
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
    } catch (err) {
      toastError('Failed to sync to subscription: ' + (err?.message || String(err)));
    }
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
          {t('adminNav.invoiceSync', 'Invoice Sync')}
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
                  <Icon path={mdiDeleteOutline} size={0.8} />
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
                        import.meta.env.BASE_URL +
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
            <table className="w-full text-left border-collapse min-w-max bg-white">
              <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
                <tr>
                  <th
                    className="px-2 py-2 border-b border-gray-200 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('invoice_number')}
                  >
                    Invoice {getSortIcon('invoice_number')}
                  </th>
                  <th
                    className="px-2 py-2 border-b border-gray-200 cursor-pointer hover:bg-gray-100 max-w-[120px]"
                    onClick={() => handleSort('company_name')}
                  >
                    Company {getSortIcon('company_name')}
                  </th>
                  <th
                    className="px-2 py-2 border-b border-gray-200 cursor-pointer hover:bg-gray-100 text-left"
                    onClick={() => handleSort('date')}
                  >
                    Date {getSortIcon('date')}
                  </th>
                  <th className="px-2 py-2 border-b border-gray-200 text-left">Item</th>
                  {/* split meal columns */}

                  <th
                    className="px-4 py-3 text-center border-b border-gray-200 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('status')}
                  >
                    Status {getSortIcon('status')}
                  </th>
                  <th className="px-4 py-3 text-right border-b border-gray-200">Actions</th>
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
                        <td className="px-2 py-2 font-medium text-blue-600 flex items-center gap-2">
                          <Icon path={isExpanded ? mdiChevronUp : mdiChevronDown} size={0.8} />
                          <a
                            href={
                              import.meta.env.BASE_URL + 'invoices/' + inv.invoice_number + '.pdf'
                            }
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title="Open PDF"
                            className="hover:underline flex items-center gap-1"
                          >
                            {inv.invoice_number}
                          </a>
                        </td>
                        <td className="px-2 py-2 border-r border-gray-50 max-w-[120px] overflow-hidden">
                          <div className="font-medium text-gray-900 truncate">{inv.company_name}</div>
                          {matchName ? (
                            <span className="text-xs text-green-700 font-semibold bg-green-100 px-1.5 py-0.5 rounded border border-green-200 mt-1 inline-block">
                              Match: {matchName.name}
                            </span>
                          ) : (
                            <span className="text-xs text-orange-700 font-semibold bg-orange-100 px-1.5 py-0.5 rounded border border-orange-200 mt-1 inline-block">
                              Will Create New Pin
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-2 border-r border-gray-50 text-gray-600">
                          {parsedData.date || 'N/A'}
                        </td>
                        <td className="px-2 py-2 border-r border-gray-50">
                          <span className="text-sm text-indigo-700 font-medium whitespace-nowrap overflow-hidden text-ellipsis block max-w-[150px]">
                            {firstItem}{' '}
                            {hasMore && (
                              <span className="text-xs text-gray-500 font-normal">
                                (+{lineItems.length - 1} more)
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-center border-r border-gray-50">
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
                        <td className="px-2 py-2 text-right">
                          <div className="flex flex-col gap-2 items-end">
                            {inv.status === 'pending' && (
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApproveAndSync(inv);
                                  }}
                                  className="px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded text-xs font-medium inline-flex items-center gap-1 shadow-sm cursor-pointer border border-transparent"
                                  title="Subscribe to Event"
                                >
                                  <Icon path={mdiSync} size={0.6} /> Subscribe
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(inv.id, 'rejected');
                                  }}
                                  className="px-3 py-1.5 bg-white border border-gray-300 text-red-600 hover:bg-red-50 rounded text-xs font-medium cursor-pointer"
                                  title="Reject and Ignore"
                                >
                                  Reject
                                </button>
                              </div>
                            )}

                            <div className="flex gap-3 justify-end items-center mt-1">
                              {inv.status !== 'pending' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(inv.id, 'pending', inv.company_name);
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                >
                                  Undo Status
                                </button>
                              )}
                              {inv.status !== 'approved' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteInvoice(inv);
                                  }}
                                  className="text-xs text-red-500 hover:text-red-700 hover:underline cursor-pointer inline-flex items-center gap-1"
                                  title="Delete Invoice"
                                >
                                  <Icon path={mdiDeleteOutline} size={0.5} /> Delete
                                </button>
                              )}
                            </div>
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
