import React, { useState, useMemo, useEffect, useRef } from 'react';
import useCompanies from '../../hooks/useCompanies';
import useOrganizationProfile from '../../hooks/useOrganizationProfile';
import { useCompanyMutations } from '../../hooks/useCompanyMutations';
import useCompanyTranslations from '../../hooks/useCompanyTranslations';
import useCategories from '../../hooks/useCategories';
import Icon from '@mdi/react';
import {
  mdiPlus,
  mdiPencil,
  mdiDelete,
  mdiMagnify,
  mdiDomain,
  mdiChevronDown,
  mdiChevronUp,
  mdiDotsVertical,
} from '@mdi/js';
import { getLogoPath, getResponsiveLogoSources } from '../../utils/getLogoPath';
import { getDefaultLogoPath } from '../../utils/getDefaultLogo';
import LogoUploader from '../LogoUploader';
import { useOrganizationLogo } from '../../contexts/OrganizationLogoContext';
import { useDialog } from '../../contexts/DialogContext';
import ContentLanguageTabs, { LanguageIndicator } from './ContentLanguageTabs';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import enLocales from '../../locales/en.json';
import nlLocales from '../../locales/nl.json';
import deLocales from '../../locales/de.json';

// static locales used as a last-resort fallback when runtime i18n resources
// are partially missing (e.g. HMR or old service-worker caches during dev).
const staticLocales = { en: enLocales, nl: nlLocales, de: deLocales };

function translateSafe(key, opts) {
  try {
    // Prefer the runtime translation if available
    if (i18n && i18n.exists(key)) return i18n.t(key, opts);

    // Fallback to static JSON for current language
    const lang = i18n?.language || 'nl';
    const parts = key.split('.');
    let cursor = staticLocales[lang] || staticLocales.nl;
    for (const p of parts) {
      if (!cursor || typeof cursor !== 'object') {
        cursor = undefined;
        break;
      }
      cursor = cursor[p];
    }
    if (cursor !== undefined) return typeof cursor === 'string' ? cursor : JSON.stringify(cursor);

    // Last-resort: return literal key
    return i18n?.t ? i18n.t(key, opts) : key;
  } catch (e) {
    return i18n?.t ? i18n.t(key, opts) : key;
  }
}
import PhoneInput from '../common/PhoneInput';
import { formatPhoneForDisplay, getPhoneFlag } from '../../utils/formatPhone';
import ExportButton from '../common/ExportButton';
import ImportButton from '../common/ImportButton';
import { supabase } from '../../supabaseClient';

/**
 * InfoFieldWithTranslations - Multi-language editing with auto-save
 */
function InfoFieldWithTranslations({ companyId, editingLanguage, onLanguageChange }) {
  const { translations, saveTranslation } = useCompanyTranslations(companyId);
  const { t } = useTranslation();
  const [localValue, setLocalValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Update local value when language or translations change
  useEffect(() => {
    setLocalValue(translations[editingLanguage] || '');
  }, [editingLanguage, translations]);

  const handleBlur = async () => {
    if (localValue !== (translations[editingLanguage] || '')) {
      setIsSaving(true);
      try {
        await saveTranslation(editingLanguage, localValue);
      } catch (error) {
        console.error('Failed to save translation:', error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="space-y-2">
      <ContentLanguageTabs
        currentLanguage={editingLanguage}
        onLanguageChange={onLanguageChange}
        translations={translations}
        className="mb-2"
      />
      <textarea
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        className="w-full bg-white text-gray-900 border rounded px-2 py-1"
        rows={4}
        placeholder={translateSafe('companies.modal.enterInfoInLanguage', {
          lang: editingLanguage === 'nl' ? t('languages.dutch') : t('languages.english'),
        })}
        disabled={isSaving}
      />
      {isSaving && (
        <span className="text-xs text-gray-500 italic">{translateSafe('companies.saving')}</span>
      )}
    </div>
  );
}

/**
 * InfoFieldDisplay - Shows translated content with language indicator
 */
function InfoFieldDisplay({ companyId, currentLanguage }) {
  const { translations, getTranslation } = useCompanyTranslations(companyId);
  const { t } = useTranslation();
  const displayText = getTranslation(currentLanguage, 'nl');

  return (
    <div className="flex items-start gap-2">
      <p className="line-clamp-3 whitespace-pre-wrap flex-1">
        {displayText || (
          <span className="text-gray-400 text-sm italic">{translateSafe('companies.notSet')}</span>
        )}
      </p>
      <LanguageIndicator translations={translations} />
    </div>
  );
}

/**
 * CompaniesTab - Manage permanent company list
 * Companies are reusable across years
 */
export default function CompaniesTab() {
  const {
    companies,
    loading: loadingCompanies,
    error: errorCompanies,
    createCompany,
    updateCompany,
    deleteCompany,
    searchCompanies,
    reload: reloadCompanies,
  } = useCompanies();

  // ensure we fetch at least once but avoid reloading when data already exists
  React.useEffect(() => {
    // only load if we have no companies yet
    if (companies.length === 0 && !loadingCompanies) {
      reloadCompanies();
    }
  }, [companies.length, reloadCompanies, loadingCompanies]);
  const {
    profile: organizationProfile,
    loading: loadingProfile,
    error: errorProfile,
    updateProfile,
  } = useOrganizationProfile();
  const { organizationLogo } = useOrganizationLogo();
  const { confirm, toastError } = useDialog();
  const { i18n: i18nHook, t } = useTranslation();
  const { categories, getCompanyCategories, getAllCompanyCategories, assignCategoriesToCompany } =
    useCategories();

  // Create stable dependency keys for categories and companies to avoid
  // re-running effects on every render due to new array/object references
  const categoriesDepsKey = useMemo(
    () => (categories || []).map((c) => `${c.id}:${c.name || ''}`).join('|'),
    [categories],
  );
  const companiesDepsKey = useMemo(
    () => (companies || []).map((c) => `${c.id}`).join(','),
    [companies],
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [editingContentLanguage, setEditingContentLanguage] = useState('nl');
  const [companyCategories, setCompanyCategories] = useState({});
  const [editingCategories, setEditingCategories] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target)) {
        setActionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Use company mutations hook
  const {
    editingId,
    editForm,
    setEditForm,
    isCreating,
    newCompanyForm,
    setNewCompanyForm,
    handleEdit,
    handleSave,
    handleCancel,
    handleDelete,
    handleCreate,
    handleStartCreate,
    handleCancelCreate,
  } = useCompanyMutations({
    createCompany,
    updateCompany,
    deleteCompany,
    updateProfile,
    organizationLogo,
    confirm,
    toastError,
  });

  // When edit starts, auto-select that item in the left panel
  useEffect(() => {
    if (editingId) setSelectedId(editingId);
  }, [editingId]);

  // Load categories when editing a company (only when editingId changes)
  useEffect(() => {
    const loadCompanyCategories = async () => {
      if (editingId && editingId !== 'organization') {
        const cats = await getCompanyCategories(editingId);
        const categoryIds = cats.map((c) => c.id);
        setEditingCategories(categoryIds);
      } else if (!editingId) {
        // Clear when not editing
        setEditingCategories([]);
      }
    };
    loadCompanyCategories();
  }, [editingId, categoriesDepsKey, getCompanyCategories]); // Re-run when global categories change so translations update

  // Load categories for all companies when public tab is active
  useEffect(() => {
    const loadAllCategories = async () => {
      if (companies.length > 0) {
        const companyIds = companies.map((c) => c.id);
        const categoriesMap = await getAllCompanyCategories(companyIds);
        setCompanyCategories(categoriesMap);
      }
    };

    if (companies.length > 0) {
      loadAllCategories();
    }
  }, [companies, companiesDepsKey, categoriesDepsKey, getAllCompanyCategories]); // Also depend on categories to refresh when their names change

  // Save categories when exiting edit mode
  const handleSaveWithCategories = async () => {
    // saving company categories
    await handleSave();
    if (editingId && editingId !== 'organization') {
      const result = await assignCategoriesToCompany(editingId, editingCategories);
      // category assignment result
      if (!result.success) {
        console.error('Failed to assign categories:', result.error);
        alert('Failed to save categories: ' + result.error);
      } else {
        // Reload categories for this company to update display
        const updatedCats = await getCompanyCategories(editingId);
        setCompanyCategories((prev) => ({
          ...prev,
          [editingId]: updatedCats,
        }));
      }
    }
    setEditingCategories([]);
  };

  // Wrap handleCancel to reset category state
  const handleCancelWithCategories = () => {
    handleCancel();
    setEditingCategories([]);
  };

  // Combine organization profile with companies and filter
  const filteredItems = useMemo(() => {
    const allItems = [];
    if (organizationProfile) {
      allItems.push({ ...organizationProfile, id: 'organization', isOrganization: true });
    }
    allItems.push(...companies);

    const filtered = searchTerm
      ? allItems.filter((item) => item.name?.toLowerCase().includes(searchTerm.toLowerCase()))
      : allItems;

    return [...filtered].sort((a, b) => {
      if (a.isOrganization) return -1;
      if (b.isOrganization) return 1;
      const cmp = (a.name || '').localeCompare(b.name || '');
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [organizationProfile, companies, searchTerm, sortDir]);

  // debug: trace when companies or filtered items change

  const loading = loadingCompanies || loadingProfile;
  const error = errorCompanies || errorProfile;

  if (loading) {
    return <div className="p-4">{translateSafe('companies.loadingData')}</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-red-600">
        {translateSafe('companies.errorWithMessage', { message: error })}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4">
      {/* Header with search and action buttons */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Icon path={mdiMagnify} size={1} className="text-gray-500" />
          <input
            type="text"
            placeholder={translateSafe('companies.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-600">
            {filteredItems.length} of {companies.length + 1}
          </span>
        </div>

        {/* Action buttons: Actions dropdown + Add */}
        <div className="flex gap-2 items-center">
          {/* Actions dropdown */}
          <div className="relative" ref={actionsRef}>
            <button
              onClick={() => setActionsOpen((o) => !o)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Icon path={mdiDotsVertical} size={0.8} />
              {translateSafe('companies.actions')}
              <Icon path={mdiChevronDown} size={0.7} className={`transition-transform ${actionsOpen ? 'rotate-180' : ''}`} />
            </button>
            {actionsOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                <div className="py-1">
                  <div className="px-2 py-1">
                    <ImportButton
                      dataType="companies"
                      existingData={companies}
                      onImportComplete={() => { reloadCompanies(); setActionsOpen(false); }}
                      buttonClassName="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
                    />
                  </div>
                  <div className="px-2 py-1">
                    <ExportButton
                      dataType="companies"
                      data={companies}
                      filename={`companies-${new Date().toISOString().split('T')[0]}`}
                      additionalData={{ supabase }}
                      buttonClassName="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={handleStartCreate}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Icon path={mdiPlus} size={0.8} />
            {translateSafe('companies.addCompany')}
          </button>
        </div>
      </div>



      {/* Master / Detail */}
      <div className="flex-1 flex gap-0 min-h-0 border rounded-lg overflow-hidden">

        {/* LEFT — company list */}
        <div className="w-72 flex-shrink-0 flex flex-col border-r bg-gray-50">
          {/* Sort bar */}
          <div className="px-3 py-2 border-b bg-gray-100 flex items-center justify-between">
            <button
              onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
              className="flex items-center gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wide hover:text-blue-600"
            >
              {translateSafe('companies.table.name')}
              <Icon path={sortDir === 'asc' ? mdiChevronUp : mdiChevronDown} size={0.6} />
            </button>
            <span className="text-xs text-gray-400">{filteredItems.length}</span>
          </div>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto">
            {filteredItems.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-8">
                {searchTerm ? translateSafe('companies.noResults') : translateSafe('companies.noCompanies')}
              </p>
            )}
            {filteredItems.map((item) => {
              const isOrg = item.isOrganization;
              const isSelected = selectedId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedId(isSelected ? null : item.id)}
                  className={[
                    'w-full text-left px-3 py-2.5 border-b flex items-center gap-3 transition-colors',
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : isOrg
                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                        : 'bg-white text-gray-900 hover:bg-blue-50',
                  ].join(' ')}
                >
                  <img
                    {...(() => {
                      const fallback = getDefaultLogoPath();
                      const source = item.logo && item.logo.trim() !== '' ? item.logo : fallback;
                      const r = getResponsiveLogoSources(source);
                      if (r) return { src: r.src, srcSet: r.srcSet, sizes: r.sizes };
                      return { src: getLogoPath(source) };
                    })()}
                    alt=""
                    className="h-7 w-7 object-contain flex-shrink-0 rounded"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{item.name}</p>
                    {item.website && (
                      <p className={`text-xs truncate ${isSelected ? 'text-blue-200' : 'text-gray-400'}`}>
                        {item.website.replace(/^https?:\/\//, '')}
                      </p>
                    )}
                    {!isOrg && (companyCategories[item.id] || []).length > 0 && (
                      <div className="flex gap-1 mt-0.5 flex-wrap">
                        {(companyCategories[item.id] || []).map((cat) => (
                          <span
                            key={cat.id}
                            className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: cat.color }}
                            title={cat.name}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  {isOrg && <Icon path={mdiDomain} size={0.7} className="flex-shrink-0 ml-auto opacity-60" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT — detail panel */}
        {(() => {
          // ── Shared inline-form helpers ────────────────────────────
          const inputCls =
            'w-full px-3 py-2 rounded-md border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition';

          const EditRow = ({ label, children }) => (
            <div className="flex items-start gap-4 py-3 border-b border-gray-100 last:border-0">
              <span className="w-28 flex-shrink-0 pt-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 leading-tight">
                {label}
              </span>
              <div className="flex-1 text-left">{children}</div>
            </div>
          );

          const renderForm = (form, set, isNew, targetId) => (
            <div className="flex-1 overflow-y-auto">
              <div className="px-6">
                {/* Public heading */}
                <div className="flex items-center gap-2 pt-4 pb-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
                    {translateSafe('companies.modal.publicInfoHeading', { defaultValue: 'Public info' })}
                  </span>
                </div>

                <EditRow label={translateSafe('companies.table.name')}>
                  <input type="text" placeholder={translateSafe('companies.companyNamePlaceholder')}
                    value={form.name || ''} onChange={(e) => set({ name: e.target.value })} className={inputCls} />
                </EditRow>

                <EditRow label={translateSafe('companies.table.logo')}>
                  <LogoUploader
                    currentLogo={form.logo}
                    onUploadComplete={(url) => set({ logo: url })}
                    folder={targetId === 'organization' ? 'organization' : 'companies'}
                    label={translateSafe('companies.modal.uploadLogo')}
                    showPreview={true} allowDelete={true}
                    onDelete={() => set({ logo: organizationLogo })}
                  />
                  <input type="text" placeholder={translateSafe('companies.logoUrlPlaceholder')}
                    value={form.logo || ''} onChange={(e) => set({ logo: e.target.value })}
                    className={`${inputCls} mt-2`} />
                </EditRow>

                <EditRow label={translateSafe('companies.table.website')}>
                  <input type="text" placeholder={translateSafe('companies.websiteUrlPlaceholder')}
                    value={form.website || ''} onChange={(e) => set({ website: e.target.value })} className={inputCls} />
                </EditRow>

                <EditRow label={translateSafe('companies.table.info')}>
                  {targetId === 'organization' || isNew ? (
                    <textarea placeholder={translateSafe('companies.infoPlaceholder')}
                      value={form.info || ''} onChange={(e) => set({ info: e.target.value })}
                      className={inputCls} rows={3} />
                  ) : (
                    <InfoFieldWithTranslations companyId={targetId}
                      editingLanguage={editingContentLanguage} onLanguageChange={setEditingContentLanguage} />
                  )}
                </EditRow>

                {!isNew && targetId !== 'organization' && (
                  <EditRow label={translateSafe('companies.modal.categoriesLabel')}>
                    {categories.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {categories.map((cat) => (
                          <label key={cat.id}
                            className="inline-flex items-center gap-1.5 cursor-pointer px-2.5 py-1 rounded-full text-xs font-medium select-none"
                            style={{ backgroundColor: editingCategories.includes(cat.id) ? cat.color + '30' : cat.color + '12',
                              color: cat.color, border: `1px solid ${cat.color}50` }}>
                            <input type="checkbox" checked={editingCategories.includes(cat.id)}
                              onChange={(e) => setEditingCategories(e.target.checked
                                ? [...editingCategories, cat.id]
                                : editingCategories.filter((id) => id !== cat.id))}
                              className="cursor-pointer w-3 h-3" />
                            {cat.icon && <Icon path={cat.icon} size={0.5} />}
                            {cat.name}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <span className="text-red-500 text-sm italic">{translateSafe('companies.noCategoriesAvailable')}</span>
                    )}
                  </EditRow>
                )}

                {/* Private heading */}
                <div className="flex items-center gap-2 pt-5 pb-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-widest text-green-600">
                    {translateSafe('companies.modal.managerInfoHeading', { defaultValue: 'Private details' })}
                  </span>
                </div>

                <EditRow label={translateSafe('companies.table.contact')}>
                  <input type="text" placeholder={translateSafe('companies.contactPlaceholder')}
                    value={form.contact || ''} onChange={(e) => set({ contact: e.target.value })} className={inputCls} />
                </EditRow>
                <EditRow label={translateSafe('companies.table.phone')}>
                  <PhoneInput value={form.phone || ''} onChange={(value) => set({ phone: value })}
                    placeholder={translateSafe('companies.phonePlaceholder')} />
                </EditRow>
                <EditRow label={translateSafe('companies.table.email')}>
                  <input type="email" placeholder={translateSafe('companies.emailPlaceholder')}
                    value={form.email || ''} onChange={(e) => set({ email: e.target.value.toLowerCase() })} className={inputCls} />
                </EditRow>
                <EditRow label={translateSafe('companies.table.address')}>
                  <div className="space-y-2">
                    <input type="text" placeholder={translateSafe('companies.addressLine1Placeholder')}
                      value={form.address_line1 || ''} onChange={(e) => set({ address_line1: e.target.value })} className={inputCls} />
                    <input type="text" placeholder={translateSafe('companies.addressLine2Placeholder')}
                      value={form.address_line2 || ''} onChange={(e) => set({ address_line2: e.target.value })} className={inputCls} />
                    <div className="grid grid-cols-3 gap-2">
                      <input type="text" placeholder={translateSafe('companies.cityPlaceholder')}
                        value={form.city || ''} onChange={(e) => set({ city: e.target.value })} className={inputCls} />
                      <input type="text" placeholder={translateSafe('companies.postalCodePlaceholder')}
                        value={form.postal_code || ''} onChange={(e) => set({ postal_code: e.target.value })} className={inputCls} />
                      <input type="text" placeholder={translateSafe('companies.countryPlaceholder')}
                        value={form.country || ''} onChange={(e) => set({ country: e.target.value })} className={inputCls} />
                    </div>
                  </div>
                </EditRow>
                <EditRow label={translateSafe('companies.table.vatNumber')}>
                  <input type="text" placeholder={translateSafe('companies.vatNumberPlaceholder')}
                    value={form.vat_number || ''} onChange={(e) => set({ vat_number: e.target.value })} className={inputCls} />
                </EditRow>
                <EditRow label={translateSafe('companies.table.kvkNumber')}>
                  <input type="text" placeholder={translateSafe('companies.kvkNumberPlaceholder')}
                    value={form.kvk_number || ''} onChange={(e) => set({ kvk_number: e.target.value })} className={inputCls} />
                </EditRow>

                {/* Save / Cancel */}
                <div className="flex gap-3 py-4 justify-end">
                  <button onClick={isNew ? handleCancelCreate : handleCancelWithCategories}
                    className="px-4 py-2 text-sm rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition">
                    {t('cancel')}
                  </button>
                  <button onClick={isNew ? handleCreate : handleSaveWithCategories}
                    className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-medium">
                    {isNew ? t('companies.create') : t('save')}
                  </button>
                </div>
              </div>
            </div>
          );

          // ── Create mode ──────────────────────────────────────────
          if (isCreating) {
            return renderForm(
              newCompanyForm,
              (patch) => setNewCompanyForm({ ...newCompanyForm, ...patch }),
              true,
              null,
            );
          }

          // ── No selection ─────────────────────────────────────────
          const item = filteredItems.find((i) => i.id === selectedId);
          if (!item) {
            return (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm select-none">
                ← {translateSafe('companies.selectCompany', { defaultValue: 'Select a company' })}
              </div>
            );
          }

          // ── Edit mode ────────────────────────────────────────────
          if (editingId === item.id) {
            return renderForm(
              editForm,
              (patch) => setEditForm({ ...editForm, ...patch }),
              false,
              item.id,
            );
          }

          const isOrg = item.isOrganization;
          const dash = <span className="text-gray-300">—</span>;

          // Shared row: fixed-width label left, value right
          const Row = ({ lbl, children, hidden }) =>
            hidden ? null : (
              <div className="flex items-start gap-4 py-3 border-b border-gray-100 last:border-0">
                <span className="w-28 flex-shrink-0 pt-0.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 leading-tight">
                  {lbl}
                </span>
                <div className="flex-1 text-left text-sm text-gray-900 leading-relaxed break-words">{children}</div>
              </div>
            );

          const logoProps = (() => {
            const fallback = getDefaultLogoPath();
            const source = item.logo && item.logo.trim() !== '' ? item.logo : fallback;
            const r = getResponsiveLogoSources(source);
            return r ? { src: r.src, srcSet: r.srcSet, sizes: r.sizes } : { src: getLogoPath(source) };
          })();

          return (
            <div className="flex-1 overflow-y-auto">
              <div className="px-6">

                {/* Actions row */}
                <div className="flex items-center gap-2 py-4 border-b border-gray-100">
                  <button
                    onClick={() => handleEdit(item)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                  >
                    <Icon path={mdiPencil} size={0.7} />
                    {translateSafe('companies.edit')}
                  </button>
                  {!isOrg && (
                    <button
                      onClick={() => handleDelete(item.id, item.name)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition"
                    >
                      <Icon path={mdiDelete} size={0.7} />
                      {translateSafe('companies.delete')}
                    </button>
                  )}
                </div>

                {/* Public section heading */}
                <div className="flex items-center gap-2 pt-4 pb-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
                    {translateSafe('companies.modal.publicInfoHeading', { defaultValue: 'Public info' })}
                  </span>
                </div>

                <Row lbl={translateSafe('companies.table.name')}>{item.name || dash}</Row>

                <Row lbl={translateSafe('companies.companyLogo')}>
                  <img
                    {...logoProps}
                    alt={item.name}
                    className="h-10 w-10 object-contain rounded border bg-white"
                  />
                </Row>

                <Row lbl={translateSafe('companies.table.website')}>
                  {item.website
                    ? <a
                        href={item.website.startsWith('http') ? item.website : `https://${item.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline break-all"
                      >
                        {item.website}
                      </a>
                    : dash}
                </Row>

                {!isOrg && (
                  <Row lbl={translateSafe('companies.modal.categoriesLabel')}>
                    {(companyCategories[item.id] || []).length > 0
                      ? <div className="flex flex-wrap gap-1.5">
                          {(companyCategories[item.id] || []).map((cat) => (
                            <span
                              key={cat.id}
                              className="text-xs px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1"
                              style={{ backgroundColor: cat.color + '20', color: cat.color }}
                            >
                              {cat.icon && <Icon path={cat.icon} size={0.45} />}
                              {cat.name}
                            </span>
                          ))}
                        </div>
                      : dash}
                  </Row>
                )}

                <Row lbl={translateSafe('companies.table.info')}>
                  {isOrg ? (item.info || dash) : <InfoFieldDisplay companyId={item.id} currentLanguage="nl" />}
                </Row>

                {/* Private section heading */}
                <div className="flex items-center gap-2 pt-5 pb-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-widest text-green-600">
                    {translateSafe('companies.modal.managerInfoHeading', { defaultValue: 'Private details' })}
                  </span>
                </div>
                <Row lbl={translateSafe('companies.table.contact')}>{item.contact || dash}</Row>
                <Row lbl={translateSafe('companies.table.phone')}>
                  {item.phone
                    ? <span className="inline-flex items-center gap-1.5">{getPhoneFlag(item.phone)} {formatPhoneForDisplay(item.phone)}</span>
                    : dash}
                </Row>
                <Row lbl={translateSafe('companies.table.email')}>
                  {item.email
                    ? <a href={`mailto:${item.email}`} className="text-blue-600 hover:underline break-all">{item.email}</a>
                    : dash}
                </Row>
                <Row lbl={translateSafe('companies.table.vatNumber')}>{item.vat_number || dash}</Row>
                <Row lbl={translateSafe('companies.table.kvkNumber')}>{item.kvk_number || dash}</Row>
                <Row lbl={translateSafe('companies.table.address')}>
                  {(item.address_line1 || item.address_line2 || item.city || item.postal_code || item.country)
                    ? <div className="space-y-0.5">
                        {item.address_line1 && <p>{item.address_line1}</p>}
                        {item.address_line2 && <p>{item.address_line2}</p>}
                        {(item.city || item.postal_code || item.country) && (
                          <p>{[item.city, item.postal_code, item.country].filter(Boolean).join(' ')}</p>
                        )}
                      </div>
                    : dash}
                </Row>
                <Row lbl={translateSafe('companies.notes')}>
                  {item.notes ? <span className="whitespace-pre-wrap">{item.notes}</span> : dash}
                </Row>

              </div>
            </div>
          );
        })()}
      </div>

    </div>
  );
}
