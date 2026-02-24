import React from 'react';
import { useLocation } from 'react-router-dom';
import { mdiCalendarCheck, mdiMapMarkerMultiple, mdiCalendarClock, mdiMap } from '@mdi/js';
import SidebarTile from './SidebarTile';
import useUserRole from '../../hooks/useUserRole';

export default function CollapsedShortcuts({ selectedYear, t }) {
  const location = useLocation();
  const { hasAnyRole } = useUserRole();

  return (
    // Panel is narrow when collapsed, so stack year above the icons in a small column
    // Year-scoped operations only (Map and Settings are in a separate section)
    <div className="w-full py-3 flex flex-col">
      {/* Year above the icons — static text in collapsed mode */}
      <div
        className="text-gray-700 text-base font-semibold mb-2 h-8 flex items-center justify-center transition-all duration-500 ease-in-out"
        title={`Event Year: ${selectedYear}`}
      >
        {selectedYear}
      </div>

      <div className="flex flex-col space-y-2">
        <SidebarTile
          to="/admin/subscriptions"
          icon={mdiCalendarCheck}
          label={t('adminNav.eventSubscriptions')}
          isCollapsed={true}
          isActive={location.pathname === '/admin/subscriptions'}
          ariaLabel={t('adminNav.eventSubscriptions')}
        />
        {/*
        <SidebarTile
          to="/admin/assignments"
          icon={mdiMapMarkerMultiple}
          label={t('adminNav.assignments')}
          isCollapsed={true}
          isActive={location.pathname === '/admin/assignments'}
          ariaLabel={t('adminNav.assignments')}
        />
        */}
        {hasAnyRole(['super_admin', 'system_manager', 'event_manager']) && (
          <SidebarTile
            to="/admin/map"
            icon={mdiMap}
            label={t('adminNav.mapManagement')}
            isCollapsed={true}
            isActive={location.pathname === '/admin/map'}
            ariaLabel={t('adminNav.mapManagement')}
          />
        )}
        <SidebarTile
          to="/admin/program"
          icon={mdiCalendarClock}
          label={t('adminNav.programManagement')}
          isCollapsed={true}
          isActive={location.pathname === '/admin/program'}
          ariaLabel={t('adminNav.programManagement')}
        />
      </div>
    </div>
  );
}
