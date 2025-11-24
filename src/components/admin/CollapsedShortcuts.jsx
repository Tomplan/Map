import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '@mdi/react';
import { mdiCalendarCheck, mdiMapMarkerMultiple, mdiCalendarClock } from '@mdi/js';

export default function CollapsedShortcuts({ selectedYear, t }) {
  return (
    <div className="flex items-center justify-center gap-3 px-3 py-3">
      <div className="text-gray-700 text-sm font-medium" title={`Event Year: ${selectedYear}`}>
        {selectedYear}
      </div>

      <div className="flex flex-col items-center space-y-3">
        <Link to="/admin/subscriptions" className="py-3 px-3 rounded-lg hover:bg-gray-50 text-gray-600" title={t('adminNav.eventSubscriptions')} aria-label={t('adminNav.eventSubscriptions')}>
          <Icon path={mdiCalendarCheck} size={1} />
        </Link>
        <Link to="/admin/assignments" className="py-3 px-3 rounded-lg hover:bg-gray-50 text-gray-600" title={t('adminNav.assignments')} aria-label={t('adminNav.assignments')}>
          <Icon path={mdiMapMarkerMultiple} size={1} />
        </Link>
        <Link to="/admin/program" className="py-3 px-3 rounded-lg hover:bg-gray-50 text-gray-600" title={t('adminNav.programManagement')} aria-label={t('adminNav.programManagement')}>
          <Icon path={mdiCalendarClock} size={1} />
        </Link>
      </div>
    </div>
  );
}
