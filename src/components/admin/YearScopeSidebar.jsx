import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import YearScopeBadge from './YearScopeBadge';
import Icon from '@mdi/react';
import { mdiCalendarCheck, mdiMapMarkerMultiple, mdiCalendarClock } from '@mdi/js';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

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
    <div className="px-2 py-3">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 text-xs text-gray-600">{tSafe('admin.yearScope.title', 'Year-scoped data')}</div>
        <div><YearScopeBadge scope="year" /></div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
        <div>{tSafe('admin.yearScope.viewingYear', 'Viewing year')}</div>
        <div className="text-sm">
          <label htmlFor="sidebar-year-select" className="sr-only">{tSafe('admin.yearScope.viewingYear', 'Viewing year')}</label>
          <select id="sidebar-year-select" value={selectedYear} onChange={(e) => onYearChange?.(parseInt(e.target.value, 10))} className="text-sm px-2 py-1 border rounded">
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        {/* Use the same compact nav tile styles as the main sidebar nav, but reduced for the sidebar section */}
        <Link
          to="/admin/subscriptions"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors border bg-white"
          aria-label={`${tSafe('adminNav.eventSubscriptions','Subscriptions')} ${loading ? '...' : counts.subscriptions}`}
        >
          <Icon path={mdiCalendarCheck} size={1} />
          <span className="flex-1">{tSafe('adminNav.eventSubscriptions','Subscriptions')}</span>
          <div className="text-sm font-semibold text-gray-800">{loading ? '...' : counts.subscriptions}</div>
        </Link>

        <Link
          to="/admin/assignments"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors border bg-white"
          aria-label={`${tSafe('adminNav.assignments','Assignments')} ${loading ? '...' : counts.assignments}`}
        >
          <Icon path={mdiMapMarkerMultiple} size={1} />
          <span className="flex-1">{tSafe('adminNav.assignments','Assignments')}</span>
          <div className="text-sm font-semibold text-gray-800">{loading ? '...' : counts.assignments}</div>
        </Link>

        <Link
          to="/admin/program"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors border bg-white"
          aria-label={`${tSafe('adminNav.programManagement','Program')} ${loading ? '...' : counts.program}`}
        >
          <Icon path={mdiCalendarClock} size={1} />
          <span className="flex-1">{tSafe('adminNav.programManagement','Program Management')}</span>
          <div className="text-sm font-semibold text-gray-800">{loading ? '...' : counts.program}</div>
        </Link>
      </div>
    </div>
  );
}
