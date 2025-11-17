import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import Icon from '@mdi/react';
import {
  mdiViewDashboard,
  mdiMap,
  mdiDomain,
  mdiCalendarCheck,
  mdiMapMarkerMultiple,
  mdiCog,
  mdiLogout,
} from '@mdi/js';
import useUserRole from '../hooks/useUserRole';
import { supabase } from '../supabaseClient';

/**
 * AdminLayout - Main layout for admin panel with sidebar navigation
 * Desktop-optimized with role-based navigation
 */
export default function AdminLayout() {
  const location = useLocation();
  const { role, loading, hasAnyRole } = useUserRole();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/admin'; // Redirect to admin login
  };

  // Navigation items with role-based visibility
  const navItems = [
    {
      path: '/admin',
      label: 'Dashboard',
      icon: mdiViewDashboard,
      roles: ['super_admin', 'system_manager', 'event_manager'],
    },
    {
      path: '/admin/map',
      label: 'Map Management',
      icon: mdiMap,
      roles: ['super_admin', 'system_manager'],
    },
    {
      path: '/admin/companies',
      label: 'Companies',
      icon: mdiDomain,
      roles: ['super_admin', 'event_manager'],
    },
    {
      path: '/admin/subscriptions',
      label: 'Event Subscriptions',
      icon: mdiCalendarCheck,
      roles: ['super_admin', 'event_manager'],
    },
    {
      path: '/admin/assignments',
      label: 'Assignments',
      icon: mdiMapMarkerMultiple,
      roles: ['super_admin', 'event_manager'],
    },
    {
      path: '/admin/settings',
      label: 'Settings',
      icon: mdiCog,
      roles: ['super_admin'],
    },
  ];

  // Filter nav items by user role
  const visibleNavItems = navItems.filter((item) => hasAnyRole(item.roles));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
          {role && (
            <p className="text-xs text-gray-500 mt-1 capitalize">
              {role.replace('_', ' ')}
            </p>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {visibleNavItems.map((item) => {
              const isActive = location.pathname === item.path;

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon path={item.icon} size={1} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Icon path={mdiLogout} size={1} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
