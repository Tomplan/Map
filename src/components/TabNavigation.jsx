import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Icon from '@mdi/react';
import { mdiHome, mdiMap, mdiFormatListBulleted, mdiCalendarClock } from '@mdi/js';

/**
 * TabNavigation - Bottom tab bar for visitor navigation
 * Mobile-first design with fixed bottom position
 */
export default function TabNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const tabs = [
    {
      id: 'home',
      labelKey: 'navigation.home',
      icon: mdiHome,
      path: '/',
    },
    {
      id: 'map',
      labelKey: 'navigation.map',
      icon: mdiMap,
      path: '/map',
    },
    {
      id: 'exhibitors',
      labelKey: 'navigation.exhibitors',
      icon: mdiFormatListBulleted,
      path: '/exhibitors',
    },
    {
      id: 'schedule',
      labelKey: 'navigation.schedule',
      icon: mdiCalendarClock,
      path: '/schedule',
    },
  ];

  const handleTabClick = (path) => {
    navigate(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="flex justify-around items-center h-16 max-w-screen-xl mx-auto">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive ? 'text-orange-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon path={tab.icon} size={1.1} className="mb-1" />
              <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>
                {t(tab.labelKey)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
