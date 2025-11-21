import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '@mdi/react';
import {
  mdiAccount,
  mdiDomain,
  mdiPalette,
  mdiMapMarker,
  mdiCog,
  mdiAlertCircle,
} from '@mdi/js';
import useUserRole from '../../hooks/useUserRole';
import ProtectedSection from '../ProtectedSection';

/**
 * Settings - Main settings page with role-based sections
 * All admin roles see this page, but different sections based on permissions
 */
export default function Settings() {
  const { t } = useTranslation();
  const { role, isSuperAdmin, isSystemManager, isEventManager } = useUserRole();
  const [activeSection, setActiveSection] = useState('user-management');

  // Define sections with role requirements
  const sections = [
    {
      id: 'user-management',
      label: t('settings.userManagement.title'),
      icon: mdiAccount,
      roles: ['super_admin', 'system_manager'],
      component: <UserManagementPlaceholder />,
    },
    {
      id: 'organization',
      label: t('settings.organization.title'),
      icon: mdiDomain,
      roles: ['super_admin', 'system_manager'],
      component: <OrganizationPlaceholder />,
    },
    {
      id: 'branding',
      label: t('settings.branding.title'),
      icon: mdiPalette,
      roles: ['super_admin', 'system_manager'],
      component: <BrandingPlaceholder />,
    },
    {
      id: 'map-defaults',
      label: t('settings.mapDefaults.title'),
      icon: mdiMapMarker,
      roles: ['super_admin', 'system_manager'],
      component: <MapDefaultsPlaceholder />,
    },
    {
      id: 'event-defaults',
      label: t('settings.eventDefaults.title'),
      icon: mdiCog,
      roles: ['super_admin', 'system_manager', 'event_manager'],
      component: <EventDefaultsPlaceholder />,
    },
    {
      id: 'advanced',
      label: t('settings.advanced.title'),
      icon: mdiAlertCircle,
      roles: ['super_admin'],
      component: <AdvancedPlaceholder />,
    },
  ];

  // Filter sections by user role
  const visibleSections = sections.filter(section => {
    if (isSuperAdmin) return true; // Super admin sees all
    return section.roles.includes(role);
  });

  // Set first visible section as active if current is not visible
  React.useEffect(() => {
    if (!visibleSections.find(s => s.id === activeSection)) {
      setActiveSection(visibleSections[0]?.id || 'event-defaults');
    }
  }, [role]);

  const activeComponent = visibleSections.find(s => s.id === activeSection)?.component;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">{t('settings.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {t('settings.subtitle')} 
          <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium capitalize">
            {role?.replace('_', ' ')}
          </span>
        </p>
      </div>

      {/* Layout: Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Section Navigation */}
        <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <nav className="p-4 space-y-1">
            {visibleSections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeSection === section.id
                    ? 'bg-orange-50 text-orange-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon path={section.icon} size={0.9} />
                <span>{section.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Right Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {activeComponent}
        </main>
      </div>
    </div>
  );
}

// Placeholder components - will be replaced with actual implementations
function UserManagementPlaceholder() {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">{t('settings.userManagement.title')}</h2>
      <p className="text-gray-600">{t('settings.userManagement.description')}</p>
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">🚧 User Management component coming soon...</p>
      </div>
    </div>
  );
}

function OrganizationPlaceholder() {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">{t('settings.organization.title')}</h2>
      <p className="text-gray-600">{t('settings.organization.description')}</p>
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">🚧 Organization Profile component coming soon...</p>
      </div>
    </div>
  );
}

function BrandingPlaceholder() {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">{t('settings.branding.title')}</h2>
      <p className="text-gray-600">{t('settings.branding.description')}</p>
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">🚧 Branding Settings component coming soon...</p>
      </div>
    </div>
  );
}

function MapDefaultsPlaceholder() {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">{t('settings.mapDefaults.title')}</h2>
      <p className="text-gray-600">{t('settings.mapDefaults.description')}</p>
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">🚧 Map Defaults component coming soon...</p>
      </div>
    </div>
  );
}

function EventDefaultsPlaceholder() {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">{t('settings.eventDefaults.title')}</h2>
      <p className="text-gray-600">{t('settings.eventDefaults.description')}</p>
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">🚧 Event Defaults component coming soon...</p>
      </div>
    </div>
  );
}

function AdvancedPlaceholder() {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Icon path={mdiAlertCircle} size={1} className="text-red-600" />
        {t('settings.advanced.title')}
      </h2>
      <p className="text-gray-600">{t('settings.advanced.description')}</p>
      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-800">⚠️ Advanced Settings (Danger Zone) coming soon...</p>
      </div>
    </div>
  );
}
