import { useState, useMemo, useEffect } from 'react';
import useCompanies from '../../hooks/useCompanies';
import useOrganizationProfile from '../../hooks/useOrganizationProfile';
import { useCompanyMutations } from '../../hooks/useCompanyMutations';
import useCompanyTranslations from '../../hooks/useCompanyTranslations';
import useCategories from '../../hooks/useCategories';
import Icon from '@mdi/react';
import { mdiPlus, mdiPencil, mdiDelete, mdiCheck, mdiClose, mdiMagnify, mdiDomain, mdiTag } from '@mdi/js';
import { getLogoPath } from '../../utils/getLogoPath';
import LogoUploader from '../LogoUploader';
import { useOrganizationLogo } from '../../contexts/OrganizationLogoContext';
import { useDialog } from '../../contexts/DialogContext';
import ContentLanguageTabs, { LanguageIndicator } from './ContentLanguageTabs';
import { useTranslation } from 'react-i18next';

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
  const { companies, loading: loadingCompanies, error: errorCompanies, createCompany, updateCompany, deleteCompany, searchCompanies } = useCompanies();
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
        console.log('Loading initial categories for company:', editingId, categoryIds);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, companies.length]); // Use companies.length for stable dependency

  // Save categories when exiting edit mode
  const handleSaveWithCategories = async () => {
    console.log('Saving company with categories:', { editingId, editingCategories });
    await handleSave();
    if (editingId && editingId !== 'organization') {
      const result = await assignCategoriesToCompany(editingId, editingCategories);
      console.log('Category assignment result:', result);
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
      {/* Header with search and add button */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Icon path={mdiMagnify} size={1} className="text-gray-500" />
          <input
            type="text"
            placeholder={t('helpPanel.companies.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          />
          <span className="text-sm text-gray-600">
            {filteredItems.length} of {companies.length + 1}
          </span>
        </div>
        <button
          onClick={handleStartCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Icon path={mdiPlus} size={0.8} />
          Add Company
        </button>
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
          {t('helpPanel.companies.publicInfoTab', 'Public Info')}
        </button>
        <button
          onClick={() => setActiveTab('manager')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'manager'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {t('helpPanel.companies.privateInfoTab', 'Private Info')}
        </button>
      </div>

      {/* Create new company form */}
      {isCreating && (
        <div className="mb-4 border rounded-lg overflow-hidden flex-shrink-0">
          <div className="p-4 bg-blue-50">
            <h3 className="font-bold mb-3">{t('helpPanel.companies.newCompany')}</h3>

            {/* Public Information Section */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-semibold text-sm mb-2 text-blue-800">Public Info (visible to attendees)</h4>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder={t('helpPanel.companies.companyNamePlaceholder')}
                  value={newCompanyForm.name}
                  onChange={(e) => setNewCompanyForm({ ...newCompanyForm, name: e.target.value })}
                  className="px-3 py-2 border rounded"
                />
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">{t('helpPanel.companies.companyLogo')}</label>
                  <LogoUploader
                    currentLogo={newCompanyForm.logo}
                    onUploadComplete={(url, path) => {
                      setNewCompanyForm({ ...newCompanyForm, logo: url });
                    }}
                    folder="companies"
                    label="Upload Logo"
                    showPreview={true}
                    allowDelete={true}
                    onDelete={() => {
                      setNewCompanyForm({ ...newCompanyForm, logo: organizationLogo });
                    }}
                  />
                  <input
                    type="text"
                    placeholder={t('helpPanel.companies.logoUrlPlaceholder')}
                    value={newCompanyForm.logo}
                    onChange={(e) => setNewCompanyForm({ ...newCompanyForm, logo: e.target.value })}
                    className="px-3 py-2 border rounded mt-2 w-full text-sm"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Website URL"
                  value={newCompanyForm.website}
                  onChange={(e) => setNewCompanyForm({ ...newCompanyForm, website: e.target.value })}
                  className="px-3 py-2 border rounded"
                />
                <textarea
                  placeholder={t('helpPanel.companies.infoPlaceholder')}
                  value={newCompanyForm.info}
                  onChange={(e) => setNewCompanyForm({ ...newCompanyForm, info: e.target.value })}
                  className="px-3 py-2 border rounded"
                  rows={2}
                />
              </div>
            </div>

            {/* Manager-Only Information Section */}
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <h4 className="font-semibold text-sm mb-2 text-green-800">Manager-Only Info (default contact info)</h4>
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Contact Person"
                  value={newCompanyForm.contact || ''}
                  onChange={(e) => setNewCompanyForm({ ...newCompanyForm, contact: e.target.value })}
                  className="px-3 py-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="Phone"
                  value={newCompanyForm.phone || ''}
                  onChange={(e) => setNewCompanyForm({ ...newCompanyForm, phone: e.target.value })}
                  className="px-3 py-2 border rounded"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newCompanyForm.email || ''}
                  onChange={(e) => setNewCompanyForm({ ...newCompanyForm, email: e.target.value })}
                  className="px-3 py-2 border rounded"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleCreate}
              className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            >
              <Icon path={mdiCheck} size={0.7} />
              Create
            </button>
            <button
              onClick={handleCancelCreate}
              className="flex items-center gap-1 px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              <Icon path={mdiClose} size={0.7} />
              Cancel
            </button>
          </div>
        </div>
      )}

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
              const isEditing = editingId === item.id;
              const isOrg = item.isOrganization;
              const rowClass = isOrg ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 hover:bg-gray-50';
              const bgColor = activeTab === 'public' ? 'bg-blue-50' : 'bg-green-50';

              return (
                <tr key={item.id} className={`${rowClass} border-b`}>
                  {/* Name - always shown */}
                  <td className={`py-1 px-3 border-b text-left ${!isOrg ? bgColor : ''}`}>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full bg-white text-gray-900 border rounded px-2 py-1"
                      />
                    ) : (
                      <span className="font-semibold">{item.name}</span>
                    )}
                  </td>

                  {activeTab === 'public' ? (
                    <>
                  {/* Logo */}
                  <td className={`py-1 px-3 border-b text-left ${!isOrg ? 'bg-blue-50' : ''}`}>
  {isEditing ? (
    <div className="flex flex-col gap-2">
      <LogoUploader
        currentLogo={editForm.logo}
        onUploadComplete={(url, path) => {
          setEditForm({ ...editForm, logo: url });
        }}
        folder={isOrg ? "organization" : "companies"}
        label="Upload"
        showPreview={true}
        allowDelete={true}
        onDelete={() => {
          setEditForm({ ...editForm, logo: organizationLogo });
        }}
      />
      <input
        type="text"
        value={editForm.logo || ''}
        onChange={(e) => setEditForm({ ...editForm, logo: e.target.value })}
        className="w-full bg-white text-gray-900 border rounded px-2 py-1 text-xs"
        placeholder="Or paste URL"
      />
    </div>
  ) : (
    <img
      src={getLogoPath((item.logo && item.logo.trim() !== '') ? item.logo : organizationLogo)}
      alt={item.name}
      className="h-8 object-contain"
    />
  )}
</td>

                  {/* Website */}
                  <td className={`py-1 px-3 border-b text-left ${!isOrg ? 'bg-blue-50' : ''}`}>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.website || ''}
                        onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                        className="w-full bg-white text-gray-900 border rounded px-2 py-1"
                        placeholder="Website URL"
                      />
                    ) : item.website ? (
                      <a href={item.website.startsWith('http') ? item.website : `https://${item.website}`} target="_blank" rel="noopener noreferrer" className={isOrg ? "text-blue-300 hover:underline" : "text-blue-600 hover:underline"}>
                        {item.website.replace(/^https?:\/\//, '').substring(0, 30)}
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm italic">Not set</span>
                    )}
                  </td>

                  {/* Info - Multi-language */}
                  <td className={`py-1 px-3 border-b text-left max-w-xs ${!isOrg ? 'bg-blue-50' : ''}`}>
                    {isEditing ? (
                      isOrg ? (
                        <textarea
                          value={editForm.info || ''}
                          onChange={(e) => setEditForm({ ...editForm, info: e.target.value })}
                          className="w-full bg-white text-gray-900 border rounded px-2 py-1"
                          rows={4}
                          placeholder="Organization info"
                        />
                      ) : (
                        <InfoFieldWithTranslations
                          companyId={item.id}
                          editingLanguage={editingContentLanguage}
                          onLanguageChange={setEditingContentLanguage}
                        />
                      )
                    ) : (
                      isOrg ? (
                        <p className="line-clamp-3 whitespace-pre-wrap">
                          {item.info || <span className="text-gray-400 text-sm italic">Not set</span>}
                        </p>
                      ) : (
                        <InfoFieldDisplay
                          companyId={item.id}
                          currentLanguage={i18n.language}
                        />
                      )
                    )}
                  </td>

                  {/* Categories */}
                  <td className={`py-1 px-3 border-b text-left ${!isOrg ? 'bg-blue-50' : ''}`}>
                    {isEditing && !isOrg ? (
                      categories.length > 0 ? (
                        <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                          {categories.map(cat => (
                            <label key={cat.id} className="flex items-center gap-1 cursor-pointer hover:bg-blue-50 px-1 rounded">
                              <input
                                type="checkbox"
                                checked={editingCategories.includes(cat.id)}
                                onChange={(e) => {
                                  const newCategories = e.target.checked
                                    ? [...editingCategories, cat.id]
                                    : editingCategories.filter(id => id !== cat.id);
                                  console.log('Category toggle:', cat.name, 'checked:', e.target.checked, 'new array:', newCategories);
                                  setEditingCategories(newCategories);
                                }}
                                className="cursor-pointer"
                              />
                              <span className="text-xs">{cat.name}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <span className="text-red-500 text-xs italic">Run migration 007</span>
                      )
                    ) : isOrg ? (
                      <span className="text-gray-400 text-xs italic">N/A</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {(companyCategories[item.id] || []).map(cat => (
                          <span key={cat.id} className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: cat.color + '20', color: cat.color }}>
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
                  <td className={`py-1 px-3 border-b text-left ${!isOrg ? 'bg-green-50' : ''}`}>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.contact || ''}
                        onChange={(e) => setEditForm({ ...editForm, contact: e.target.value })}
                        className="w-full bg-white text-gray-900 border rounded px-2 py-1"
                        placeholder="Contact Person"
                      />
                    ) : (
                      <span className="text-xs">{item.contact || <span className="text-gray-400 italic">Not set</span>}</span>
                    )}
                  </td>

                  {/* Phone */}
                  <td className={`py-1 px-3 border-b text-left ${!isOrg ? 'bg-green-50' : ''}`}>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.phone || ''}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="w-full bg-white text-gray-900 border rounded px-2 py-1"
                        placeholder="Phone"
                      />
                    ) : (
                      <span className="text-xs">{item.phone || <span className="text-gray-400 italic">Not set</span>}</span>
                    )}
                  </td>

                  {/* Email */}
                  <td className={`py-1 px-3 border-b text-left ${!isOrg ? 'bg-green-50' : ''}`}>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editForm.email || ''}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full bg-white text-gray-900 border rounded px-2 py-1"
                        placeholder="Email"
                      />
                    ) : (
                      <span className="text-xs">{item.email || <span className="text-gray-400 italic">Not set</span>}</span>
                    )}
                  </td>
                    </>
                  )}

                  {/* Actions */}
                  <td className="py-1 px-3 border-b text-left">
                    {isEditing ? (
                      <div className="flex gap-1 justify-center">
                        <button
                          onClick={handleSaveWithCategories}
                          className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700"
                          title="Save"
                        >
                          <Icon path={mdiCheck} size={0.8} />
                        </button>
                        <button
                          onClick={handleCancelWithCategories}
                          className="p-1.5 bg-gray-500 text-white rounded hover:bg-gray-600"
                          title="Cancel"
                        >
                          <Icon path={mdiClose} size={0.8} />
                        </button>
                      </div>
                    ) : (
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
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'No items found matching your search' : 'No companies yet. Click "Add Company" to create one.'}
          </div>
        )}
      </div>
    </div>
  );
}
