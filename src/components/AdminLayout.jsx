import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Icon from '@mdi/react';
import {
  mdiViewDashboard,
  mdiMap,
  mdiDomain,
  mdiCalendarCheck,
  mdiCalendarClock,
  mdiMapMarkerMultiple,
  mdiTag,
  mdiCog,
  mdiLogout,
  mdiChevronLeft,
  mdiChevronRight,
  mdiHelpCircleOutline,
} from '@mdi/js';
import useUserRole from '../hooks/useUserRole';
import YearChangeModal from './admin/YearChangeModal';
import { supabase } from '../supabaseClient';
import HelpPanel from './HelpPanel';
import YearScopeSidebar from './admin/YearScopeSidebar';
import CollapsedShortcuts from './admin/CollapsedShortcuts';

/**
 * AdminLayout - Main layout for admin panel with sidebar navigation
 * Desktop-optimized with role-based navigation
 */
export default function AdminLayout({ selectedYear, setSelectedYear }) {
  const { t } = useTranslation();
  const location = useLocation();
  const { role, loading, hasAnyRole } = useUserRole();

  // Generate year options (current year ± 2 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  // Collapsible sidebar state (persisted in localStorage)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('adminSidebarCollapsed');
    return saved === 'true';
  });

  // Help panel state
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  // Year change confirmation state
  const [pendingYear, setPendingYear] = useState(null);
  const [showYearModal, setShowYearModal] = useState(false);

  // Persist collapse state
  useEffect(() => {
    localStorage.setItem('adminSidebarCollapsed', isCollapsed);
  }, [isCollapsed]);

  const handleLogout = async () => {
    try {
      // Use local scope to avoid 403 errors with global logout
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with redirect even if signOut fails
    }
    
    // Redirect to admin login using hash route (app uses HashRouter)
    const base = import.meta.env.BASE_URL || '/';
    // Ensure base ends with / before appending path
    const baseUrl = base.endsWith('/') ? base : `${base}/`;
    // App uses HashRouter in `App.jsx`, so always navigate to the hash route
    window.location.href = `${baseUrl}#/admin`;
  };

  // Navigation items with role-based visibility
  const navItems = [
    {
      path: '/admin',
      label: t('adminNav.dashboard'),
      icon: mdiViewDashboard,
      roles: ['super_admin', 'system_manager', 'event_manager'],
    },
    {
      path: '/admin/map',
      label: t('adminNav.mapManagement'),
      icon: mdiMap,
      roles: ['super_admin', 'system_manager'],
    },
    {
      path: '/admin/companies',
      label: t('adminNav.companiesNav'),
      icon: mdiDomain,
      roles: ['super_admin', 'event_manager'],
    },
    // Subscriptions, Assignments, and Program management are now surfaced
    // in the compact YearScopeSidebar (per recent UX changes). Keep these
    // pages available, but they are intentionally *not* duplicated in the
    // main admin nav to avoid confusion. Users can still reach them via
    // the YearScopeSidebar tiles or links elsewhere in the UI.
    // Categories menu removed from main admin nav. Now in settings for system managers only.
    {
      path: '/admin/settings',
      label: t('adminNav.settings'),
      icon: mdiCog,
      roles: ['super_admin', 'system_manager', 'event_manager'],
    },
  ];

  // Filter nav items by user role
  const visibleNavItems = navItems.filter((item) => hasAnyRole(item.roles));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">{t('adminNav.loading')}</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">{t('adminNav.adminPanel')}</h1>
              {role && (
                <p className="text-xs text-gray-500 mt-1 capitalize">
                  {t(`adminNav.roles.${role}`)}
                </p>
              )}
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Icon path={isCollapsed ? mdiChevronRight : mdiChevronLeft} size={0.9} className="text-gray-600" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-1">
            {visibleNavItems.map((item) => {
              const isActive = location.pathname === item.path;

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 ${isCollapsed ? 'justify-center px-3' : 'px-4'} py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    title={isCollapsed ? item.label : ''}
                  >
                    <Icon path={item.icon} size={1} />
                    {!isCollapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Year Selector + compact year-scope summary */}
        <div className="p-2 border-t border-gray-200">
          {!isCollapsed ? (
            <div className="px-2 py-3">
              <label className="block text-xs font-medium text-gray-700 mb-2">{t('adminNav.eventYear')}</label>
              <YearScopeSidebar
                selectedYear={selectedYear}
                onYearChange={(newY) => {
                  if (newY === selectedYear) return;
                  setPendingYear(newY);
                  setShowYearModal(true);
                }}
              />
              {/* divider — single YearScopeSidebar rendered above; keeping space for any future compact summary */}
              <div className="mt-3 border-t pt-3" />
            </div>
          ) : (
            // Use the component which stacks the year above the icons to ensure
            // the year appears above the internal compact icons in the collapsed panel.
            <CollapsedShortcuts selectedYear={selectedYear} t={t} />
            )}
          )}
        </div>

        {/* Help Button */}
        <div className="p-2 border-t border-gray-200">
          <button
            onClick={() => setIsHelpOpen(true)}
            className={`flex items-center gap-3 ${isCollapsed ? 'justify-center px-3' : 'px-4'} py-3 w-full rounded-lg text-blue-600 hover:bg-blue-50 transition-colors font-medium`}
            title={isCollapsed ? 'Help' : ''}
          >
            <Icon path={mdiHelpCircleOutline} size={1} />
            {!isCollapsed && <span>{t('adminNav.help')}</span>}
          </button>
        </div>

        {/* Logout */}
        <div className="p-2 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 ${isCollapsed ? 'justify-center px-3' : 'px-4'} py-3 w-full rounded-lg text-gray-700 hover:bg-gray-50 transition-colors`}
            title={isCollapsed ? 'Logout' : ''}
          >
            <Icon path={mdiLogout} size={1} />
            {!isCollapsed && <span>{t('adminNav.logout')}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="h-full p-4">
          <Outlet />
        </div>
      </main>

      {/* Help Panel */}
      <HelpPanel isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      {/* Year change confirmation modal (prevent surprising context switches) */}
      <YearChangeModal
        isOpen={showYearModal}
        newYear={pendingYear || selectedYear}
        onClose={() => {
          setPendingYear(null);
          setShowYearModal(false);
        }}
        onConfirm={() => {
          if (pendingYear) setSelectedYear(pendingYear);
          setPendingYear(null);
          setShowYearModal(false);
        }}
      />
    </div>
  );
}
