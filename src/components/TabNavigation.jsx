import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '@mdi/react';
import { mdiHome, mdiMap, mdiFormatListBulleted, mdiCalendarClock } from '@mdi/js';

/**
 * TabNavigation - Bottom tab bar for visitor navigation
 * Mobile-first design with fixed bottom position
 */
export default function TabNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    {
      id: 'home',
      label: 'Home',
      icon: mdiHome,
      path: '/',
    },
    {
      id: 'map',
      label: 'Map',
      icon: mdiMap,
      path: '/map',
    },
    {
      id: 'exhibitors',
      label: 'Exhibitors',
      icon: mdiFormatListBulleted,
      path: '/exhibitors',
    },
    {
      id: 'schedule',
      label: 'Schedule',
      icon: mdiCalendarClock,
      path: '/schedule',
    },
  ];

  const handleTabClick = (path) => {
    navigate(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 md:relative md:shadow-none md:border-b">
      <div className="flex justify-around items-center h-16 max-w-screen-xl mx-auto">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive
                  ? 'text-orange-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon
                path={tab.icon}
                size={1.1}
                className="mb-1"
              />
              <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
