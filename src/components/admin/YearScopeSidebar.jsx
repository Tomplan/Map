import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import YearScopeBadge from './YearScopeBadge';
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
        <div className="p-2 bg-white border rounded text-xs text-gray-700 flex items-center justify-between">
          <div>{tSafe('admin.yearScope.subscriptions', 'Subscriptions')}</div>
          <div className="font-semibold">{loading ? '...' : counts.subscriptions}</div>
        </div>

        <div className="p-2 bg-white border rounded text-xs text-gray-700 flex items-center justify-between">
          <div>{tSafe('admin.yearScope.assignments', 'Assignments')}</div>
          <div className="font-semibold">{loading ? '...' : counts.assignments}</div>
        </div>

        <div className="p-2 bg-white border rounded text-xs text-gray-700 flex items-center justify-between">
          <div>{tSafe('admin.yearScope.program', 'Program')}</div>
          <div className="font-semibold">{loading ? '...' : counts.program}</div>
        </div>
      </div>
    </div>
  );
}
