import React, { useState, useEffect } from 'react';
import Icon from '@mdi/react';
import {
  mdiPlus,
  mdiPencil,
  mdiDelete,
  mdiDragVertical,
  mdiCheck,
  mdiChartBar
} from '@mdi/js';
import { useTranslation } from 'react-i18next';
import useCategories from '../../hooks/useCategories';
import Modal from '../common/Modal';
import { useDialog } from '../../contexts/DialogContext';

// Available Material Design icons for categories
const AVAILABLE_ICONS = [
  { name: 'mdiCarOutline', label: 'Car' },
  { name: 'mdiTent', label: 'Tent' },
  { name: 'mdiTrailer', label: 'Trailer' },
  { name: 'mdiCarCog', label: 'Car Parts' },
  { name: 'mdiAirplane', label: 'Airplane' },
  { name: 'mdiHomeCity', label: 'Building' },
  { name: 'mdiAccountGroup', label: 'People' },
  { name: 'mdiTerrainIcon', label: 'Terrain' },
  { name: 'mdiCellphone', label: 'Phone' },
  { name: 'mdiDotsHorizontal', label: 'Other' }
];

const PRESET_COLORS = [
  '#1976d2', '#2e7d32', '#f57c00', '#d32f2f',
  '#00796b', '#5d4037', '#303f9f', '#689f38',
  '#7b1fa2', '#616161', '#c62828', '#00897b',
  '#5e35b1', '#455a64', '#6d4c41', '#d84315'
];

export default function CategoryManagement() {
  const { t, i18n } = useTranslation();
  const { categories, loading, error, createCategory, updateCategory, deleteCategory, getCategoryStats } = useCategories(i18n.language);
  const { confirm, toastSuccess, toastError } = useDialog();
  
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [stats, setStats] = useState({});
  
  const [formData, setFormData] = useState({
    slug: '',
    icon: 'mdiDotsHorizontal',
    color: '#616161',
    sort_order: 0,
    translations: {
      nl: { name: '', description: '' },
      en: { name: '', description: '' },
      de: { name: '', description: '' }
    }
  });

  // Load stats
  useEffect(() => {
    const loadStats = async () => {
      const categoryStats = await getCategoryStats();
      setStats(categoryStats);
    };
    if (!loading) {
      loadStats();
    }
  }, [loading, getCategoryStats, categories]);

  const resetForm = () => {
    setFormData({
      slug: '',
      icon: 'mdiDotsHorizontal',
      color: '#616161',
      sort_order: categories.length + 1,
      translations: {
        nl: { name: '', description: '' },
        en: { name: '', description: '' },
        de: { name: '', description: '' }
      }
    });
    setEditingCategory(null);
  };

  const handleCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      slug: category.slug,
      icon: category.iconName,
      color: category.color,
      sort_order: category.sort_order,
      translations: {
        nl: { name: '', description: '' },
        en: { name: '', description: '' },
        de: { name: '', description: '' }
      }
    });
    setShowModal(true);
  };

  const handleDelete = async (categoryId, categoryName) => {
    const confirmed = await confirm({
      title: t('admin.categories.deleteCategory'),
      message: t('admin.categories.confirmDelete', { name: categoryName }),
      confirmText: t('common.delete'),
      variant: 'danger'
    });
    if (!confirmed) return;

    const result = await deleteCategory(categoryId);
    if (result.success) {
      toastSuccess(t('admin.categories.deleteSuccess'));
    } else {
      toastError(t('admin.categories.deleteError', { error: result.error }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const categoryData = {
      slug: formData.slug,
      icon: formData.icon,
      color: formData.color,
      sort_order: formData.sort_order,
      translations: formData.translations
    };

    let result;
    if (editingCategory) {
      result = await updateCategory(editingCategory.id, categoryData, formData.translations);
    } else {
      result = await createCategory(categoryData);
    }

    if (result.success) {
      setShowModal(false);
      resetForm();
      alert(editingCategory ? t('categories.updateSuccess') : t('categories.createSuccess'));
    } else {
      alert(t('categories.saveError', { error: result.error }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{t('common.error')}: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('categories.title')}</h2>
          <p className="text-gray-600 mt-1">{t('categories.description')}</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Icon path={mdiPlus} size={0.8} />
          {t('categories.createNew')}
        </button>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('categories.order')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.categories.category')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.categories.slug')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.categories.exhibitors')}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('common.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.map((category) => (
              <tr key={category.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Icon path={mdiDragVertical} size={0.8} className="cursor-move" />
                    <span className="font-medium">{category.sort_order}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: category.color }}
                    >
                      <Icon path={category.icon} size={0.8} className="text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{category.name}</div>
                      <div className="text-sm text-gray-500">{category.description}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">{category.slug}</code>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Icon path={mdiChartBar} size={0.7} className="text-gray-400" />
                    <span className="text-sm text-gray-600">{stats[category.id] || 0}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(category)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    <Icon path={mdiPencil} size={0.8} />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id, category.name)}
                    className="text-red-600 hover:text-red-900"
                    disabled={stats[category.id] > 0}
                    title={stats[category.id] > 0 ? t('admin.categories.cannotDelete') : ''}
                  >
                    <Icon path={mdiDelete} size={0.8} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {categories.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {t('admin.categories.noCategories')}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={editingCategory ? t('admin.categories.editCategory') : t('admin.categories.createCategory')}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('admin.categories.slug')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="vehicles-dealers"
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('admin.categories.slugHelp')}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('admin.categories.icon')}
                    </label>
                    <select
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {AVAILABLE_ICONS.map(icon => (
                        <option key={icon.name} value={icon.name}>{icon.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('admin.categories.color')}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="#1976d2"
                      />
                    </div>
                    <div className="flex gap-1 mt-2">
                      {PRESET_COLORS.map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormData({ ...formData, color })}
                          className="w-6 h-6 rounded border-2 border-gray-200 hover:border-gray-400"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('admin.categories.sortOrder')}
                  </label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Translations */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">{t('admin.categories.translations')}</h4>
                
                {['nl', 'en', 'de'].map(lang => (
                  <div key={lang} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <h5 className="font-medium text-gray-700 uppercase">{lang}</h5>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('admin.categories.name')} ({lang}) *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.translations[lang].name}
                        onChange={(e) => setFormData({
                          ...formData,
                          translations: {
                            ...formData.translations,
                            [lang]: { ...formData.translations[lang], name: e.target.value }
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('admin.categories.description')} ({lang})
                      </label>
                      <textarea
                        value={formData.translations[lang].description}
                        onChange={(e) => setFormData({
                          ...formData,
                          translations: {
                            ...formData.translations,
                            [lang]: { ...formData.translations[lang], description: e.target.value }
                          }
                        })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                ))}
              </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => { setShowModal(false); resetForm(); }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Icon path={mdiCheck} size={0.8} />
              {editingCategory ? t('common.save') : t('common.create')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
