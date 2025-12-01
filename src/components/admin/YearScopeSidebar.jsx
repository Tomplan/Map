import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { mdiCalendarCheck, mdiMapMarkerMultiple, mdiCalendarClock } from '@mdi/js';
import { supabase } from '../../supabaseClient';
import SidebarTile from './SidebarTile';

export default function YearScopeSidebar({ selectedYear, onYearChange }) {
  const location = useLocation();
  const { t } = useTranslation();
  const tSafe = (key, fallback = '') => {
    const v = t(key);
    return (!v || v === key) ? fallback : v;
  };

  const [counts, setCounts] = useState({ subscriptions: 0, assignments: 0 });
  const [loading, setLoading] = useState(true);

  // Load counts function
  const loadCounts = async () => {
    try {
      setLoading(true);
      const [subsRes, assignRes] = await Promise.all([
        supabase.from('event_subscriptions').select('id', { count: 'exact', head: true }).eq('event_year', selectedYear),
        supabase.from('assignments').select('id', { count: 'exact', head: true }).eq('event_year', selectedYear),
      ]);

      setCounts({
        subscriptions: subsRes?.count ?? 0,
        assignments: assignRes?.count ?? 0,
      });
    } catch (error) {
      console.error('Error loading sidebar counts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load counts on mount and year change
  useEffect(() => {
    loadCounts();
  }, [selectedYear]);

  // Real-time subscriptions
  useEffect(() => {
    const subsChannel = supabase
      .channel(`sidebar-subscriptions-${selectedYear}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'event_subscriptions',
        filter: `event_year=eq.${selectedYear}`,
      }, () => {
        console.log('Sidebar: Subscriptions changed, reloading counts');
        loadCounts();
      })
      .subscribe();

    const assignChannel = supabase
      .channel(`sidebar-assignments-${selectedYear}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'assignments',
        filter: `event_year=eq.${selectedYear}`,
      }, () => {
        console.log('Sidebar: Assignments changed, reloading counts');
        loadCounts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subsChannel);
      supabase.removeChannel(assignChannel);
    };
  }, [selectedYear]);

  // Debug logging
  console.log('YearScopeSidebar - selectedYear:', selectedYear);
  console.log('YearScopeSidebar - counts:', counts, 'loading:', loading);

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
          badge={loading ? '...' : counts.subscriptions.toString()}
          isActive={location.pathname === '/admin/subscriptions'}
          ariaLabel={`${tSafe('adminNav.eventSubscriptions','Subscriptions')} ${loading ? '...' : counts.subscriptions}`}
        />

        <SidebarTile
          to="/admin/assignments"
          icon={mdiMapMarkerMultiple}
          label={tSafe('adminNav.assignments','Assignments')}
          badge={loading ? '...' : counts.assignments.toString()}
          isActive={location.pathname === '/admin/assignments'}
          ariaLabel={`${tSafe('adminNav.assignments','Assignments')} ${loading ? '...' : counts.assignments}`}
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
