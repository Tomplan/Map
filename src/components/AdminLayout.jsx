import React, { useState, useEffect } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Icon from '@mdi/react';
import {
  mdiViewDashboard,
  mdiMap,
  mdiDomain,
  mdiCog,
  mdiLogout,
  mdiChevronLeft,
  mdiChevronRight,
  mdiHelpCircleOutline,
  mdiCommentAlertOutline,
} from '@mdi/js';
import useUserRole from '../hooks/useUserRole';
import YearChangeModal from './admin/YearChangeModal';
import { supabase } from '../supabaseClient';
import HelpPanel from './HelpPanel';
import YearScopeSidebar from './admin/YearScopeSidebar';
import CollapsedShortcuts from './admin/CollapsedShortcuts';
import SidebarTile from './admin/SidebarTile';

/**
 * AdminLayout - Main layout for admin panel with sidebar navigation
 * Desktop-optimized with role-based navigation
 */
export default function AdminLayout({ selectedYear, setSelectedYear }) {
  const { t } = useTranslation();
  const location = useLocation();
  const { role, loading, hasAnyRole, userInfo } = useUserRole();

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
    // Map Management and Settings intentionally moved out of the primary nav
    // so they are displayed below the YearScopeSidebar to emphasize year-scoped
    // controls are grouped together. They will still be shown if the user has
    // matching roles later in the sidebar below the card.
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
      {/*
        Use a flexible expanded width (min width) instead of a strict fixed
        w-64. This allows the sidebar to grow to fit longer content such as a
        full email address on a single line while still keeping the compact
        collapsed state at w-16.
      */}
      <aside className={`${isCollapsed ? 'w-[66px]' : 'w-[340px]'} bg-white border-r border-gray-200 flex flex-col transition-all duration-500 ease-in-out overflow-hidden`}>
        {/* Header */}
        <div className={`p-4 border-b border-gray-200 flex items-center h-[88px] ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div className={`${isCollapsed ? 'opacity-0 w-0 h-0 overflow-hidden' : 'opacity-100 flex-1 min-w-0'}`}>
            <h1 className="text-xl font-bold text-gray-900 truncate">{t('adminNav.adminPanel')}</h1>
            {(userInfo?.name || userInfo?.email) && (
              // Keep the small/collapsed behavior unchanged (truncate). When
              // expanded, prefer a single-line email so it stays readable on
              // one line: `whitespace-nowrap` ensures no wrap and relies on the
              // expanded (now flexible) sidebar width to display the full text.
              <p className={`text-sm text-gray-700 mt-1 font-medium ${isCollapsed ? 'truncate' : 'whitespace-nowrap'}`}>
                {userInfo.name || userInfo.email}
              </p>
            )}
            {role && (
              <p className="text-xs text-gray-500 mt-0.5 capitalize truncate">
                {t(`adminNav.roles.${role}`)}
              </p>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0 ${isCollapsed ? '' : 'ml-2'}`}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Icon path={isCollapsed ? mdiChevronRight : mdiChevronLeft} size={1} className="text-gray-700" />
          </button>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto">
          {/* Navigation */}
          <nav className="p-2">
            <ul className="space-y-1">
              {visibleNavItems.map((item) => {
                const isActive = location.pathname === item.path;

                return (
                  <li key={item.path}>
                    <SidebarTile
                      to={item.path}
                      icon={item.icon}
                      label={item.label}
                      isActive={isActive}
                      isCollapsed={isCollapsed}
                      // keep Dashboard exactly aligned: force icon & label wrappers
                      {...(item.path === '/admin' ? { iconClass: 'w-8 h-8', labelClass: 'text-sm font-medium text-left' } : {})}
                    />
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Year-Scoped Operations - Moved up for better workflow visibility */}
          <div className="p-2 border-t border-gray-200">
              {/* keep both mounted and toggle visibility with CSS so we avoid
                  mount/dismount flicker during the sidebar expand animation */}
              <div className={`${isCollapsed ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100 h-auto'}`}>
                <YearScopeSidebar
                  selectedYear={selectedYear}
                  onYearChange={(newY) => {
                    if (newY === selectedYear) return;
                    setPendingYear(newY);
                    setShowYearModal(true);
                  }}
                />

                {/* Map Management - Now year-scoped since markers are per-year */}
                {hasAnyRole(['super_admin','system_manager']) && (
                  <SidebarTile
                    to="/admin/map"
                    icon={mdiMap}
                    label={t('adminNav.mapManagement')}
                    isActive={location.pathname === '/admin/map'}
                  />
                )}
              </div>

              <div className={`${isCollapsed ? 'opacity-100 h-auto' : 'opacity-0 h-0 overflow-hidden'}`}>
                <CollapsedShortcuts selectedYear={selectedYear} t={t} />

                {/* Map Management - Collapsed state */}
                {hasAnyRole(['super_admin','system_manager']) && (
                  <SidebarTile
                    to="/admin/map"
                    icon={mdiMap}
                    label={t('adminNav.mapManagement')}
                    isCollapsed={isCollapsed}
                    isActive={location.pathname === '/admin/map'}
                  />
                )}
              </div>
          </div>

          {/* Settings + System Administration */}
          <div className="p-2 border-t border-gray-200">
            {!isCollapsed ? (
              <div className="py-3 space-y-2">
                {hasAnyRole(['super_admin','system_manager','event_manager']) && (
                  <SidebarTile
                    to="/admin/settings"
                    icon={mdiCog}
                    label={t('adminNav.settings')}
                    isActive={location.pathname === '/admin/settings'}
                  />
                )}

                {hasAnyRole(['super_admin','system_manager','event_manager']) && (
                  <SidebarTile
                    to="/admin/feedback"
                    icon={mdiCommentAlertOutline}
                    label={t('settings.feedbackRequests.title')}
                    isActive={location.pathname === '/admin/feedback'}
                  />
                )}
              </div>
            ) : (
              // Collapsed state: show icons for Settings
              <div className="py-3 space-y-2">
                {hasAnyRole(['super_admin','system_manager','event_manager']) && (
                  <SidebarTile
                    to="/admin/settings"
                    icon={mdiCog}
                    label={t('adminNav.settings')}
                    isCollapsed={isCollapsed}
                    isActive={location.pathname === '/admin/settings'}
                  />
                )}

                {hasAnyRole(['super_admin','system_manager','event_manager']) && (
                  <SidebarTile
                    to="/admin/feedback"
                    icon={mdiCommentAlertOutline}
                    label={t('settings.feedbackRequests.title')}
                    isCollapsed={isCollapsed}
                    isActive={location.pathname === '/admin/feedback'}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Help Button */}
        <div className="p-2 border-t border-gray-200">
          <SidebarTile
            onClick={() => setIsHelpOpen(true)}
            icon={mdiHelpCircleOutline}
            label={t('adminNav.help')}
            isCollapsed={isCollapsed}
            ariaLabel="Help"
          />
        </div>

        {/* Logout */}
        <div className="p-2 border-t border-gray-200">
          <SidebarTile
            onClick={handleLogout}
            icon={mdiLogout}
            label={t('adminNav.logout')}
            isCollapsed={isCollapsed}
            ariaLabel="Logout"
          />
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
