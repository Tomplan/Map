import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '@mdi/react';
import {
  mdiAccount,
  mdiPalette,
  mdiMapMarker,
  mdiCog,
  mdiAlertCircle,
  mdiTranslate,
  mdiTag,
  mdiAccountCircle,
  mdiDomain,
} from '@mdi/js';
import useUserRole from '../../hooks/useUserRole';
import ProtectedSection from '../ProtectedSection';
import UserManagement from './UserManagement';
import EventDefaults from './EventDefaults';
import BrandingSettings from './BrandingSettings';
import UILanguageSettings from './UILanguageSettings';
import CategorySettings from './CategorySettings';
import MapDefaults from './MapDefaults';
import MapSettings from './MapSettings';

/**
 * Settings - Main settings page with role-based sections
 * All admin roles see this page, but different sections based on permissions
 */
export default function Settings({ selectedYear, setSelectedYear }) {
  const { t } = useTranslation();
  const { role, isSuperAdmin, isSystemManager, isEventManager } = useUserRole();
  const [activeSection, setActiveSection] = useState('user-management');

  // Define sections with role requirements and scope (personal vs organization)
  const sections = [
    // Personal Settings (affect only the current user)
    {
      id: 'ui-language',
      label: t('settings.uiLanguage.title'),
      icon: mdiTranslate,
      roles: ['super_admin', 'system_manager', 'event_manager'],
      component: <UILanguageSettings />,
      scope: 'personal',
      description: 'Your personal language preference',
    },

    // Organization Settings (affect all users)
    {
      id: 'user-management',
      label: t('settings.userManagement.title'),
      icon: mdiAccount,
      roles: ['super_admin', 'system_manager'],
      component: <UserManagement />,
      scope: 'organization',
      description: 'Manage user accounts and roles',
    },
    {
      id: 'category-settings',
      label: t('settings.categoryManagement.title'),
      icon: mdiTag,
      roles: ['super_admin', 'system_manager'],
      component: <CategorySettings />,
      scope: 'organization',
      description: 'Company categories for all users',
    },
    {
      id: 'branding',
      label: t('settings.branding.title'),
      icon: mdiPalette,
      roles: ['super_admin', 'system_manager'],
      component: <BrandingSettings />,
      scope: 'organization',
      description: 'Logo, colors, and app name',
    },
    {
      id: 'map-defaults',
      label: t('settings.mapDefaults.title'),
      icon: mdiMapMarker,
      roles: ['super_admin', 'system_manager'],
      component: <MapDefaults />,
      scope: 'organization',
      description: 'Default map position and zoom',
    },
    {
      id: 'map-settings',
      label: 'Map Settings by Year',
      icon: mdiMapMarker,
      roles: ['super_admin', 'system_manager'],
      component: <MapSettings selectedYear={selectedYear} setSelectedYear={setSelectedYear} />,
      scope: 'organization',
      description: 'Configure map settings per event year',
    },
    {
      id: 'event-defaults',
      label: t('settings.eventDefaults.title'),
      icon: mdiCog,
      roles: ['super_admin', 'system_manager', 'event_manager'],
      component: <EventDefaults />,
      scope: 'organization',
      description: 'Default meal counts for events',
    },
    {
      id: 'advanced',
      label: t('settings.advanced.title'),
      icon: mdiAlertCircle,
      roles: ['super_admin'],
      component: <AdvancedPlaceholder />,
      scope: 'organization',
      description: 'System configuration (danger zone)',
    },
  ];

  // Filter sections by user role
  const visibleSections = sections.filter((section) => {
    if (isSuperAdmin) return true; // Super admin sees all
    return section.roles.includes(role);
  });

  // Set first visible section as active if current is not visible
  React.useEffect(() => {
    if (!visibleSections.find((s) => s.id === activeSection)) {
      setActiveSection(visibleSections[0]?.id || 'event-defaults');
    }
  }, [role]);

  const activeComponent = visibleSections.find((s) => s.id === activeSection)?.component;

  return (
    <div className="h-full flex flex-col" data-testid="settings-container">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4" data-testid="settings-header">
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
        <aside
          className="w-64 bg-white border-r border-gray-200 overflow-y-auto"
          data-testid="settings-sidebar"
        >
          <nav className="p-4 space-y-4">
            {/* Personal Settings Group */}
            {visibleSections.filter((s) => s.scope === 'personal').length > 0 && (
              <div>
                <div
                  className="flex items-center gap-2 px-4 py-2 mb-1"
                  data-testid="personal-settings-group"
                >
                  <Icon path={mdiAccountCircle} size={0.7} className="text-blue-600" />
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Personal Settings
                  </h3>
                </div>
                <div className="space-y-1">
                  {visibleSections
                    .filter((s) => s.scope === 'personal')
                    .map((section) => (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        data-testid={`settings-section-${section.id}`}
                        className={`w-full flex items-start gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                          activeSection === section.id
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        title={section.description}
                      >
                        <Icon path={section.icon} size={0.9} className="flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{section.label}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{section.description}</div>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Organization Settings Group */}
            {visibleSections.filter((s) => s.scope === 'organization').length > 0 && (
              <div>
                <div
                  className="flex items-center gap-2 px-4 py-2 mb-1"
                  data-testid="organization-settings-group"
                >
                  <Icon path={mdiDomain} size={0.7} className="text-orange-600" />
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Organization Settings
                  </h3>
                </div>
                <div className="space-y-1">
                  {visibleSections
                    .filter((s) => s.scope === 'organization')
                    .map((section) => (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        data-testid={`settings-section-${section.id}`}
                        className={`w-full flex items-start gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                          activeSection === section.id
                            ? 'bg-orange-50 text-orange-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        title={section.description}
                      >
                        <Icon path={section.icon} size={0.9} className="flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{section.label}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{section.description}</div>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </nav>
        </aside>

        {/* Right Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6" data-testid="settings-content">
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
