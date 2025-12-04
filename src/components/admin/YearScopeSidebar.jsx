import React from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { mdiCalendarCheck, mdiMapMarkerMultiple, mdiCalendarClock } from '@mdi/js';
import { useSubscriptionCount, useAssignmentCount } from '../../hooks/useCountViews';
import SidebarTile from './SidebarTile';

export default function YearScopeSidebar({ selectedYear, onYearChange }) {
  const location = useLocation();
  const { t } = useTranslation();
  const tSafe = (key, fallback = '') => {
    const v = t(key);
    return !v || v === key ? fallback : v;
  };

  // Use real-time count hooks
  const { count: subscriptionCount, loading: subscriptionsLoading } =
    useSubscriptionCount(selectedYear);
  const { count: assignmentCount, loading: assignmentsLoading } = useAssignmentCount(selectedYear);

  const yearOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  return (
    <div className="py-3">
      {/* Compact sidebar: explanatory header removed per UX decision */}

      <div className="mb-2">
        {/* visually remove the label (it's clear in the UI) but keep an sr-only label for screen readers */}
        <label htmlFor="sidebar-year-select" className="sr-only">
          {tSafe('admin.yearScope.viewingYear', 'Viewing year')}
        </label>
        <div className="text-sm text-left">
          <select
            id="sidebar-year-select"
            value={selectedYear}
            onChange={(e) => onYearChange?.(parseInt(e.target.value, 10))}
            className="year-selector text-base font-semibold px-3 py-1 h-8 border rounded transition-all duration-300 text-left"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <SidebarTile
          to="/admin/subscriptions"
          icon={mdiCalendarCheck}
          label={tSafe('adminNav.eventSubscriptions', 'Subscriptions')}
          badge={subscriptionsLoading ? '...' : subscriptionCount.toString()}
          isActive={location.pathname === '/admin/subscriptions'}
          ariaLabel={`${tSafe('adminNav.eventSubscriptions', 'Subscriptions')} ${subscriptionsLoading ? '...' : subscriptionCount}`}
        />

        <SidebarTile
          to="/admin/assignments"
          icon={mdiMapMarkerMultiple}
          label={tSafe('adminNav.assignments', 'Assignments')}
          badge={assignmentsLoading ? '...' : assignmentCount.toString()}
          isActive={location.pathname === '/admin/assignments'}
          ariaLabel={`${tSafe('adminNav.assignments', 'Assignments')} ${assignmentsLoading ? '...' : assignmentCount}`}
        />

        <SidebarTile
          to="/admin/program"
          icon={mdiCalendarClock}
          label={tSafe('adminNav.programManagement', 'Program Management')}
          isActive={location.pathname === '/admin/program'}
        />
      </div>
    </div>
  );
}
