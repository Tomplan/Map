import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import Modal from './common/Modal';

/**
 * ActivityForm - Modal form for creating/editing event activities
 * @param {Object} props
 * @param {Object|null} props.activity - Activity to edit (null for create)
 * @param {string} props.day - 'saturday' or 'sunday'
 * @param {Function} props.onSave - Callback after successful save
 * @param {Function} props.onClose - Callback to close modal
 */
export default function ActivityForm({ activity, day, onSave, onClose }) {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [formData, setFormData] = useState({
    title_nl: '',
    title_de: '',
    title_en: '',
    description_nl: '',
    // Admin UI labels should remain EN/NL only: map any non-nl to 'en'
    const adminLang = (i18n && i18n.language === 'nl') ? 'nl' : 'en';

    const [tab, setTab] = useState('nl'); // 'nl' | 'en' | 'de'

    return (
    description_en: '',
    start_time: '',
    end_time: '',
    location_type: 'venue',
    location_nl: '',
    location_de: '',
        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4">
            <div className="space-y-6">
              {/* Language Tabs for content fields - keeps admin labels EN/NL only */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <button type="button" onClick={() => setTab('nl')} className={`px-3 py-1 rounded ${tab==='nl'?'bg-blue-600 text-white':'bg-gray-100 text-gray-700'}`}>NL</button>
                  <button type="button" onClick={() => setTab('en')} className={`px-3 py-1 rounded ${tab==='en'?'bg-blue-600 text-white':'bg-gray-100 text-gray-700'}`}>EN</button>
                  <button type="button" onClick={() => setTab('de')} className={`px-3 py-1 rounded ${tab==='de'?'bg-blue-600 text-white':'bg-gray-100 text-gray-700'}`}>DE</button>
                </div>

                {/* Content fields per language */}
                {tab === 'nl' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('activityForm.titleNL', { lng: adminLang })} <span className="text-red-500">*</span>
                      </label>
                      <input type="text" required value={formData.title_nl} onChange={(e)=>handleChange('title_nl', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Nederlandse titel" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('activityForm.descriptionNL', { lng: adminLang })} <span className="text-red-500">*</span>
                      </label>
                      <textarea rows={4} required value={formData.description_nl} onChange={(e)=>handleChange('description_nl', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Nederlandse beschrijving" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('activityForm.badgeNL', { lng: adminLang })} <span className="text-gray-500">({t('activityForm.optional', { lng: adminLang })})</span>
                      </label>
                      <input type="text" value={formData.badge_nl} onChange={(e)=>handleChange('badge_nl', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Bijv. GRATIS ENTREE!" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('activityForm.locationNL', { lng: adminLang })}
                      </label>
                      <input type="text" value={formData.location_nl} onChange={(e)=>handleChange('location_nl', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Nederlandse locatie" />
                    </div>
                  </div>
                )}

                {tab === 'en' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('activityForm.titleEN', { lng: adminLang })} <span className="text-red-500">*</span>
                      </label>
                      <input type="text" required value={formData.title_en} onChange={(e)=>handleChange('title_en', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="English title" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('activityForm.descriptionEN', { lng: adminLang })} <span className="text-red-500">*</span>
                      </label>
                      <textarea rows={4} required value={formData.description_en} onChange={(e)=>handleChange('description_en', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="English description" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('activityForm.badgeEN', { lng: adminLang })} <span className="text-gray-500">({t('activityForm.optional', { lng: adminLang })})</span>
                      </label>
                      <input type="text" value={formData.badge_en} onChange={(e)=>handleChange('badge_en', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="E.g. FREE ENTRY!" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('activityForm.locationEN', { lng: adminLang })}
                      </label>
                      <input type="text" value={formData.location_en} onChange={(e)=>handleChange('location_en', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="English location" />
                    </div>
                  </div>
                )}

                {tab === 'de' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('activityForm.titleDE')}</label>
                      <input type="text" value={formData.title_de} onChange={(e)=>handleChange('title_de', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Deutsche Titel" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('activityForm.descriptionDE')}</label>
                      <textarea rows={4} value={formData.description_de} onChange={(e)=>handleChange('description_de', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Deutsche Beschreibung" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('activityForm.badgeDE')}</label>
                      <input type="text" value={formData.badge_de} onChange={(e)=>handleChange('badge_de', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="B.v. GRATIS TOEGANG" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('activityForm.locationDE')}</label>
                      <input type="text" value={formData.location_de} onChange={(e)=>handleChange('location_de', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Deutsche locatie" />
                    </div>
                  </div>
                )}
              </div>

              {/* Time Fields */}
        if (error) throw error;
      }

      onSave();
      onClose();
    } catch (err) {
      console.error('Error saving activity:', err);
      alert(t('activityForm.saveError') + ': ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={activity ? t('activityForm.editTitle') : t('activityForm.createTitle')}
      size="xl"
    >
      {/* Form */}
      <form onSubmit={handleSubmit} className="px-6 py-4">
          <div className="space-y-6">
            {/* Title Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('activityForm.titleNL')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title_nl}
                  onChange={(e) => handleChange('title_nl', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nederlandse titel"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('activityForm.titleEN')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title_en}
                  onChange={(e) => handleChange('title_en', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="English title"
                />
              </div>
            </div>

            {/* German Description (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('activityForm.descriptionDE')}
              </label>
              <textarea
                rows={4}
                value={formData.description_de}
                onChange={(e) => handleChange('description_de', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Deutsche Beschreibung"
              />
            </div>
 
            {/* German Title (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('activityForm.titleDE')}
              </label>
              <input
                type="text"
                value={formData.title_de}
                onChange={(e) => handleChange('title_de', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Deutsche Titel"
              />
            </div>

            {/* Description Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('activityForm.descriptionNL')} <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.description_nl}
                  onChange={(e) => handleChange('description_nl', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nederlandse beschrijving"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('activityForm.descriptionEN')} <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.description_en}
                  onChange={(e) => handleChange('description_en', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="English description"
                />
              </div>
            </div>

            {/* Time Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('activityForm.startTime')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={formData.start_time}
                  onChange={(e) => handleChange('start_time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('activityForm.endTime')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={formData.end_time}
                  onChange={(e) => handleChange('end_time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Location Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('activityForm.locationType')} <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="venue"
                    checked={formData.location_type === 'venue'}
                    onChange={(e) => handleChange('location_type', e.target.value)}
                    className="mr-2"
                  />
                  {t('activityForm.venue')}
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="exhibitor"
                    checked={formData.location_type === 'exhibitor'}
                    onChange={(e) => handleChange('location_type', e.target.value)}
                    className="mr-2"
                  />
                  {t('activityForm.exhibitor')}
                </label>
              </div>
            </div>

            {/* Conditional Location Fields */}
            {formData.location_type === 'venue' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('activityForm.locationNL')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location_nl}
                    onChange={(e) => handleChange('location_nl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nederlandse locatie"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('activityForm.locationEN')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location_en}
                    onChange={(e) => handleChange('location_en', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="English location"
                  />
                </div>
              </div>
              </div>

              {/* German location (optional) */}
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('activityForm.locationDE')}
                </label>
                <input
                  type="text"
                  value={formData.location_de}
                  onChange={(e) => handleChange('location_de', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Deutsche locatie"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('activityForm.company')} <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.company_id || ''}
                  onChange={(e) => handleChange('company_id', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">{t('activityForm.selectCompany')}</option>
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Badge Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('activityForm.badgeNL')} <span className="text-gray-500">({t('activityForm.optional')})</span>
                </label>
                <input
                  type="text"
                  value={formData.badge_nl}
                  onChange={(e) => handleChange('badge_nl', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Bijv. GRATIS ENTREE!"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('activityForm.badgeEN')} <span className="text-gray-500">({t('activityForm.optional')})</span>
                </label>
                <input
                  type="text"
                  value={formData.badge_en}
                  onChange={(e) => handleChange('badge_en', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="E.g. FREE ENTRY!"
                />
              </div>
            </div>

            {/* German Badge (optional) */}
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('activityForm.badgeDE')} <span className="text-gray-500">({t('activityForm.optional')})</span>
              </label>
              <input
                type="text"
                value={formData.badge_de}
                onChange={(e) => handleChange('badge_de', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="B.v. GRATIS TOEGANG"
              />
            </div>

            {/* Display Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('activityForm.displayOrder')} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.display_order}
                onChange={(e) => handleChange('display_order', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                {t('activityForm.displayOrderHelp')}
              </p>
            </div>

            {/* Active Status */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => handleChange('is_active', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">
                  {t('activityForm.isActive')}
                </span>
              </label>
              <p className="mt-1 text-sm text-gray-500">
                {t('activityForm.isActiveHelp')}
              </p>
            </div>

            {/* Show Location Type Badge */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.show_location_type_badge}
                  onChange={(e) => handleChange('show_location_type_badge', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">
                  {t('activityForm.showLocationBadge')}
                </span>
              </label>
              <p className="mt-1 text-sm text-gray-500">
                {t('activityForm.showLocationBadgeHelp')}
              </p>
            </div>
          </div>
        </form>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-200">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {t('activityForm.cancel')}
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              {t('activityForm.saving')}
            </>
          ) : (
            t('activityForm.save')
          )}
        </button>
      </div>
    </Modal>
  );
}
