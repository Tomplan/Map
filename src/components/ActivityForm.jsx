import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './common/Modal';
import { useDialog } from '../contexts/DialogContext';
import { supabase } from '../supabaseClient';
import useCompanies from '../hooks/useCompanies';
import YearScopeBadge from './admin/YearScopeBadge';

export default function ActivityForm({ activity = null, day = 'saturday', year = new Date().getFullYear(), initialActivityData = null, onSave = () => {}, onClose = () => {} }) {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState('nl');
  const adminLang = (i18n && i18n.language === 'nl') ? 'nl' : 'en';
  // title + description + location + badge fields for nl/en/de
  const [titleNl, setTitleNl] = useState(activity?.title_nl || '');
  const [titleEn, setTitleEn] = useState(activity?.title_en || '');
  const [titleDe, setTitleDe] = useState(activity?.title_de || '');

  const [descriptionNl, setDescriptionNl] = useState(activity?.description_nl || '');
  const [descriptionEn, setDescriptionEn] = useState(activity?.description_en || '');
  const [descriptionDe, setDescriptionDe] = useState(activity?.description_de || '');

  const [locationNl, setLocationNl] = useState(activity?.location_nl || '');
  const [locationEn, setLocationEn] = useState(activity?.location_en || '');
  const [locationDe, setLocationDe] = useState(activity?.location_de || '');

  const [badgeNl, setBadgeNl] = useState(activity?.badge_nl || '');
  const [badgeEn, setBadgeEn] = useState(activity?.badge_en || '');
  const [badgeDe, setBadgeDe] = useState(activity?.badge_de || '');

  // meta fields
  const [startTime, setStartTime] = useState(activity?.start_time || '');
  const [endTime, setEndTime] = useState(activity?.end_time || '');
  const [displayOrder, setDisplayOrder] = useState(activity?.display_order ?? 0);
  const [isActive, setIsActive] = useState(activity?.is_active ?? true);
  const [showLocationTypeBadge, setShowLocationTypeBadge] = useState(activity?.show_location_type_badge ?? false);
  const [locationType, setLocationType] = useState(activity?.location_type || (activity?.company_id ? 'company' : 'venue'));
  const [companyId, setCompanyId] = useState(activity?.company_id ?? null);

  // unique id suffix used for element ids in the modal to avoid collisions
  const uid = activity?.id ?? 'new';

  const { toastSuccess, toastError } = useDialog();

  const { companies } = useCompanies();

  // Keep fields in sync if `activity` or `initialActivityData` changes
  useEffect(() => {
    // If editing an existing activity, use its data
    if (activity) {
      setTitleNl(activity.title_nl || '');
      setTitleEn(activity.title_en || '');
      setTitleDe(activity.title_de || '');

      setDescriptionNl(activity.description_nl || '');
      setDescriptionEn(activity.description_en || '');
      setDescriptionDe(activity.description_de || '');

      setLocationNl(activity.location_nl || '');
      setLocationEn(activity.location_en || '');
      setLocationDe(activity.location_de || '');

      setBadgeNl(activity.badge_nl || '');
      setBadgeEn(activity.badge_en || '');
      setBadgeDe(activity.badge_de || '');

      setStartTime(activity.start_time || '');
      setEndTime(activity.end_time || '');
      setDisplayOrder(activity.display_order || 0);
      setIsActive(activity.is_active ?? true);
      setShowLocationTypeBadge(activity.show_location_type_badge ?? false);
      setLocationType(activity.location_type || (activity.company_id ? 'company' : 'venue'));
      setCompanyId(activity.company_id || null);
    }
    // If pasting copied data (creating new activity), use the copied data
    else if (initialActivityData) {
      setTitleNl(initialActivityData.title_nl || '');
      setTitleEn(initialActivityData.title_en || '');
      setTitleDe(initialActivityData.title_de || '');

      setDescriptionNl(initialActivityData.description_nl || '');
      setDescriptionEn(initialActivityData.description_en || '');
      setDescriptionDe(initialActivityData.description_de || '');

      setLocationNl(initialActivityData.location_nl || '');
      setLocationEn(initialActivityData.location_en || '');
      setLocationDe(initialActivityData.location_de || '');

      setBadgeNl(initialActivityData.badge_nl || '');
      setBadgeEn(initialActivityData.badge_en || '');
      setBadgeDe(initialActivityData.badge_de || '');

      setStartTime(initialActivityData.start_time || '');
      setEndTime(initialActivityData.end_time || '');
      setDisplayOrder(initialActivityData.display_order || 0);
      setIsActive(initialActivityData.is_active ?? true);
      setShowLocationTypeBadge(initialActivityData.show_location_type_badge ?? false);
      setLocationType(initialActivityData.location_type || (initialActivityData.company_id ? 'company' : 'venue'));
      setCompanyId(initialActivityData.company_id || null);
    }
    // If creating a new activity from scratch, reset to defaults
    else {
      setTitleNl('');
      setTitleEn('');
      setTitleDe('');

      setDescriptionNl('');
      setDescriptionEn('');
      setDescriptionDe('');

      setLocationNl('');
      setLocationEn('');
      setLocationDe('');

      setBadgeNl('');
      setBadgeEn('');
      setBadgeDe('');

      setStartTime('');
      setEndTime('');
      setDisplayOrder(0);
      setIsActive(true);
      setShowLocationTypeBadge(false);
      setLocationType('venue');
      setCompanyId(null);
    }
  }, [activity, initialActivityData]);

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    // Build payload matching event_activities columns
    // Coerce and normalise values before sending to the DB to avoid type issues
    // (especially when companyId is from a <select> and may be a string)
    const coercedCompanyId = (companyId !== null && companyId !== undefined && companyId !== '') ? Number(companyId) : null;

    const payload = {
      organization_id: 1, // Default organization ID - adjust if needed
      day: day,
      start_time: startTime || null,
      end_time: endTime || null,
      display_order: displayOrder || null,
      title_nl: titleNl || null,
      title_en: titleEn || null,
      title_de: titleDe || null,
      description_nl: descriptionNl || null,
      description_en: descriptionEn || null,
      description_de: descriptionDe || null,
      location_type: locationType || 'venue',
      company_id: coercedCompanyId,
      location_nl: locationNl || null,
      location_en: locationEn || null,
      location_de: locationDe || null,
      badge_nl: badgeNl || null,
      badge_en: badgeEn || null,
      badge_de: badgeDe || null,
      is_active: !!isActive,
      show_location_type_badge: !!showLocationTypeBadge,
    };

    // TODO: Remove this after event_year column migration is complete
    // For now, always include event_year (will be ignored if column doesn't exist)
    payload.event_year = year;

      try {
        // debug payload in case of unexpected server-side errors during save
        // (useful when testing or when RLS/policies silently deny updates)
        // eslint-disable-next-line no-console
        console.debug('ActivityForm payload', payload);
        // If inserting a new activity and displayOrder is not explicitly set, infer next slot
        if (!activity?.id && (!displayOrder || displayOrder === 0)) {
          // fetch max display_order for the current day
          const { data: maxRow, error: maxErr } = await supabase
            .from('event_activities')
            .select('display_order')
            .eq('day', day)
            .order('display_order', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!maxErr && maxRow && typeof maxRow.display_order === 'number') {
            payload.display_order = maxRow.display_order + 1;
          } else {
            payload.display_order = 1;
          }
        }
      if (activity && activity.id) {
        // update (no chained select to avoid POST/REST content-negotiation issues)
        const { error: updateErr } = await supabase
          .from('event_activities')
          .update(payload)
          .eq('id', activity.id);

        if (updateErr) throw updateErr;

        // fetch the current row to verify persisted values
        const { data: updatedRow, error: fetchErr } = await supabase
          .from('event_activities')
          .select()
          .eq('id', activity.id)
          .maybeSingle();

        if (fetchErr) {
          // log, but don't fail the whole flow as parent will refetch
          // eslint-disable-next-line no-console
          console.warn('Failed to fetch updated activity:', fetchErr);
        }

        if (updatedRow && typeof updatedRow.show_location_type_badge !== 'undefined') {
          const persisted = !!updatedRow.show_location_type_badge;
          // If the persisted value differs from the requested payload — surface a helpful warning
          if (persisted !== payload.show_location_type_badge) {
            // eslint-disable-next-line no-console
            console.warn('Persisted show_location_type_badge does not match requested value', {
              requested: payload.show_location_type_badge,
              persisted,
              id: activity?.id,
            });
            try {
              toastError(t('activityForm.savePersistMismatch'));
            } catch (e) {
              // ignore toast failures
            }
          }
          setShowLocationTypeBadge(persisted);
        }
      } else {
        // insert without chained select
        const { error: insertErr } = await supabase
          .from('event_activities')
          .insert([{ ...payload }]);

        if (insertErr) throw insertErr;

        // attempt to fetch a recently-created row matching a combination of fields
        // (we don't have the generated id returned when insert without select)
        // best-effort: fetch the most recently created on this org/day with same title
        const { data: insertedRow, error: fetchInsertedErr } = await supabase
          .from('event_activities')
          .select()
          .eq('day', day)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (fetchInsertedErr) {
          // eslint-disable-next-line no-console
          console.warn('Failed to fetch inserted activity:', fetchInsertedErr);
        }

        if (insertedRow && typeof insertedRow.show_location_type_badge !== 'undefined') {
          setShowLocationTypeBadge(!!insertedRow.show_location_type_badge);
        }
      }

        // (company_id already coerced above)

        // notify parent (ProgramManagement passes refetch)
      await onSave();
      // show success toast (explicit feedback for admins)
      try {
        toastSuccess(t('activityForm.saveSuccess'));
      } catch (e) {
        // ignore
      }
      // Broadcast a global event so other UI instances (visitor schedule) can refetch
      try {
        window.dispatchEvent(new Event('eventActivitiesUpdated'));
      } catch (e) {
        // ignore — best-effort broadcast
      }
      onClose();
    } catch (err) {
      console.error('Error saving activity:', err);
      try {
        toastError(t('activityForm.saveError') + (err.message ? ': ' + err.message : ''));
      } catch (e) {
        alert(t('activityForm.saveError') + (err.message ? ': ' + err.message : ''));
      }
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={t('activityForm.createTitle')} size="lg">
      <div className="px-6 pt-4">
        <div className="flex items-center gap-2 mb-3">
          <button type="button" onClick={() => setTab('nl')} className={`px-3 py-1 rounded ${tab==='nl'?'bg-blue-600 text-white':'bg-gray-100 text-gray-700'}`}>NL</button>
          <button type="button" onClick={() => setTab('en')} className={`px-3 py-1 rounded ${tab==='en'?'bg-blue-600 text-white':'bg-gray-100 text-gray-700'}`}>EN</button>
          <button type="button" onClick={() => setTab('de')} className={`px-3 py-1 rounded ${tab==='de'?'bg-blue-600 text-white':'bg-gray-100 text-gray-700'}`}>DE</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Left: language-specific fields */}
          <div className="md:col-span-2">
            {tab === 'nl' && (
              <div className="space-y-3">
                <div>
                  <label htmlFor={`title-nl-${uid}`} className="block text-sm font-medium text-gray-700 mb-1">{t('activityForm.titleNL', { lng: adminLang })}</label>
                  <input id={`title-nl-${uid}`} className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200" value={titleNl} onChange={(e) => setTitleNl(e.target.value)} />
                </div>
                <div>
                  <label htmlFor={`description-nl-${uid}`} className="block text-sm font-medium text-gray-700 mb-1">{t('activityForm.descriptionNL')}</label>
                  <textarea id={`description-nl-${uid}`} rows={4} className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200" value={descriptionNl} onChange={(e) => setDescriptionNl(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor={`location-nl-${uid}`} className="block text-sm font-medium text-gray-700 mb-1">{t('activityForm.locationNL')}</label>
                    <input id={`location-nl-${uid}`} className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200" value={locationNl} onChange={(e) => setLocationNl(e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor={`badge-nl-${uid}`} className="block text-sm font-medium text-gray-700 mb-1">{t('activityForm.badgeNL')} <span className="text-xs text-gray-400">{t('activityForm.optional')}</span></label>
                    <input id={`badge-nl-${uid}`} className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200" value={badgeNl} onChange={(e) => setBadgeNl(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {tab === 'en' && (
              <div className="space-y-3">
                <div>
                  <label htmlFor={`title-en-${uid}`} className="block text-sm font-medium text-gray-700 mb-1">{t('activityForm.titleEN', { lng: adminLang })}</label>
                  <input id={`title-en-${uid}`} className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} />
                </div>
                <div>
                  <label htmlFor={`description-en-${uid}`} className="block text-sm font-medium text-gray-700 mb-1">{t('activityForm.descriptionEN')}</label>
                  <textarea id={`description-en-${uid}`} rows={4} className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200" value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor={`location-en-${uid}`} className="block text-sm font-medium text-gray-700 mb-1">{t('activityForm.locationEN')}</label>
                    <input id={`location-en-${uid}`} className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200" value={locationEn} onChange={(e) => setLocationEn(e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor={`badge-en-${uid}`} className="block text-sm font-medium text-gray-700 mb-1">{t('activityForm.badgeEN')} <span className="text-xs text-gray-400">{t('activityForm.optional')}</span></label>
                    <input id={`badge-en-${uid}`} className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200" value={badgeEn} onChange={(e) => setBadgeEn(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {tab === 'de' && (
              <div className="space-y-3">
                <div>
                  <label htmlFor={`title-de-${uid}`} className="block text-sm font-medium text-gray-700 mb-1">Title (DE)</label>
                  <input id={`title-de-${uid}`} className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200" value={titleDe} onChange={(e) => setTitleDe(e.target.value)} />
                </div>
                <div>
                  <label htmlFor={`description-de-${uid}`} className="block text-sm font-medium text-gray-700 mb-1">Description (DE)</label>
                  <textarea id={`description-de-${uid}`} rows={4} className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200" value={descriptionDe} onChange={(e) => setDescriptionDe(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor={`location-de-${uid}`} className="block text-sm font-medium text-gray-700 mb-1">Location (DE)</label>
                    <input id={`location-de-${uid}`} className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200" value={locationDe} onChange={(e) => setLocationDe(e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor={`badge-de-${uid}`} className="block text-sm font-medium text-gray-700 mb-1">Badge (DE) <span className="text-xs text-gray-400">{t('activityForm.optional')}</span></label>
                    <input id={`badge-de-${uid}`} className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200" value={badgeDe} onChange={(e) => setBadgeDe(e.target.value)} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: meta fields */}
          <div className="space-y-3">
            <div>
              <label htmlFor={`start-time-${uid}`} className="block text-sm font-medium text-gray-700 mb-1">{t('activityForm.startTime')}</label>
              <input id={`start-time-${uid}`} type="time" className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200" value={startTime || ''} onChange={(e) => setStartTime(e.target.value)} />
            </div>

            <div>
              <label htmlFor={`end-time-${uid}`} className="block text-sm font-medium text-gray-700 mb-1">{t('activityForm.endTime')}</label>
              <input id={`end-time-${uid}`} type="time" className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200" value={endTime || ''} onChange={(e) => setEndTime(e.target.value)} />
            </div>

            <div>
              <label htmlFor={`location-type-${uid}`} className="block text-sm font-medium text-gray-700 mb-1">{t('activityForm.locationType')}</label>
              <select id={`location-type-${uid}`} className="w-full px-3 py-2 border rounded" value={locationType} onChange={(e) => setLocationType(e.target.value)}>
                <option value="venue">{t('activityForm.venue')}</option>
                <option value="exhibitor">{t('activityForm.exhibitor')}</option>
                <option value="company">Company</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor={`company-${uid}`} className="block text-sm font-medium text-gray-700 mb-1">{t('activityForm.company')}</label>
                <div className="ml-2"><YearScopeBadge scope="global" /></div>
              </div>
              <select id={`company-${uid}`} className="w-full px-3 py-2 border rounded" value={companyId || ''} onChange={(e) => setCompanyId(e.target.value || null)}>
                <option value="">{t('activityForm.selectCompany')}</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-2">{t('activityForm.companyScopeHint')}</p>
            </div>

            <div>
              <label htmlFor={`display-order-${uid}`} className="block text-sm font-medium text-gray-700 mb-1">{t('activityForm.displayOrder')}</label>
              <input id={`display-order-${uid}`} type="number" className="w-full px-3 py-2 border rounded" value={displayOrder || 0} onChange={(e) => setDisplayOrder(Number(e.target.value))} aria-describedby={`display-order-help-${uid}`} />
              <p id={`display-order-help-${uid}`} className="text-xs text-gray-400 mt-1">{t('activityForm.displayOrderHelp')}</p>
            </div>

            <div className="flex items-start gap-3">
              <label htmlFor={`isActive-${uid}`} className="flex items-start gap-3 cursor-pointer">
                <input
                  id={`isActive-${uid}`}
                  type="checkbox"
                  className="h-5 w-5 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-400"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <div>
                  <div className="text-sm">{t('activityForm.isActive')}</div>
                  <div className="text-xs text-gray-400">{t('activityForm.isActiveHelp')}</div>
                </div>
              </label>
            </div>

            <div className="flex items-start gap-3">
              <label htmlFor={`showLocBadge-${uid}`} className="flex items-start gap-3 cursor-pointer">
                <input
                  id={`showLocBadge-${uid}`}
                  type="checkbox"
                  className="h-5 w-5 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-400"
                  checked={showLocationTypeBadge}
                  onChange={(e) => setShowLocationTypeBadge(e.target.checked)}
                />
                <div>
                  <div className="text-sm">{t('activityForm.showLocationBadge')}</div>
                  <div className="text-xs text-gray-400">{t('activityForm.showLocationBadgeHelp')}</div>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="px-6 py-4 border-t border-gray-100">
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
            aria-label={t('activityForm.cancel')}
          >
            {t('activityForm.cancel')}
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-300"
            aria-label={t('activityForm.save')}
          >
            {t('activityForm.save')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
