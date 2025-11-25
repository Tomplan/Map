import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '@mdi/react';
import { mdiCalendarCheck, mdiMapMarkerMultiple, mdiCalendarClock, mdiMap, mdiCog } from '@mdi/js';

export default function CollapsedShortcuts({ selectedYear, t }) {
  return (
    // Panel is narrow when collapsed, so stack year above the icons in a small column
    <div className="w-full px-2 py-3 flex flex-col items-center">
      {/* Year above the icons — static text in collapsed mode */}
      <div className="text-gray-700 text-base font-medium mb-2" title={`Event Year: ${selectedYear}`}>
        {selectedYear}
      </div>

      <div className="flex flex-col items-center space-y-3">
        <Link to="/admin/subscriptions" className="flex items-center justify-center py-3 px-3 rounded-lg hover:bg-gray-50 text-gray-600" title={t('adminNav.eventSubscriptions')} aria-label={t('adminNav.eventSubscriptions')}>
          <Icon path={mdiCalendarCheck} size={1} />
        </Link>
        <Link to="/admin/assignments" className="flex items-center justify-center py-3 px-3 rounded-lg hover:bg-gray-50 text-gray-600" title={t('adminNav.assignments')} aria-label={t('adminNav.assignments')}>
          <Icon path={mdiMapMarkerMultiple} size={1} />
        </Link>
        <Link to="/admin/program" className="flex items-center justify-center py-3 px-3 rounded-lg hover:bg-gray-50 text-gray-600" title={t('adminNav.programManagement')} aria-label={t('adminNav.programManagement')}>
          <Icon path={mdiCalendarClock} size={1} />
        </Link>
        <Link to="/admin/map" className="flex items-center justify-center py-3 px-3 rounded-lg hover:bg-gray-50 text-gray-600" title={t('adminNav.mapManagement')} aria-label={t('adminNav.mapManagement')}>
          <Icon path={mdiMap} size={1} />
        </Link>
        <Link to="/admin/settings" className="flex items-center justify-center py-3 px-3 rounded-lg hover:bg-gray-50 text-gray-600" title={t('adminNav.settings')} aria-label={t('adminNav.settings')}>
          <Icon path={mdiCog} size={1} />
        </Link>
      </div>
    </div>
  );
}
