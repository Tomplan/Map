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
  mdiArrowULeftTop,
} from '@mdi/js';
import useCompanies from '../../hooks/useCompanies';
import useEventSubscriptions from '../../hooks/useEventSubscriptions';
import useOrganizationSettings from '../../hooks/useOrganizationSettings';
import { useDialog } from '../../contexts/DialogContext';
import {
  addLineItem,
  deactivateLineItem,
  deactivateBySource,
  getActiveLineItems,
  getLineItemsBySourceRef,
  recalculateTotals,
  formatHistoryTimestamp,
  appendHistory,
} from '../../utils/subscriptionLineItems';

// ── Phone normalizer for fuzzy matching ─────────────────────────────────
function normalizePhone(p) {
  return (p || '').replace(/[\s\-().+]/g, '').replace(/^00/, '');
}

// ── Multi-field company matcher ───────────────────────────────────────────
// Scores each company against invoice data and returns the best candidate
// (score ≥ 40) with the reasons that contributed to the match.
function findBestCompanyMatch(invoice, companies) {
  let notes = {};
  try { notes = JSON.parse(invoice.notes || '{}'); } catch (_) {}
  const hasStoredFields = notes.contact_name || notes.contact_email || notes.kvk_number || notes.vat_number;
  if (!hasStoredFields && Array.isArray(notes.client_block) && notes.client_block.length > 1) {
    Object.assign(notes, extractFieldsFromBlock(notes.client_block));
  }
  const invName  = (invoice.company_name || '').toLowerCase().trim();
  const invEmail = (notes.contact_email || '').toLowerCase().trim();
  const invPhone = normalizePhone(notes.contact_phone || '');
  const invKvk   = (notes.kvk_number || '').replace(/\s/g, '');
  const invVat   = (notes.vat_number || '').replace(/\s/g, '').toLowerCase();

  let best = null;
  let bestScore = 0;

  for (const c of companies) {
    let score = 0;
    const reasons = [];
    const cName = (c.name || '').toLowerCase().trim();

    if (cName === invName)                                    { score += 100; reasons.push('name'); }
    else if (invName && cName && (cName.includes(invName) || invName.includes(cName))) { score += 40; reasons.push('~name'); }

    if (invEmail) {
      const emails = [c.email, c.contact_email, c.contact_email_2].map(e => (e || '').toLowerCase().trim()).filter(Boolean);
      if (emails.includes(invEmail))                          { score += 80; reasons.push('email'); }
    }
    if (invPhone) {
      const phones = [c.phone, c.contact_phone, c.contact_phone_2].map(p => normalizePhone(p || '')).filter(Boolean);
      if (phones.some(p => p && p === invPhone))              { score += 70; reasons.push('phone'); }
    }
    if (invKvk && invKvk.length >= 8) {
      const cKvk = (c.kvk_number || '').replace(/\s/g, '');
      if (cKvk && cKvk === invKvk)                            { score += 90; reasons.push('KvK'); }
    }
    if (invVat && invVat.length >= 8) {
      const cVat = (c.vat_number || '').replace(/\s/g, '').toLowerCase();
      if (cVat && cVat === invVat)                            { score += 85; reasons.push('VAT'); }
    }
    if (notes.contact_name) {
      const iCn = notes.contact_name.toLowerCase();
      const companyCn = [c.contact_name, c.contact].map(x => (x || '').toLowerCase()).filter(Boolean);
      if (companyCn.some(cn => cn && (cn.includes(iCn) || iCn.includes(cn)))) { score += 30; reasons.push('contact'); }
    }

    if (score > bestScore) { bestScore = score; best = { company: c, score, reasons }; }
  }
  return bestScore >= 40 ? best : null;
}

// ── Re-extract structured fields from a raw client_block array ──────────
// (mirrors the logic in pdfParser.js so old records without stored fields still work)
function extractFieldsFromBlock(lines = []) {
  const r = { contact_name: null, contact_name_2: null,
               contact_email: null, contact_email_2: null,
               contact_phone: null, contact_phone_2: null,
               address_line1: null, address_line2: null, postal_code: null,
               city: null, country: null, vat_number: null, kvk_number: null };
  // skip index 0 (company name)
  lines.slice(1).forEach((line) => {
    const l = (line || '').trim();
    if (!l) return;
    if (/@[a-z0-9.-]+\.[a-z]{2,}/i.test(l)) {
      if (!r.contact_email) { r.contact_email = l; return; }
      if (!r.contact_email_2) { r.contact_email_2 = l; return; }
    }
    if (!r.vat_number && (/BTW/i.test(l) || /NL\s*\d{9}/i.test(l))) {
      const vatToken = l.match(/\b(?:NL|BE|DE|GB|FR|AT|DK|ES|FI|IT|LU|PL|PT|SE)\s*[\dA-Z]{6,12}\b/i);
      r.vat_number = vatToken ? vatToken[0].replace(/\s+/g, '').toUpperCase()
        : l.replace(/^[\w\s]*?(?:BTW|VAT|nummer|number|nr\.?)[\s:\-]*/i, '').trim();
      return;
    }
    if (!r.kvk_number && (/KvK/i.test(l) || /^[\s.]*\d{8}[\s.]*$/.test(l))) { const m = l.match(/\d{8}/); if (m) { r.kvk_number = m[0]; return; } }
    if (!r.postal_code && /\d{4}\s*[A-Z]{2}/i.test(l)) {
      const m = l.match(/(\d{4})\s*([A-Z]{2})\s+(.*)/i);
      if (m) { r.postal_code = m[1]+m[2].toUpperCase(); r.city = m[3].trim(); }
      else r.postal_code = l;
      return;
    }
    if (!r.country && /nederland|netherlands|germany|deutschland|belgi/i.test(l)) { r.country = l; return; }
    if (/^[+\d(][\d\s().\-]{6,}$/.test(l) && !/^\d{4}\s*[A-Z]{2}$/i.test(l)) {
      if (!r.contact_phone) { r.contact_phone = l; return; }
      if (!r.contact_phone_2) { r.contact_phone_2 = l; return; }
    }
    if (/^[A-Z][a-z]/.test(l) && !/\d/.test(l) && l.split(' ').length >= 2) {
      if (!r.contact_name) { r.contact_name = l; return; }
      if (!r.contact_name_2) { r.contact_name_2 = l; return; }
    }
    if (!r.address_line1 && /\d/.test(l)) { r.address_line1 = l; return; }
    if (r.address_line1 && !r.address_line2 && /\d/.test(l)) r.address_line2 = l;
  });
  return r;
}

// ── Verification Modal ──────────────────────────────────────────────────
function MatchVerificationModal({ invoice, company, onConfirm, onCancel, onCreateNew }) {
  const [shouldPatch, setShouldPatch] = React.useState(false);
  // Per-field override for rows where invoice and DB values differ.
  // key = dbField, value = 'inv' (use invoice) or 'cmp' (keep DB, default)
  const [fieldChoices, setFieldChoices] = React.useState({});

  const toggleChoice = (dbField, choice) =>
    setFieldChoices(prev => ({ ...prev, [dbField]: choice }));

  let inv = {};
  try { inv = JSON.parse(invoice.notes || '{}'); } catch (_) {}

  // Fallback: if stored structured fields are all null (old record), derive them
  // live from the raw client_block array that was always stored.
  const hasStoredFields = inv.contact_name || inv.contact_email || inv.contact_phone ||
                          inv.address_line1 || inv.postal_code || inv.vat_number;
  if (Array.isArray(inv.client_block) && inv.client_block.length > 1) {
    const derived = extractFieldsFromBlock(inv.client_block);
    if (!hasStoredFields) {
      // Old record: fill everything from block
      Object.assign(inv, derived);
    } else {
      // Newer record: primary fields already stored, but backfill any missing _2 fields
      if (!inv.contact_name_2  && derived.contact_name_2)  inv.contact_name_2  = derived.contact_name_2;
      if (!inv.contact_email_2 && derived.contact_email_2) inv.contact_email_2 = derived.contact_email_2;
      if (!inv.contact_phone_2 && derived.contact_phone_2) inv.contact_phone_2 = derived.contact_phone_2;
    }
  }

  // Pre-compute whether the invoice value is already stored in any company field
  // (primary or secondary). If so, don't show a conflict even if primaries differ.
  const emailNorm  = (v) => (v || '').toLowerCase().trim();
  const phoneNorm  = (v) => normalizePhone(v || '');
  const nameNorm   = (v) => (v || '').toLowerCase().trim();
  const invEmailVal  = emailNorm(inv.contact_email);
  const invPhoneVal  = phoneNorm(inv.contact_phone);
  const invNameVal   = nameNorm(inv.contact_name);
  const emailAlreadyStored = invEmailVal  && [company.email, company.contact_email, company.contact_email_2].some(e => emailNorm(e) === invEmailVal);
  const phoneAlreadyStored = invPhoneVal  && [company.phone, company.contact_phone, company.contact_phone_2].some(p => phoneNorm(p) === invPhoneVal);
  const nameAlreadyStored  = invNameVal   && [company.contact, company.contact_name, company.contact_name_2].some(n => nameNorm(n) === invNameVal);

  const fields = [
    { label: 'Company name',  dbField: null,            inv: invoice.company_name,  cmp: company.name },
    { label: 'Contact 1',     dbField: 'contact_name',  inv: inv.contact_name,       cmp: company.contact_name || company.contact, hasBoth: true, alreadyStored: nameAlreadyStored },
    ...(inv.contact_name_2 ? [{ label: 'Contact 2', dbField: null, inv: inv.contact_name_2, cmp: null }] : []),
    { label: 'Email',         dbField: 'contact_email', inv: inv.contact_email,      cmp: company.contact_email || company.email, hasBoth: true, alreadyStored: emailAlreadyStored },
    ...(inv.contact_email_2 ? [{ label: 'Email 2',   dbField: null, inv: inv.contact_email_2,  cmp: null }] : []),
    { label: 'Phone',         dbField: 'contact_phone', inv: inv.contact_phone,      cmp: company.contact_phone || company.phone, hasBoth: true, alreadyStored: phoneAlreadyStored },
    ...(inv.contact_phone_2 ? [{ label: 'Phone 2',   dbField: null, inv: inv.contact_phone_2,  cmp: null }] : []),
    { label: 'Street',        dbField: 'address_line1', inv: inv.address_line1,      cmp: company.address_line1 },
    { label: 'Street 2',      dbField: 'address_line2', inv: inv.address_line2,      cmp: company.address_line2 },
    { label: 'Postal code',   dbField: 'postal_code',   inv: inv.postal_code,        cmp: company.postal_code },
    { label: 'City',          dbField: 'city',          inv: inv.city,               cmp: company.city },
    { label: 'Country',       dbField: 'country',       inv: inv.country,            cmp: company.country },
    { label: 'VAT',           dbField: 'vat_number',    inv: inv.vat_number,         cmp: company.vat_number },
    { label: 'KvK',           dbField: 'kvk_number',    inv: inv.kvk_number,         cmp: company.kvk_number },
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
              const differs = f.inv && f.cmp && f.inv !== f.cmp && !f.alreadyStored;
              const missing = f.inv && !f.cmp;
              const choice = fieldChoices[f.dbField] || 'cmp';
              return (
                <div key={i} className={`text-sm border-b border-gray-100 last:border-0 ${differs ? 'bg-amber-50' : missing ? 'bg-blue-50/30' : ''}`}>
                  <div className="grid grid-cols-[120px_1fr_1fr] items-start">
                    <div className="px-3 py-2 font-medium text-gray-500 text-xs flex items-center border-r border-gray-100 self-stretch">{f.label}</div>
                    <div className="px-3 py-2 text-gray-800 border-r border-gray-100 break-all">{f.inv || <span className="text-gray-300">—</span>}</div>
                    <div className={`px-3 py-2 break-all ${differs ? 'text-amber-800' : 'text-gray-800'}`}>
                      {f.cmp || <span className="text-gray-300">—</span>}
                      {missing && <span className="ml-1 text-xs text-blue-500">(empty)</span>}
                      {f.alreadyStored && f.inv && f.cmp && f.inv !== f.cmp && <span className="ml-1 text-xs text-green-600">✓ stored in secondary</span>}
                    </div>
                  </div>
                  {/* Per-row conflict resolution — only shown when both sides have different values */}
                  {differs && f.dbField && (
                    <div className="flex items-center gap-1.5 px-3 pb-2 pt-0.5">
                      <span className="text-[10px] text-amber-700 font-semibold uppercase tracking-wide mr-1">Use:</span>
                      <button
                        onClick={() => toggleChoice(f.dbField, 'inv')}
                        className={`px-2 py-0.5 rounded text-xs font-medium border transition-colors ${
                          choice === 'inv'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        Invoice value
                      </button>
                      <button
                        onClick={() => toggleChoice(f.dbField, 'cmp')}
                        className={`px-2 py-0.5 rounded text-xs font-medium border transition-colors ${
                          choice === 'cmp'
                            ? 'bg-green-600 text-white border-green-600'
                            : 'bg-white text-green-700 border-green-300 hover:bg-green-50'
                        }`}
                      >
                        Keep DB
                      </button>
                      {f.hasBoth && (
                        <button
                          onClick={() => toggleChoice(f.dbField, 'both')}
                          className={`px-2 py-0.5 rounded text-xs font-medium border transition-colors ${
                            choice === 'both'
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-white text-purple-700 border-purple-300 hover:bg-purple-50'
                          }`}
                          title="Keep DB value as primary, store invoice value in secondary field"
                        >
                          Both
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Patch option for empty fields */}
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
            <button onClick={() => onConfirm(invoice, company, shouldPatch, fieldChoices)}
              className="px-5 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm">
              ✓ Confirm match
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
// ── End MatchVerificationModal ──────────────────────────────────────────────

// ── CompanySearchModal ───────────────────────────────────────────────────────
// Shown when no automatic match is found. User can search all companies and
// pick one (opens MatchVerificationModal) or create a brand-new record.
function CompanySearchModal({ invoice, companies, onSelect, onCreateNew, onCancel }) {
  const [query, setQuery] = React.useState('');

  const filtered = React.useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return companies.slice(0, 30);
    return companies
      .filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.city?.toLowerCase().includes(q),
      )
      .slice(0, 40);
  }, [companies, query]);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col" style={{ maxHeight: '80vh' }}>
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">No automatic match found</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Invoice: <span className="font-semibold text-blue-600">{invoice.company_name}</span>
            </p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 p-1 rounded">✕</button>
        </div>

        {/* Search input */}
        <div className="p-4 border-b border-gray-100">
          <input
            autoFocus
            type="text"
            placeholder="Search companies by name, email or city…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Results list */}
        <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 p-6 text-center">No companies found</p>
          ) : (
            filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelect(c)}
                className="w-full text-left px-4 py-3 hover:bg-blue-50 transition"
              >
                <div className="font-medium text-gray-900 text-sm">{c.name}</div>
                {(c.city || c.email) && (
                  <div className="text-xs text-gray-400 mt-0.5">
                    {[c.city, c.email].filter(Boolean).join(' · ')}
                  </div>
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={onCreateNew}
            className="px-4 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
          >
            + Create new company
          </button>
        </div>
      </div>
    </div>
  );
}
// ── End CompanySearchModal ────────────────────────────────────────────────────

export default function InvoiceSyncTab({ selectedYear }) {
  const baseUrl = getBaseUrl();
  const { t } = useTranslation();
  const { companies, createCompany, updateCompany } = useCompanies();
  const { settings } = useOrganizationSettings();
  const { subscriptions, subscribeCompany, updateSubscription, unsubscribeCompany, reload } =
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

  const STATE_KEY = 'invoiceSyncState';
  // Lazy initialisers read sessionStorage once on first render — no effect-based
  // race where the persist effect fires with defaults before the restore effect
  // can update state, overwriting the saved values.
  const [searchTerm, setSearchTerm] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(STATE_KEY) || '{}').searchTerm || ''; } catch (_) { return ''; }
  });
  const [sortConfig, setSortConfig] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(STATE_KEY) || '{}').sortConfig || { key: 'created_at', direction: 'desc' }; } catch (_) { return { key: 'created_at', direction: 'desc' }; }
  });

  // persist state changes
  useEffect(() => {
    try {
      sessionStorage.setItem(STATE_KEY, JSON.stringify({ searchTerm, sortConfig }));
    } catch (_) {}
  }, [searchTerm, sortConfig]);
  const [verifyModal, setVerifyModal] = useState(null); // { invoice, company } | null
  const [companySearchModal, setCompanySearchModal] = useState(null); // invoice | null
  const [subHistoryModal, setSubHistoryModal] = useState(null); // { sub, invoice, companyName, additionLines, onConfirm } | null
  const [subHistorySelection, setSubHistorySelection] = useState([]);

  const fileInputRef = useRef(null);
  // Tracks invoice IDs whose status is currently being written to DB.
  // Prevents a concurrent real-time fetchInvoices() from overwriting an
  // in-flight optimistic status update with stale DB data.
  const pendingStatusRef = useRef(new Map());

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

      // Protect any in-flight status writes from being overwritten by stale DB reads:
      // if another async operation has already set a status locally but its DB write
      // hasn't been seen by this fetch yet, keep the locally-set value.
      setInvoices(sorted.map(inv => {
        const pendingStatus = pendingStatusRef.current.get(inv.id);
        return pendingStatus !== undefined ? { ...inv, status: pendingStatus } : inv;
      }));
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
            area_preference: parsedData.area || '',
            notes: JSON.stringify({
              rawNotes: parsedData.opmerkingen || '',
              notes: parsedData.notes || '',
              area: parsedData.area || '',
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
              kvk_number: parsedData.kvk_number || null,
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

  const handleStatusChange = async (id, newStatus, companyName = null, { skipNotesReset = false, skipSubscriptionUndo = false } = {}) => {
    const inv = invoices.find((i) => i.id === id);
    if (!inv) return;

    if (inv.status === 'approved' && newStatus === 'pending' && !skipSubscriptionUndo) {
      // Prefer the persisted FK; fall back to best-match.
      const undoCompanyId = inv.company_id ||
        findBestCompanyMatch(inv, companies)?.company?.id || null;

      const tempSub = undoCompanyId
        ? subscriptions.find((s) => s.company_id === undoCompanyId)
        : null;

      if (tempSub) {
        // Check if this invoice has line items in the subscription
        const invoiceLineItems = await getLineItemsBySourceRef(tempSub.id, inv.invoice_number);
        const activeItems = await getActiveLineItems(tempSub.id);

        if (invoiceLineItems.length > 0) {
          // Has structured line items — simple deactivation
          const otherActiveItems = activeItems.filter(
            li => li.source_ref !== inv.invoice_number,
          );

          if (otherActiveItems.length > 0) {
            // Other items remain — confirm subtraction
            const yes = await confirm({
              title: 'Undo Invoice Contribution',
              message:
                'Other items also contribute to the subscription for "' +
                (companyName || inv.company_name) +
                '". This invoice\'s values will be subtracted (not deleted).',
            });
            if (!yes) return;
          } else {
            // This is the only contributor — confirm full deletion
            const yes = await confirm({
              title: 'Undo Subscription',
              message:
                'This will revert the invoice to pending. Do you also want to delete the created subscription for "' +
                (companyName || inv.company_name) + '"?',
            });
            if (!yes) return;
          }

          try {
            // Deactivate all line items from this invoice
            await deactivateBySource(tempSub.id, inv.invoice_number);

            // Append removal to history (display-only, append-only)
            const now = new Date();
            const timestamp = formatHistoryTimestamp(now);
            const removedDescs = invoiceLineItems.map(li => li.description).filter(Boolean).join('; ');
            await appendHistory(tempSub.id, 'Removed on ' + timestamp + ': Invoice ' + inv.invoice_number + (removedDescs ? ' — ' + removedDescs : ''));

            // Check if subscription should be deleted (no active items remaining)
            const remaining = await getActiveLineItems(tempSub.id);
            if (remaining.length === 0) {
              await unsubscribeCompany(tempSub.id);
            }
            await reload?.();
            toastSuccess('Invoice contribution removed.');
          } catch (e) {
            toastError('Failed to update subscription: ' + (e?.message || String(e)));
            return;
          }
        } else {
          // No line items found (legacy subscription without migration)
          // Fall back to simple delete/confirm
          const yes = await confirm({
            title: 'Undo Subscription',
            message:
              'This will revert the invoice to pending. Do you also want to delete the created subscription for "' +
              (companyName || inv.company_name) + '"?',
          });
          if (!yes) return;
          try {
            await unsubscribeCompany(tempSub.id);
            toastSuccess('Subscription removed.');
          } catch (e) {
            console.error(e);
          }
        }
      } else {
        // No subscription found — just revert invoice status
        const yes = await confirm({
          title: 'Undo Invoice',
          message: 'Revert this invoice to pending?',
        });
        if (!yes) return;
      }
    }

    // Lock this invoice's status before the DB write so that any concurrent
    // real-time-triggered fetchInvoices() preserves the new value.
    pendingStatusRef.current.set(id, newStatus);
    try {
      // Only reset line item statuses when reverting to pending (not when called from handleItemAction
      // which already saved the correct per-item notes before calling us)
      let resetNotes = null;
      if (newStatus === 'pending' && !skipNotesReset) {
        let notes = {};
        try { notes = JSON.parse(inv.notes || '{}'); } catch (_) {}
        if (notes.line_items) {
          notes.line_items = notes.line_items.map((item) => ({ ...item, status: 'pending' }));
          resetNotes = JSON.stringify(notes);
        }
      }

      const updatePayload = { status: newStatus, updated_at: new Date().toISOString() };
      if (resetNotes !== null) updatePayload.notes = resetNotes;

      const { error } = await supabase
        .from('staged_invoices')
        .update(updatePayload)
        .eq('id', id);

      if (error) throw error;

      setInvoices((prev) =>
        prev.map((invItem) => {
          if (invItem.id !== id) return invItem;
          const next = { ...invItem, status: newStatus };
          if (resetNotes !== null) next.notes = resetNotes;
          return next;
        }),
      );
    } catch (err) {
      console.error('Error updating status:', err);
      toastError(err?.message || 'Unknown error occurred');
    } finally {
      pendingStatusRef.current.delete(id);
    }
  };

  const handleDeleteInvoice = async (invoice) => {
    if (invoice.status === 'approved' || invoice.status === 'partially_approved') {
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
    } catch (err) {
      console.error('Error deleting invoice:', err);
      toastError(err?.message || 'Failed to delete invoice.');
    }
  };

  // ─── Sync helpers ─────────────────────────────────────────────────────────────

  // Fetch the freshest subscription for a company+year directly from Supabase.
  // Always use this instead of reading from the `subscriptions` React state before
  // a mutation — the cached state can lag behind reality when multiple items are
  // approved/undone in quick succession.
  const fetchFreshSubscription = async (companyId) => {
    const { data, error } = await supabase
      .from('event_subscriptions')
      .select('*')
      .eq('company_id', companyId)
      .eq('event_year', selectedYear)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  };

  // Core subscription creation — called both from modal confirm and direct create path.
  const doSync = async (invoice, companyId) => {
    const breakfastVal = invoice.breakfast_sat ?? invoice.breakfast ?? 0;
    const lunchVal = invoice.lunch_sat ?? invoice.lunch ?? invoice.meals_count ?? 0;
    const bbqVal = invoice.bbq_sat ?? invoice.bbq ?? 0;
    const lunchSatVal = Math.ceil(lunchVal / 2);
    const lunchSunVal = Math.floor(lunchVal / 2);

    // Extract human-readable notes and area from the JSON blob stored in the invoice
    let parsedInvNotes = {};
    try { parsedInvNotes = JSON.parse(invoice.notes || '{}'); } catch (_) {}
    const customerNote = parsedInvNotes.notes || '';
    const invoiceArea = invoice.area_preference || parsedInvNotes.area || '';

    // Counts for this invoice
    const counts = {
      booth_count: invoice.stands_count || 1,
      breakfast_sat: breakfastVal,
      lunch_sat: lunchSatVal,
      bbq_sat: bbqVal,
      breakfast_sun: 0,
      lunch_sun: lunchSunVal,
    };

    // Human-readable description for history
    const invNow = new Date();
    const timestamp = formatHistoryTimestamp(invNow);
    const countParts = [
      counts.booth_count > 0 ? counts.booth_count + ' booth(s)' : '',
      counts.breakfast_sat > 0 ? counts.breakfast_sat + ' breakfast sat' : '',
      counts.lunch_sat > 0 ? counts.lunch_sat + ' lunch sat' : '',
      counts.bbq_sat > 0 ? counts.bbq_sat + ' BBQ sat' : '',
      counts.breakfast_sun > 0 ? counts.breakfast_sun + ' breakfast sun' : '',
      counts.lunch_sun > 0 ? counts.lunch_sun + ' lunch sun' : '',
    ].filter(Boolean).join(', ');
    const historyLine = 'Invoice ' + invoice.invoice_number + ' on ' + timestamp + ': ' + countParts;
    const description = 'Invoice ' + invoice.invoice_number + ': ' + countParts;

    // Check if a subscription already exists for this company + year
    const existing = subscriptions.find((s) => s.company_id === companyId);

    if (existing) {
      const merge = await confirm({
        title: t('subscriptionAlreadyExists', { companyName: existing.company?.name || '' }),
        message: t('subscriptionAlreadyExistsForCompany', {
          companyName: existing.company?.name || '',
          year: selectedYear,
          booths: existing.booth_count,
          defaultValue: 'A subscription for "{{companyName}}" already exists for {{year}} (booths: {{booths}}).\n\nMerge will add counts from this invoice to the existing subscription.\nReplace will overwrite it completely.'
        }),
        confirmText: t('mergeAction', 'Merge'),
        cancelText: t('replaceAction', 'Replace'),
      });

      if (merge) {
        // Add line item — recalculateTotals handles count merging + area/notes dedup
        await addLineItem(existing.id, {
          source: 'invoice',
          sourceRef: invoice.invoice_number,
          counts,
          area: invoiceArea || null,
          notes: customerNote || null,
          description,
        });
        await appendHistory(existing.id, historyLine);
        await handleStatusChange(invoice.id, 'approved', null, { skipSubscriptionUndo: true });
        // Reload subscriptions so React state is up to date
        await reload?.();
        toastSuccess('Merged into existing subscription!');
        return;
      }
      // Replace: deactivate all existing line items, add new one
      const existingItems = await getActiveLineItems(existing.id);
      for (const item of existingItems) {
        await deactivateLineItem(item.id);
      }
      await addLineItem(existing.id, {
        source: 'invoice',
        sourceRef: invoice.invoice_number,
        counts,
        area: invoiceArea || null,
        notes: customerNote || null,
        description,
      });
      await supabase
        .from('event_subscriptions')
        .update({ history: historyLine })
        .eq('id', existing.id);
      await handleStatusChange(invoice.id, 'approved', null, { skipSubscriptionUndo: true });
      await reload?.();
      toastSuccess('Subscription replaced!');
      return;
    }

    // New subscription
    const subResult = await subscribeCompany(companyId, {
      booth_count: 0,
      area: '',
      notes: '',
      history: historyLine,
      phone: invoice.phone,
      email: invoice.email,
      breakfast_sat: 0,
      lunch_sat: 0,
      bbq_sat: 0,
      breakfast_sun: 0,
      lunch_sun: 0,
    });

    if (subResult?.error) throw new Error(subResult.error);

    // Create the line item — recalculateTotals sets the actual counts
    await addLineItem(subResult.data.id, {
      source: 'invoice',
      sourceRef: invoice.invoice_number,
      counts,
      area: invoiceArea || null,
      notes: customerNote || null,
      description,
    });

    await handleStatusChange(invoice.id, 'approved', null, { skipSubscriptionUndo: true });
    toastSuccess('Successfully synced subscription!');
  };

  // Called when user confirms a match in the MatchVerificationModal.
  const handleConfirmMatch = async (invoice, company, shouldPatch, fieldChoices = {}) => {
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

      let inv = {};
      try { inv = JSON.parse(invoice.notes || '{}'); } catch (_) {}
      // Fallback for old records that predate the structured-field extraction
      const hasStoredFields = inv.contact_name || inv.contact_email || inv.contact_phone ||
                              inv.address_line1 || inv.postal_code || inv.vat_number;
      if (!hasStoredFields && Array.isArray(inv.client_block) && inv.client_block.length > 1) {
        Object.assign(inv, extractFieldsFromBlock(inv.client_block));
      }

      const patch = {};

      // Apply per-field conflict resolutions (user explicitly chose "Invoice value" or "Both" for a differing field)
      const fieldMap = {
        contact_name:  inv.contact_name,
        contact_email: inv.contact_email,
        contact_phone: inv.contact_phone,
        address_line1: inv.address_line1,
        address_line2: inv.address_line2,
        postal_code:   inv.postal_code,
        city:          inv.city,
        country:       inv.country,
        vat_number:    inv.vat_number,
        kvk_number:    inv.kvk_number,
      };
      // Map primary → secondary company column for 'both' choice
      const secondaryField = {
        contact_name:  'contact_name_2',
        contact_email: 'contact_email_2',
        contact_phone: 'contact_phone_2',
      };
      Object.entries(fieldChoices).forEach(([dbField, choice]) => {
        const val = fieldMap[dbField];
        if (!val) return;
        if (choice === 'inv') {
          patch[dbField] = val;
          if (dbField === 'contact_name') patch.contact = val;
        } else if (choice === 'both' && secondaryField[dbField]) {
          // Keep DB primary value; write invoice value into the secondary field
          patch[secondaryField[dbField]] = val;
        }
      });

      // Optionally fill empty company fields from invoice (shouldPatch checkbox)
      if (shouldPatch) {
        const fill = (field, val) => { if (val && !company[field] && !(field in patch)) patch[field] = val; };
        fill('contact_name',  inv.contact_name);
        fill('contact',       inv.contact_name);
        fill('contact_email', inv.contact_email);
        fill('contact_phone', inv.contact_phone);
        fill('address_line1', inv.address_line1);
        fill('address_line2', inv.address_line2);
        fill('postal_code',   inv.postal_code);
        fill('city',          inv.city);
        fill('country',       inv.country);
        fill('vat_number',    inv.vat_number);
        fill('kvk_number',    inv.kvk_number);
      }

      if (Object.keys(patch).length > 0) {
        // Deduplicate: if a _2 field ends up identical to its primary, clear the secondary.
        const deduped = { ...patch };
        const norm = (v) => (v || '').toLowerCase().trim();
        const effectiveEmail  = norm(deduped.contact_email  ?? company.contact_email  ?? company.email);
        const effectivePhone  = (deduped.contact_phone  ?? company.contact_phone  ?? company.phone  ?? '').replace(/[\s\-().+]/g, '').replace(/^00/, '');
        const effectiveName   = norm(deduped.contact_name   ?? company.contact_name);
        if (norm(deduped.contact_email_2  ?? company.contact_email_2)  === effectiveEmail  && effectiveEmail)  deduped.contact_email_2  = null;
        if ((deduped.contact_phone_2 ?? company.contact_phone_2 ?? '').replace(/[\s\-().+]/g, '').replace(/^00/, '') === effectivePhone && effectivePhone) deduped.contact_phone_2 = null;
        if (norm(deduped.contact_name_2   ?? company.contact_name_2)   === effectiveName   && effectiveName)   deduped.contact_name_2   = null;
        const { error: patchError } = await updateCompany(company.id, deduped);
        if (patchError) throw new Error(patchError);
      }

      toastSuccess('Match confirmed — use the approve button to sync.');
    } catch (err) {
      toastError('Failed to confirm match: ' + (err?.message || String(err)));
    }
  };

  // Badge button: always opens the verification modal so the user can review/re-review.
  const handleOpenVerifyModal = async (invoice) => {
    // If already linked to a company, open modal showing that company.
    if (invoice.company_id) {
      const company = companies.find((c) => c.id === invoice.company_id);
      if (company) { setVerifyModal({ invoice, company }); return; }
    }

    // Not yet linked — find best candidate.
    const matchResult = findBestCompanyMatch(invoice, companies);
    if (matchResult?.company) {
      setVerifyModal({ invoice, company: matchResult.company });
      return;
    }

    // No candidate found — open search modal so user can pick an existing company or create new.
    setCompanySearchModal(invoice);
  };

  const handleApproveAndSync = async (invoice) => {
    // Approve button is only enabled when company_id is set.
    const company = companies.find((c) => c.id === invoice.company_id);
    const yes = await confirm({
      title: 'Sync to subscription',
      message: 'Create subscription for "' + (company?.name || invoice.company_name) + '"?',
    });
    if (!yes) return;
    try { await doSync(invoice, invoice.company_id); }
    catch (err) { toastError('Sync failed: ' + (err?.message || String(err))); }
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
      const matchResult = findBestCompanyMatch(inv, companies);

      let parsedDate = '';
      try {
        const parsedNotes = JSON.parse(inv.notes || '{}');
        parsedDate = parsedNotes.date || '';
      } catch (e) {}

      return {
        ...inv,
        hasMatch: !!matchResult,
        matchCompany: matchResult?.company || null,
        matchScore: matchResult?.score || 0,
        matchReasons: matchResult?.reasons || [],
        date: parsedDate,
      };
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
      {/* Company Search Modal — shown when no automatic match is found */}
      {companySearchModal && (
        <CompanySearchModal
          invoice={companySearchModal}
          companies={companies}
          onSelect={(company) => {
            const inv = companySearchModal;
            setCompanySearchModal(null);
            setVerifyModal({ invoice: inv, company });
          }}
          onCreateNew={async () => {
            // When the user opts to create a new company from an invoice we try to
            // seed as many fields as possible from the parsed invoice data. This
            // mirrors the "fill empty fields" behaviour used when matching an
            // existing company so the newly created record isn't just a name/phone
            // stub.
            const inv = companySearchModal;
            setCompanySearchModal(null);
            try {
              // parse the JSON blob stored on the invoice and backfill from the
              // legacy client_block if needed (same logic as in handleConfirmMatch).
              let parsed = {};
              try { parsed = JSON.parse(inv.notes || '{}'); } catch (_) {}
              const hasStoredFields = parsed.contact_name || parsed.contact_email || parsed.contact_phone ||
                                      parsed.address_line1 || parsed.postal_code || parsed.vat_number;
              if (!hasStoredFields && Array.isArray(parsed.client_block) && parsed.client_block.length > 1) {
                Object.assign(parsed, extractFieldsFromBlock(parsed.client_block));
              }

              const payload = {
                name: inv.company_name,
                phone: inv.phone || '',
                email: inv.email || '',
                // invoice-derived extras (will be undefined if missing, which
                // supabase ignores)
                contact_name: parsed.contact_name,
                contact: parsed.contact_name,
                contact_email: parsed.contact_email,
                contact_phone: parsed.contact_phone,
                address_line1: parsed.address_line1,
                address_line2: parsed.address_line2,
                postal_code: parsed.postal_code,
                city: parsed.city,
                country: parsed.country,
                vat_number: parsed.vat_number,
                kvk_number: parsed.kvk_number,
              };

              const { data: newCo, error: ce } = await createCompany(payload);
              if (ce) throw new Error(ce);
              await supabase.from('staged_invoices').update({ company_id: newCo.id }).eq('id', inv.id);
              setInvoices((prev) => prev.map((i) => (i.id === inv.id ? { ...i, company_id: newCo.id } : i)));
              toastSuccess('Company created and linked — use the approve button to sync.');
            } catch (err) {
              toastError('Failed to create company: ' + (err?.message || String(err)));
            }
          }}
          onCancel={() => setCompanySearchModal(null)}
        />
      )}

      {/* Subscription History Selection Modal */}
      {subHistoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Remove Subscription Contributions</h2>
              <p className="text-sm text-gray-500 mt-1">
                Select which additions to remove for <strong>{subHistoryModal.companyName}</strong>.
                Removing all entries will delete the subscription.
              </p>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
              {/* Select / deselect all */}
              <label className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer border border-gray-200 bg-gray-50">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  checked={subHistorySelection.length === subHistoryModal.additionLines.length}
                  onChange={(e) =>
                    setSubHistorySelection(
                      e.target.checked ? [...subHistoryModal.additionLines] : [],
                    )
                  }
                />
                <span className="text-sm font-semibold text-gray-700">Select all ({subHistoryModal.additionLines.length})</span>
              </label>
              {subHistoryModal.additionLines.map((line, idx) => (
                <label key={idx} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    checked={subHistorySelection.includes(line)}
                    onChange={(e) =>
                      setSubHistorySelection((prev) =>
                        e.target.checked ? [...prev, line] : prev.filter((l) => l !== line),
                      )
                    }
                  />
                  <span className="text-sm text-gray-800">{line}</span>
                </label>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={subHistoryModal.onCancel}
                className="px-4 py-2 rounded font-medium text-sm border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                disabled={subHistorySelection.length === 0}
                onClick={() => subHistoryModal.onConfirm(subHistorySelection)}
                className={
                  'px-4 py-2 rounded font-medium text-sm ' +
                  (subHistorySelection.length === subHistoryModal.additionLines.length
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-amber-500 hover:bg-amber-600 text-white')
                }
              >
                {subHistorySelection.length === subHistoryModal.additionLines.length
                  ? 'Delete subscription'
                  : `Remove ${subHistorySelection.length} selected`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Match Verification Modal */}
      {verifyModal && (
        <MatchVerificationModal
          invoice={verifyModal.invoice}
          company={verifyModal.company}
          onConfirm={handleConfirmMatch}
          onCancel={() => setVerifyModal(null)}
          onCreateNew={() => {
            const { invoice } = verifyModal;
            setVerifyModal(null);
            setCompanySearchModal(invoice);
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
                    className="px-2 py-2 border-b border-gray-200 cursor-pointer hover:bg-gray-100 w-[90px] whitespace-nowrap"
                    onClick={() => handleSort('invoice_number')}
                  >
                    Invoice {getSortIcon('invoice_number')}
                  </th>
                  <th
                    className="px-2 py-2 border-b border-gray-200 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('company_name')}
                  >
                    Company {getSortIcon('company_name')}
                  </th>
                  <th
                    className="px-2 py-2 border-b border-gray-200 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('date')}
                  >
                    Date {getSortIcon('date')}
                  </th>
                  <th className="px-2 py-2 border-b border-gray-200 text-left whitespace-nowrap">Item</th>
                  <th className="px-2 py-2 border-b border-gray-200 text-left min-w-[120px]">Area</th>
                  <th className="px-2 py-2 border-b border-gray-200 text-left w-full">Notes</th>
                  {/* split meal columns */}

                  <th
                    className="px-4 py-3 text-center border-b border-gray-200 cursor-pointer hover:bg-gray-100 w-[90px] whitespace-nowrap"
                    onClick={() => handleSort('status')}
                  >
                    Status {getSortIcon('status')}
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-100">
                {processedInvoices.map((inv) => {
                  // matchCompany is pre-computed by processedInvoices (multi-field best-match)
                  const matchCompany = inv.matchCompany;
                  const matchReasons = inv.matchReasons || [];

                  let parsedData = {};
                  try {
                    parsedData = JSON.parse(inv.notes || '{}');
                  } catch (e) {}

                  // helper to persist notes changes and update local cache
                  const saveNotes = async (newNotes) => {
                    try {
                      const { error } = await supabase
                        .from('staged_invoices')
                        .update({ notes: JSON.stringify(newNotes) })
                        .eq('id', inv.id);
                      if (error) throw error;
                      setInvoices((prev) =>
                        prev.map((i) => (i.id === inv.id ? { ...i, notes: JSON.stringify(newNotes) } : i)),
                      );
                      return true;
                    } catch (err) {
                      toastError('Failed to update invoice: ' + (err.message || err));
                      return false;
                    }
                  };

                  // helper that derives subscription counts from a single line item
                  const getCountsForItem = (item) => {
                    // normalize quantity to a number; fall back to 1 on invalid values
                    let qty = Number(item.quantity);
                    if (Number.isNaN(qty) || qty <= 0) qty = 1;
                    const desc = ((item.item || item.description) || '').toLowerCase();
                    let stands = 0;
                    let breakfast_sat = 0, lunch_sat = 0, bbq_sat = 0, breakfast_sun = 0, lunch_sun = 0;

                    // Resolve the column from the configured allowed-items list in settings.
                    // Each entry is {label: string, column: string}; old plain-string entries
                    // have no column and fall through to keyword detection below.
                    const allowedItems = settings?.invoice_allowed_items || [];
                    let mappedColumn = null;
                    for (const ai of allowedItems) {
                      const label = (typeof ai === 'string' ? ai : (ai?.label || '')).trim().toLowerCase();
                      if (label.length > 0 && desc.includes(label)) {
                        mappedColumn = typeof ai === 'string' ? null : (ai.column || null);
                        break;
                      }
                    }

                    if (mappedColumn) {
                      switch (mappedColumn) {
                        case 'booth_count':        stands += qty; break;
                        case 'booth_count_double': stands += 2 * qty; break;
                        case 'breakfast_sat':      breakfast_sat += qty; break;
                        case 'breakfast_sun':      breakfast_sun += qty; break;
                        case 'lunch_sat':          lunch_sat += qty; break;
                        case 'lunch_sun':          lunch_sun += qty; break;
                        case 'bbq_sat':            bbq_sat += qty; break;
                        // 'ignore': nothing to increment
                      }
                    } else {
                      // Fallback: keyword-based detection for plain-string or unclassified items
                      const isBooth = (desc.includes('stand') || desc.includes('kraam')) &&
                                     !desc.includes('bbq') && !desc.includes('barbecue') &&
                                     !desc.includes('lunch') && !desc.includes('meal') &&
                                     !desc.includes('maaltijd') && !desc.includes('ontbijt');
                      if (isBooth) {
                        if (desc.includes('6x12') || desc.includes('6 x 12') || desc.includes('dubbele')) {
                          stands += 2 * qty;
                        } else {
                          stands += 1 * qty;
                        }
                      }
                      if (desc.includes('bbq') || desc.includes('barbecue')) bbq_sat += qty;
                      if (desc.includes('lunch') || desc.includes('meal') || desc.includes('maaltijd')) lunch_sat += qty;
                      if (desc.includes('breakfast') || desc.includes('ontbijt')) breakfast_sat += qty;
                    }
                    // sunday meals currently unused; could add logic if needed
                    return { stands, breakfast_sat, lunch_sat, bbq_sat, breakfast_sun, lunch_sun };
                  };

                  // actions for individual line items
                  const handleItemAction = async (idx, action) => {
                    // Deep copy so mutations don't corrupt the shared parsedData reference
                    const items = JSON.parse(JSON.stringify(parsedData.line_items || []));
                    const oldStatus = items[idx]?.status || 'pending';

                    // Helper: deactivate this line item's subscription_line_item record
                    const undoItemFromSubscription = async (item) => {
                      if (!inv.company_id) return;
                      const existing = await fetchFreshSubscription(inv.company_id);
                      if (!existing) return;
                      try {
                        const counts = getCountsForItem(item);
                        // Find line items matching this invoice + item description
                        const lineItems = await getActiveLineItems(existing.id);
                        const itemDesc = (item.item || item.description || '').toLowerCase();
                        const match = lineItems.find(li =>
                          li.source_ref === inv.invoice_number &&
                          li.description && li.description.toLowerCase().includes(itemDesc),
                        );
                        if (match) {
                          await deactivateLineItem(match.id);
                          const countParts = [
                            counts.stands > 0 ? counts.stands + ' booth(s)' : '',
                            counts.breakfast_sat > 0 ? counts.breakfast_sat + ' breakfast sat' : '',
                            counts.lunch_sat > 0 ? counts.lunch_sat + ' lunch sat' : '',
                            counts.bbq_sat > 0 ? counts.bbq_sat + ' BBQ sat' : '',
                            counts.breakfast_sun > 0 ? counts.breakfast_sun + ' breakfast sun' : '',
                            counts.lunch_sun > 0 ? counts.lunch_sun + ' lunch sun' : '',
                          ].filter(Boolean).join(', ');
                          await appendHistory(existing.id, 'Removed on ' + formatHistoryTimestamp() + ': Invoice ' + inv.invoice_number + ' line item ' + (item.item || item.description) + (countParts ? ' — ' + countParts : ''));
                          // Check if subscription should be deleted
                          const remaining = await getActiveLineItems(existing.id);
                          if (remaining.length === 0) {
                            await unsubscribeCompany(existing.id);
                          }
                          await reload?.();
                        }
                      } catch (e) {
                        toastError('Failed to revert subscription: ' + (e?.message || e));
                      }
                    };

                    // undoing a previous approval/rejection
                    if (action === 'pending' && oldStatus === 'approved' && inv.company_id) {
                      await undoItemFromSubscription(items[idx]);
                    }

                    // deleting a previously-approved item — same as undo for the subscription
                    if (action === 'delete' && oldStatus === 'approved' && inv.company_id) {
                      await undoItemFromSubscription(items[idx]);
                    }

                    // subscription update when approving
                    if (action === 'approved' && inv.company_id) {
                      const item = items[idx];
                      const counts = getCountsForItem(item);
                      const invoiceArea = item.area || '';
                      const customerNote = parsedData.notes || '';
                      const invoiceHasBoothItems = items.some((i) => getCountsForItem(i).stands > 0);
                      const isBoothItem = counts.stands > 0;
                      const attachNotes = isBoothItem || !invoiceHasBoothItems;
                      const effectiveNote = attachNotes ? customerNote : '';

                      const countParts = [
                        counts.stands > 0 ? counts.stands + ' booth(s)' : '',
                        counts.breakfast_sat > 0 ? counts.breakfast_sat + ' breakfast sat' : '',
                        counts.lunch_sat > 0 ? counts.lunch_sat + ' lunch sat' : '',
                        counts.bbq_sat > 0 ? counts.bbq_sat + ' BBQ sat' : '',
                        counts.breakfast_sun > 0 ? counts.breakfast_sun + ' breakfast sun' : '',
                        counts.lunch_sun > 0 ? counts.lunch_sun + ' lunch sun' : '',
                      ].filter(Boolean).join(', ');
                      const itemLabel = (item.item || item.description) + (item.quantity ? ' x' + item.quantity : '');
                      const description = 'Invoice ' + inv.invoice_number + ': ' + itemLabel;
                      const historyLine = 'Invoice ' + inv.invoice_number + ' on ' + formatHistoryTimestamp() + ': ' + itemLabel;

                      const existing = await fetchFreshSubscription(inv.company_id);
                      if (existing) {
                        const doMerge = await confirm({
                          title: t('subscriptionAlreadyExists', { companyName: inv.company_name || '' }),
                          message: t('subscriptionAlreadyExistsForYear', {
                            companyName: inv.company_name || '',
                            year: selectedYear,
                            booths: existing.booth_count,
                            defaultValue: 'A subscription already exists for {{year}} (booths: {{booths}}).\n\nMerge will add this item\'s counts to the existing subscription.\nReplace will overwrite it completely with this item.'
                          }),
                          confirmText: t('mergeAction', 'Merge'),
                          cancelText: t('replaceAction', 'Replace'),
                        });

                        if (doMerge) {
                          await addLineItem(existing.id, {
                            source: 'invoice',
                            sourceRef: inv.invoice_number,
                            counts: {
                              booth_count: counts.stands,
                              breakfast_sat: counts.breakfast_sat,
                              lunch_sat: counts.lunch_sat,
                              bbq_sat: counts.bbq_sat,
                              breakfast_sun: counts.breakfast_sun,
                              lunch_sun: counts.lunch_sun,
                            },
                            area: invoiceArea || null,
                            notes: effectiveNote || null,
                            description,
                          });
                          await appendHistory(existing.id, historyLine);
                        } else {
                          // Replace: deactivate all existing, add new
                          const existingItems = await getActiveLineItems(existing.id);
                          for (const li of existingItems) {
                            await deactivateLineItem(li.id);
                          }
                          await addLineItem(existing.id, {
                            source: 'invoice',
                            sourceRef: inv.invoice_number,
                            counts: {
                              booth_count: counts.stands,
                              breakfast_sat: counts.breakfast_sat,
                              lunch_sat: counts.lunch_sat,
                              bbq_sat: counts.bbq_sat,
                              breakfast_sun: counts.breakfast_sun,
                              lunch_sun: counts.lunch_sun,
                            },
                            area: invoiceArea || null,
                            notes: effectiveNote || null,
                            description,
                          });
                          await supabase
                            .from('event_subscriptions')
                            .update({ history: historyLine })
                            .eq('id', existing.id);
                        }
                        await reload?.();
                      } else {
                        const subResult = await subscribeCompany(inv.company_id, {
                          booth_count: 0,
                          area: '',
                          notes: '',
                          history: historyLine,
                          phone: inv.phone,
                          email: inv.email,
                          breakfast_sat: 0,
                          lunch_sat: 0,
                          bbq_sat: 0,
                          breakfast_sun: 0,
                          lunch_sun: 0,
                        });
                        if (subResult?.data?.id) {
                          await addLineItem(subResult.data.id, {
                            source: 'invoice',
                            sourceRef: inv.invoice_number,
                            counts: {
                              booth_count: counts.stands,
                              breakfast_sat: counts.breakfast_sat,
                              lunch_sat: counts.lunch_sat,
                              bbq_sat: counts.bbq_sat,
                              breakfast_sun: counts.breakfast_sun,
                              lunch_sun: counts.lunch_sun,
                            },
                            area: invoiceArea || null,
                            notes: effectiveNote || null,
                            description,
                          });
                        }
                      }
                    }

                    if (action === 'delete') {
                      items.splice(idx, 1);
                    } else {
                      items[idx] = { ...items[idx], status: action };
                    }
                    const newNotes = { ...parsedData, line_items: items };
                    const ok = await saveNotes(newNotes);
                    if (ok) {

                      // Compute the correct invoice-level status from the updated item list.
                      const setInvoiceStatusOnly = async (newStatus) => {
                        pendingStatusRef.current.set(inv.id, newStatus);
                        try {
                          await supabase
                            .from('staged_invoices')
                            .update({ status: newStatus, updated_at: new Date().toISOString() })
                            .eq('id', inv.id);
                          setInvoices((prev) =>
                            prev.map((i) =>
                              i.id === inv.id ? { ...i, status: newStatus } : i,
                            ),
                          );
                        } catch (e) {
                          console.error('Failed to update invoice status:', e);
                        } finally {
                          pendingStatusRef.current.delete(inv.id);
                        }
                      };

                      const allResolved =
                        items.length > 0 &&
                        items.every((it) => it.status === 'approved' || it.status === 'rejected');
                      const allApproved = allResolved && items.every((it) => it.status === 'approved');

                      if (allResolved) {
                        const targetStatus = allApproved ? 'approved' : 'partially_approved';
                        if (inv.status !== targetStatus) {
                          await setInvoiceStatusOnly(targetStatus);
                        }
                      } else if (
                        inv.status === 'approved' ||
                        inv.status === 'partially_approved'
                      ) {
                        await setInvoiceStatusOnly('pending');
                      }
                    }
                  };

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
                        <td className="px-2 py-2 border-r border-gray-50 align-top overflow-hidden truncate">
                          <div className="font-medium text-gray-900 truncate">{inv.company_name}</div>
                          {inv.status !== 'approved' && (
                            matchCompany ? (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleOpenVerifyModal(inv); }}
                                className="text-xs font-semibold px-1.5 py-0.5 rounded border mt-1 inline-flex flex-col items-start transition-colors cursor-pointer max-w-full"
                                style={inv.company_id
                                  ? { color: '#166534', background: '#dcfce7', borderColor: '#86efac' }
                                  : { color: '#854d0e', background: '#fef9c3', borderColor: '#fde047' }}
                                title={inv.company_id ? 'Click to re-verify match' : 'Click to verify match'}
                              >
                                <span>{inv.company_id ? '✓ Verified: ' : '? '}{matchCompany.name}</span>
                                {!inv.company_id && matchReasons.length > 0 && (
                                  <span className="font-normal opacity-60 text-[10px]">via {matchReasons.join(', ')}</span>
                                )}
                              </button>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleOpenVerifyModal(inv); }}
                                className="text-xs text-orange-700 font-semibold bg-orange-100 px-1.5 py-0.5 rounded border border-orange-300 mt-1 inline-block hover:bg-orange-200 transition-colors cursor-pointer"
                                title="Click to verify or create company"
                              >
                                ⚠ No match — verify
                              </button>
                            )
                          )}
                        </td>
                        <td className="px-2 py-2 border-r border-gray-50 text-gray-600 whitespace-nowrap align-top">
                          {parsedData.date || 'N/A'}
                        </td>
                        <td className="px-2 py-2 border-r border-gray-50 align-top">
                          {/* show every item inline with tiny controls so users can act without expanding */}
                          {lineItems && lineItems.length > 0 ? (
                            <div className="flex flex-col space-y-1">
                              {lineItems.map((item, idx) => (
                                <div
                                  key={idx}
                                  className={
                                    'flex items-center justify-between text-sm font-medium rounded px-1 ' +
                                    (item.status === 'approved'
                                      ? 'bg-green-50 text-green-700'
                                      : item.status === 'rejected'
                                        ? 'bg-red-50 text-gray-400'
                                        : 'text-indigo-700')
                                  }
                                >
                                  <span className="truncate flex items-center gap-2 mr-3">
                                    <span className={item.status === 'rejected' ? 'line-through' : ''}>
                                      {item.item || item.description}
                                    </span>
                                    <span className="text-xs text-gray-400">x{item.quantity}</span>
                                  </span>
                                  <div className="flex items-center space-x-1 shrink-0">
                                    {['approved','rejected','delete'].map((act, aidx) => {
                                      const icons = { approved: mdiCheck, rejected: mdiCancel, delete: mdiDelete };
                                      const colors = { approved: 'bg-green-600 text-white hover:bg-green-700',
                                                       rejected: 'bg-white border border-gray-300 text-red-600 hover:bg-red-50',
                                                       delete: 'bg-white border border-gray-300 text-red-500 hover:bg-red-50' };
                                      const titles = { approved: 'Mark approved',
                                                       rejected: 'Reject item',
                                                       delete: 'Delete item' };
                                      const disabled = !inv.company_id;
                                      // Replace the matching action button with undo when that status is active
                                      if (item.status === act && act !== 'delete') {
                                        return (
                                          <button
                                            key={aidx}
                                            onClick={(e) => { e.stopPropagation(); handleItemAction(idx, 'pending'); }}
                                            className={
                                              act === 'approved'
                                                ? 'p-1 rounded bg-green-600 text-white hover:bg-amber-500'
                                                : 'p-1 rounded bg-red-500 text-white hover:bg-amber-500'
                                            }
                                            title="Undo change"
                                          >
                                            <Icon path={mdiArrowULeftTop} size={0.6} />
                                          </button>
                                        );
                                      }
                                      return (
                                        <button
                                          key={aidx}
                                          onClick={(e) => { e.stopPropagation(); if (!disabled) handleItemAction(idx, act); }}
                                          disabled={disabled}
                                          className={
                                            `p-1 rounded ${colors[act]} ` +
                                            (disabled ? 'opacity-40 cursor-not-allowed' : '')
                                          }
                                          title={disabled ? 'Verify company first' : titles[act]}
                                        >
                                          <Icon path={icons[act]} size={0.6} />
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-sm text-indigo-700 font-medium whitespace-nowrap block">
                              {firstItem}{' '}
                              {hasMore && (
                                <span className="text-xs text-gray-500 font-normal">
                                  (+{lineItems.length - 1} more)
                                </span>
                              )}
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-2 border-r border-gray-50 align-top min-w-[120px]">
                          {(areaString || inv.area_preference) ? (
                            <div className="text-gray-500 text-xs">
                              {areaString || inv.area_preference}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-2 py-2 border-r border-gray-50 align-top">
                          <div className="text-gray-500 text-xs whitespace-pre-wrap break-words line-clamp-3">
                            {parsedData.rawNotes || parsedData.notes || rawNotesFallback || ''}
                          </div>
                        </td>
                        <td className="px-2 py-2 text-center border-r border-gray-50 align-top w-[80px]">
                          <span
                            className={
                              'px-2 py-1 rounded text-xs font-semibold ' +
                              (inv.status === 'approved'
                                ? 'bg-green-100 text-green-700 border border-green-200'
                                : inv.status === 'partially_approved'
                                  ? 'bg-teal-100 text-teal-700 border border-teal-200'
                                  : inv.status === 'rejected'
                                    ? 'bg-red-100 text-red-700 border border-red-200'
                                    : 'bg-yellow-100 text-yellow-700 border border-yellow-300')
                            }
                          >
                            {inv.status === 'approved'
                              ? 'SUBSCRIBED'
                              : inv.status === 'partially_approved'
                                ? 'PARTIAL'
                                : inv.status
                                  ? inv.status.toUpperCase()
                                  : 'PENDING'}
                          </span>
                        </td>
                      </tr>
                      {/* Expandable Subrow */}
                      {isExpanded && (
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <td colSpan="8" className="p-4 bg-slate-50 border-x border-gray-200">
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
