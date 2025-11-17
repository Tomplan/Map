import React from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * DesktopNav - Horizontal navigation bar for desktop
 * Hidden on mobile (mobile uses TabNavigation at bottom)
 */
export default function DesktopNav() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/map', label: 'Map' },
    { path: '/exhibitors', label: 'Exhibitors' },
    { path: '/schedule', label: 'Schedule' },
  ];

  return (
    <header className="hidden md:block bg-white border-b border-gray-200 shadow-sm">
      <nav className="max-w-screen-xl mx-auto px-4 py-4">
        <div className="flex items-center gap-8">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-orange-600'
                    : 'text-gray-700 hover:text-orange-600'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
