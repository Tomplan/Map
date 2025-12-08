import React, { useState, useMemo, useEffect } from 'react';
import useCompanies from '../../hooks/useCompanies';
import useOrganizationProfile from '../../hooks/useOrganizationProfile';
import { useCompanyMutations } from '../../hooks/useCompanyMutations';
import useCompanyTranslations from '../../hooks/useCompanyTranslations';
import useCategories from '../../hooks/useCategories';
import Icon from '@mdi/react';
import { mdiPlus, mdiPencil, mdiDelete, mdiCheck, mdiClose, mdiMagnify, mdiDomain, mdiTag } from '@mdi/js';
import { getLogoPath, getResponsiveLogoSources } from '../../utils/getLogoPath';
import { getDefaultLogoPath } from '../../utils/getDefaultLogo';
import LogoUploader from '../LogoUploader';
import { useOrganizationLogo } from '../../contexts/OrganizationLogoContext';
import { useDialog } from '../../contexts/DialogContext';
import ContentLanguageTabs, { LanguageIndicator } from './ContentLanguageTabs';
import { useTranslation } from 'react-i18next';
import Modal from '../common/Modal';
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
        placeholder={`Enter info in ${editingLanguage === 'nl' ? 'Dutch' : 'English'}...`}
        disabled={isSaving}
      />
      {isSaving && (
        <span className="text-xs text-gray-500 italic">Saving...</span>
      )}
    </div>
  );
}

/**
 * InfoFieldDisplay - Shows translated content with language indicator
 */
function InfoFieldDisplay({ companyId, currentLanguage }) {
  const { translations, getTranslation } = useCompanyTranslations(companyId);
  const displayText = getTranslation(currentLanguage, 'nl');

  return (
    <div className="flex items-start gap-2">
      <p className="line-clamp-3 whitespace-pre-wrap flex-1">
        {displayText || <span className="text-gray-400 text-sm italic">Not set</span>}
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
  const { companies, loading: loadingCompanies, error: errorCompanies, createCompany, updateCompany, deleteCompany, searchCompanies, reload: reloadCompanies } = useCompanies();
  const { profile: organizationProfile, loading: loadingProfile, error: errorProfile, updateProfile } = useOrganizationProfile();
  const { organizationLogo } = useOrganizationLogo();
  const { confirm, toastError } = useDialog();
  const { i18n, t } = useTranslation();
  const { categories, getCompanyCategories, getAllCompanyCategories, assignCategoriesToCompany } = useCategories();

  const [searchTerm, setSearchTerm] = useState('');
  const [editingContentLanguage, setEditingContentLanguage] = useState('nl');
  const [activeTab, setActiveTab] = useState('public');
  const [companyCategories, setCompanyCategories] = useState({});
  const [editingCategories, setEditingCategories] = useState([]);

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
    toastError
  });

  // Load categories when editing a company (only when editingId changes)
  useEffect(() => {
    const loadCompanyCategories = async () => {
      if (editingId && editingId !== 'organization') {
        const cats = await getCompanyCategories(editingId);
        const categoryIds = cats.map(c => c.id);
        setEditingCategories(categoryIds);
      } else if (!editingId) {
        // Clear when not editing
        setEditingCategories([]);
      }
    };
    loadCompanyCategories();
  }, [editingId]); // Only depend on editingId, not getCompanyCategories

  // Load categories for all companies when public tab is active
  useEffect(() => {
    const loadAllCategories = async () => {
      if (companies.length > 0) {
        const companyIds = companies.map(c => c.id);
        const categoriesMap = await getAllCompanyCategories(companyIds);
        setCompanyCategories(categoriesMap);
      }
    };
    
    // Load when public tab is active and companies are available
    if (activeTab === 'public' && companies.length > 0) {
      loadAllCategories();
    }
  }, [activeTab, companies.length, companies]); // Add companies as dependency for proper refresh

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
        setCompanyCategories(prev => ({
          ...prev,
          [editingId]: updatedCats
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

    if (!searchTerm) return allItems;

    const lowercasedTerm = searchTerm.toLowerCase();
    return allItems.filter(item => item.name?.toLowerCase().includes(lowercasedTerm));
  }, [organizationProfile, companies, searchTerm]);

  const loading = loadingCompanies || loadingProfile;
  const error = errorCompanies || errorProfile;

  if (loading) {
    return <div className="p-4">Loading data...</div>;
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
            placeholder={t('helpPanel.companies.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-600">
            {filteredItems.length} of {companies.length + 1}
          </span>
        </div>

        {/* Action buttons: Export, Import, Add */}
        <div className="flex gap-2">
          <ExportButton
            dataType="companies"
            data={companies}
            filename={`companies-${new Date().toISOString().split('T')[0]}`}
            additionalData={{ supabase }}
          />
          <ImportButton
            dataType="companies"
            existingData={companies}
            onImportComplete={async () => {
              // Reload companies - categories will reload automatically via useEffect
              await reloadCompanies();
            }}
          />
          <button
            onClick={handleStartCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Icon path={mdiPlus} size={0.8} />
            {t('helpPanel.companies.addCompany')}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b flex-shrink-0">
        <button
          onClick={() => setActiveTab('public')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'public'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {t('companies.publicInfoTab')}
        </button>
        <button
          onClick={() => setActiveTab('manager')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'manager'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {t('companies.privateInfoTab')}
        </button>
      </div>

      {/* Modal for Create/Edit */}
      <Modal
        isOpen={isCreating || !!editingId}
        onClose={isCreating ? handleCancelCreate : handleCancelWithCategories}
        title={isCreating ? t('companies.newCompany') : t('companies.modal.editTitle', { name: editForm.name || t('companies.newCompany') })}
        size="lg"
      >
        <div className="p-6">

              {/* Public Information Section */}
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-sm mb-3 text-blue-800">{t('companies.modal.publicInfoHeading', 'Public Info (visible to attendees)')}</h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder={t('companies.companyNamePlaceholder')}
                    value={isCreating ? newCompanyForm.name : editForm.name}
                    onChange={(e) => isCreating
                      ? setNewCompanyForm({ ...newCompanyForm, name: e.target.value })
                      : setEditForm({ ...editForm, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded bg-white text-gray-900"
                  />
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-900">{t('companies.companyLogo')}</label>
                    <LogoUploader
                      currentLogo={isCreating ? newCompanyForm.logo : editForm.logo}
                      onUploadComplete={(url, path) => {
                        isCreating
                          ? setNewCompanyForm({ ...newCompanyForm, logo: url })
                          : setEditForm({ ...editForm, logo: url });
                      }}
                      folder={editingId === 'organization' ? "organization" : "companies"}
                      label="Upload Logo"
                      showPreview={true}
                      allowDelete={true}
                      onDelete={() => {
                        isCreating
                          ? setNewCompanyForm({ ...newCompanyForm, logo: organizationLogo })
                          : setEditForm({ ...editForm, logo: organizationLogo });
                      }}
                    />
                    <input
                      type="text"
                      placeholder={t('companies.logoUrlPlaceholder')}
                      value={isCreating ? newCompanyForm.logo : (editForm.logo || '')}
                      onChange={(e) => isCreating
                        ? setNewCompanyForm({ ...newCompanyForm, logo: e.target.value })
                        : setEditForm({ ...editForm, logo: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded mt-2 text-sm bg-white text-gray-900"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder={t('companies.websiteUrlPlaceholder')}
                    value={isCreating ? newCompanyForm.website : (editForm.website || '')}
                    onChange={(e) => isCreating
                      ? setNewCompanyForm({ ...newCompanyForm, website: e.target.value })
                      : setEditForm({ ...editForm, website: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded bg-white text-gray-900"
                  />
                  {editingId === 'organization' ? (
                    <textarea
                      placeholder={t('companies.infoPlaceholder')}
                      value={isCreating ? newCompanyForm.info : (editForm.info || '')}
                      onChange={(e) => isCreating
                        ? setNewCompanyForm({ ...newCompanyForm, info: e.target.value })
                        : setEditForm({ ...editForm, info: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded bg-white text-gray-900"
                      rows={3}
                    />
                  ) : !isCreating ? (
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-900">Info (Multi-language)</label>
                      <InfoFieldWithTranslations
                        companyId={editingId}
                        editingLanguage={editingContentLanguage}
                        onLanguageChange={setEditingContentLanguage}
                      />
                    </div>
                  ) : (
                    <textarea
                      placeholder={t('companies.infoPlaceholder')}
                      value={newCompanyForm.info}
                      onChange={(e) => setNewCompanyForm({ ...newCompanyForm, info: e.target.value })}
                      className="w-full px-3 py-2 border rounded bg-white text-gray-900"
                      rows={3}
                    />
                  )}
                  {/* Categories - only for companies, not organization */}
                  {!isCreating && editingId !== 'organization' && (
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-900">Categories</label>
                      {categories.length > 0 ? (
                        <div className="flex flex-col gap-1.5">
                          {categories.map(cat => (
                            <label
                              key={cat.id}
                              className="inline-flex items-center gap-2 cursor-pointer px-2.5 py-1.5 rounded text-sm"
                              style={{
                                backgroundColor: editingCategories.includes(cat.id) ? cat.color + '30' : cat.color + '15',
                                color: cat.color,
                                border: `1px solid ${cat.color}40`
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={editingCategories.includes(cat.id)}
                                onChange={(e) => {
                                  const newCategories = e.target.checked
                                    ? [...editingCategories, cat.id]
                                    : editingCategories.filter(id => id !== cat.id);
                                  setEditingCategories(newCategories);
                                }}
                                className="cursor-pointer"
                              />
                              {cat.icon && <Icon path={cat.icon} size={0.6} />}
                              {cat.name}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <span className="text-red-500 text-sm italic">No categories available</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Manager-Only Information Section */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-sm mb-3 text-green-800">{t('companies.modal.managerInfoHeading', 'Manager-only Info (default contact info)')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder={t('companies.contactPlaceholder')}
                    value={isCreating ? (newCompanyForm.contact || '') : (editForm.contact || '')}
                    onChange={(e) => isCreating
                      ? setNewCompanyForm({ ...newCompanyForm, contact: e.target.value })
                      : setEditForm({ ...editForm, contact: e.target.value })
                    }
                    className="px-3 py-2 border rounded bg-white text-gray-900"
                  />
                  <PhoneInput
                    value={isCreating ? (newCompanyForm.phone || '') : (editForm.phone || '')}
                    onChange={(value) => isCreating
                      ? setNewCompanyForm({ ...newCompanyForm, phone: value })
                      : setEditForm({ ...editForm, phone: value })
                    }
                    placeholder="Phone (e.g., +31612345678)"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={isCreating ? (newCompanyForm.email || '') : (editForm.email || '')}
                    onChange={(e) => {
                      const email = e.target.value.toLowerCase();
                      isCreating
                        ? setNewCompanyForm({ ...newCompanyForm, email })
                        : setEditForm({ ...editForm, email });
                    }}
                    className="px-3 py-2 border rounded bg-white text-gray-900"
                  />
                </div>
              </div>

          {/* Action buttons */}
          <div className="flex gap-3 mt-6 justify-end">
            <button
              onClick={isCreating ? handleCancelCreate : handleCancelWithCategories}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={isCreating ? handleCreate : handleSaveWithCategories}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {isCreating ? t('companies.create', 'Create') : t('save')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Companies table */}
      <div className="flex-1 overflow-auto border rounded-lg">
        <table className="w-full rounded" style={{ tableLayout: 'fixed', fontSize: '11px' }}>
          <thead className="sticky top-0 z-10">
            <tr>
              {activeTab === 'public' ? (
                <>
                  <th className="p-2 text-left bg-blue-100 border-b text-gray-900">Name</th>
                  <th className="p-2 text-left bg-blue-100 border-b text-gray-900">Logo</th>
                  <th className="p-2 text-left bg-blue-100 border-b text-gray-900">Website</th>
                  <th className="p-2 text-left bg-blue-100 border-b text-gray-900">Info</th>
                  <th className="p-2 text-left bg-blue-100 border-b text-gray-900">Categories</th>
                </>
              ) : (
                <>
                  <th className="p-2 text-left bg-green-100 border-b text-gray-900">Name</th>
                  <th className="p-2 text-left bg-green-100 border-b text-gray-900">Contact</th>
                  <th className="p-2 text-left bg-green-100 border-b text-gray-900">Phone</th>
                  <th className="p-2 text-left bg-green-100 border-b text-gray-900">Email</th>
                </>
              )}
              <th className="p-2 bg-gray-100 border-b font-semibold text-gray-900" style={{ minWidth: '90px', width: '90px', maxWidth: '120px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => {
              const isOrg = item.isOrganization;
              const rowClass = isOrg ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 hover:bg-gray-50';
              const bgColor = activeTab === 'public' ? 'bg-blue-50' : 'bg-green-50';

              return (
                <tr key={item.id} className={`${rowClass} border-b`}>
                  {/* Name - always shown */}
                  <td className={`py-2 px-3 border-b text-left ${!isOrg ? bgColor : ''}`}>
                    <span className="font-semibold">{item.name}</span>
                  </td>

                  {activeTab === 'public' ? (
                    <>
                  {/* Logo */}
                  <td className={`py-2 px-3 border-b text-left ${!isOrg ? 'bg-blue-50' : ''}`}>
                    <img
                      {...(() => {
                        // Prefer an explicit default branding logo for organization-wide branding
                        // so tables and lists show the canonical generated variant (4x4Vakantiebeurs-128.webp)
                        // when a specific company has no logo set.
                        const fallback = getDefaultLogoPath();
                        // For organization rows prefer the canonical default branding logo
                        // (e.g. 4x4Vakantiebeurs-128.webp) rather than any uploaded org PNG filename.
                        const source = isOrg ? fallback : ((item.logo && item.logo.trim() !== '') ? item.logo : fallback);
                        const r = getResponsiveLogoSources(source);
                        if (r) return { src: r.src, srcSet: r.srcSet, sizes: r.sizes };
                        return { src: getLogoPath(source) };
                      })()}
                      alt={item.name}
                      className="h-8 object-contain"
                    />
                  </td>

                  {/* Website */}
                  <td className={`py-2 px-3 border-b text-left ${!isOrg ? 'bg-blue-50' : ''}`}>
                    {item.website ? (
                      <a href={item.website.startsWith('http') ? item.website : `https://${item.website}`} target="_blank" rel="noopener noreferrer" className={isOrg ? "text-blue-300 hover:underline" : "text-blue-600 hover:underline"}>
                        {item.website.replace(/^https?:\/\//, '').substring(0, 30)}
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm italic">Not set</span>
                    )}
                  </td>

                  {/* Info - Multi-language */}
                  <td className={`py-2 px-3 border-b text-left max-w-xs ${!isOrg ? 'bg-blue-50' : ''}`}>
                    {isOrg ? (
                      <p className="line-clamp-3 whitespace-pre-wrap">
                        {item.info || <span className="text-gray-400 text-sm italic">Not set</span>}
                      </p>
                    ) : (
                      <InfoFieldDisplay
                        companyId={item.id}
                        /*
                          Show Dutch (nl) in the admin list when row is NOT being edited.
                          When the row is opened for editing the modal controls editingLanguage
                          so the textarea there remains language-aware.
                        */
                        currentLanguage={editingId === item.id ? i18n.language : 'nl'}
                      />
                    )}
                  </td>

                  {/* Categories */}
                  <td className={`py-2 px-3 border-b text-left ${!isOrg ? 'bg-blue-50' : ''}`}>
                    {isOrg ? (
                      <span className="text-gray-400 text-xs italic">N/A</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {(companyCategories[item.id] || []).map(cat => (
                          <span
                            key={cat.id}
                            className="text-xs px-1.5 py-0.5 rounded inline-flex items-center gap-1"
                            style={{ backgroundColor: cat.color + '20', color: cat.color }}
                          >
                            {cat.icon && <Icon path={cat.icon} size={0.5} />}
                            {cat.name}
                          </span>
                        ))}
                        {(!companyCategories[item.id] || companyCategories[item.id].length === 0) && (
                          <span className="text-gray-400 text-xs italic">None</span>
                        )}
                      </div>
                    )}
                  </td>
                    </>
                  ) : (
                    <>
                  {/* Contact */}
                  <td className={`py-2 px-3 border-b text-left ${!isOrg ? 'bg-green-50' : ''}`}>
                    <span className="text-xs">{item.contact || <span className="text-gray-400 italic">Not set</span>}</span>
                  </td>

                  {/* Phone */}
                  <td className={`py-2 px-3 border-b text-left ${!isOrg ? 'bg-green-50' : ''}`}>
                    {item.phone ? (
                      <span className="text-xs flex items-center gap-1">
                        <span>{getPhoneFlag(item.phone)}</span>
                        <span>{formatPhoneForDisplay(item.phone)}</span>
                      </span>
                    ) : (
                      <span className="text-gray-400 italic text-xs">Not set</span>
                    )}
                  </td>

                  {/* Email */}
                  <td className={`py-2 px-3 border-b text-left ${!isOrg ? 'bg-green-50' : ''}`}>
                    <span className="text-xs">{item.email || <span className="text-gray-400 italic">Not set</span>}</span>
                  </td>
                    </>
                  )}

                  {/* Actions */}
                  <td className="py-2 px-3 border-b text-left">
                    <div className="flex gap-1 justify-center">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                        title="Edit"
                      >
                        <Icon path={mdiPencil} size={0.8} />
                      </button>
                      {!isOrg && (
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
                          className="p-1.5 bg-red-600 text-white rounded hover:bg-red-700"
                          title="Delete"
                        >
                          <Icon path={mdiDelete} size={0.8} />
                        </button>
                      )}
                      {isOrg && (
                        <div className="flex items-center justify-center pt-1 text-gray-300">
                          <Icon path={mdiDomain} size={0.8} />
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? t('companies.noResults') : t('companies.noCompanies')}
          </div>
        )}
      </div>
    </div>
  );
}
