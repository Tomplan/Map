import React from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { mdiCalendarCheck, mdiMapMarkerMultiple, mdiCalendarClock } from '@mdi/js';
import useEventSubscriptions from '../../hooks/useEventSubscriptions';
import useAssignments from '../../hooks/useAssignments';
import SidebarTile from './SidebarTile';

export default function YearScopeSidebar({ selectedYear, onYearChange }) {
  const location = useLocation();
  const { t } = useTranslation();
  const tSafe = (key, fallback = '') => {
    const v = t(key);
    return (!v || v === key) ? fallback : v;
  };

  // Use real-time hooks for counts
  const { subscriptions, loading: subscriptionsLoading } = useEventSubscriptions(selectedYear);
  const { assignments, loading: assignmentsLoading } = useAssignments(selectedYear);

  // Debug logging
  console.log('YearScopeSidebar - selectedYear:', selectedYear);
  console.log('YearScopeSidebar - subscriptions:', subscriptions?.length, 'loading:', subscriptionsLoading);
  console.log('YearScopeSidebar - assignments:', assignments?.length, 'loading:', assignmentsLoading);

  const yearOptions = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i));

  return (
    <div className="py-3">
      {/* Compact sidebar: explanatory header removed per UX decision */}

      <div className="mb-2">
        {/* visually remove the label (it's clear in the UI) but keep an sr-only label for screen readers */}
        <label htmlFor="sidebar-year-select" className="sr-only">{tSafe('admin.yearScope.viewingYear', 'Viewing year')}</label>
        <div className="text-sm text-left">
          <select id="sidebar-year-select" value={selectedYear} onChange={(e) => onYearChange?.(parseInt(e.target.value, 10))} className="text-base font-semibold px-3 py-1 h-8 border rounded transition-all duration-300 text-left">
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <SidebarTile
          to="/admin/subscriptions"
          icon={mdiCalendarCheck}
          label={tSafe('adminNav.eventSubscriptions','Subscriptions')}
          badge={subscriptionsLoading ? '...' : subscriptions.length.toString()}
          isActive={location.pathname === '/admin/subscriptions'}
          ariaLabel={`${tSafe('adminNav.eventSubscriptions','Subscriptions')} ${subscriptionsLoading ? '...' : subscriptions.length}`}
        />

        <SidebarTile
          to="/admin/assignments"
          icon={mdiMapMarkerMultiple}
          label={tSafe('adminNav.assignments','Assignments')}
          badge={assignmentsLoading ? '...' : assignments.length.toString()}
          isActive={location.pathname === '/admin/assignments'}
          ariaLabel={`${tSafe('adminNav.assignments','Assignments')} ${assignmentsLoading ? '...' : assignments.length}`}
        />

        <SidebarTile
          to="/admin/program"
          icon={mdiCalendarClock}
          label={tSafe('adminNav.programManagement','Program Management')}
          isActive={location.pathname === '/admin/program'}
        />
      </div>
    </div>
  );
}
