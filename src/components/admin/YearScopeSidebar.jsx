import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { mdiCalendarCheck, mdiMapMarkerMultiple, mdiCalendarClock } from '@mdi/js';
import { supabase } from '../../supabaseClient';
import SidebarTile from './SidebarTile';

export default function YearScopeSidebar({ selectedYear, onYearChange }) {
  const { t } = useTranslation();
  const tSafe = (key, fallback = '') => {
    const v = t(key);
    return (!v || v === key) ? fallback : v;
  };
  const [counts, setCounts] = useState({ subscriptions: '-', assignments: '-', program: '-' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchCounts() {
      setLoading(true);
      try {
        const [subsRes, assignRes] = await Promise.all([
          supabase.from('event_subscriptions').select('id', { count: 'exact', head: true }).eq('event_year', selectedYear),
          supabase.from('assignments').select('id', { count: 'exact', head: true }).eq('event_year', selectedYear),
        ]);

        if (!mounted) return;
        setCounts({
          subscriptions: subsRes?.count ?? '-',
          assignments: assignRes?.count ?? '-',
          program: '-',
        });
      } catch (e) {
        console.error('Error fetching sidebar counts', e);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchCounts();

    return () => { mounted = false; };
  }, [selectedYear]);

  const yearOptions = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i));

  return (
    <div className="py-3">
      {/* Compact sidebar: explanatory header removed per UX decision */}

      <div className="mb-2">
        {/* visually remove the label (it's clear in the UI) but keep an sr-only label for screen readers */}
        <label htmlFor="sidebar-year-select" className="sr-only">{tSafe('admin.yearScope.viewingYear', 'Viewing year')}</label>
        <div className="text-sm">
          <select id="sidebar-year-select" value={selectedYear} onChange={(e) => onYearChange?.(parseInt(e.target.value, 10))} className="text-base font-semibold px-3 py-1 border rounded transition-all duration-300">
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
          badge={loading ? '...' : counts.subscriptions}
          ariaLabel={`${tSafe('adminNav.eventSubscriptions','Subscriptions')} ${loading ? '...' : counts.subscriptions}`}
        />

        <SidebarTile
          to="/admin/assignments"
          icon={mdiMapMarkerMultiple}
          label={tSafe('adminNav.assignments','Assignments')}
          badge={loading ? '...' : counts.assignments}
          ariaLabel={`${tSafe('adminNav.assignments','Assignments')} ${loading ? '...' : counts.assignments}`}
        />

        <SidebarTile
          to="/admin/program"
          icon={mdiCalendarClock}
          label={tSafe('adminNav.programManagement','Program Management')}
        />
      </div>
    </div>
  );
}
