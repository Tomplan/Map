import React from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '@mdi/react';
import {
  mdiShieldLock,
  mdiCloudCheck,
  mdiClockOutline,
  mdiDatabase,
  mdiGithub,
  mdiAlertCircle,
  mdiCheckCircle,
  mdiInformationOutline,
  mdiRestore,
  mdiCog,
  mdiTable,
  mdiChevronDown,
  mdiChevronUp,
} from '@mdi/js';

/**
 * AdvancedSettings - Backup manual & system documentation
 * ACCESS: super_admin only
 * SCOPE: organization-wide
 */
export default function AdvancedSettings() {
  const { t } = useTranslation();
  const [expandedSection, setExpandedSection] = React.useState('overview');

  const toggleSection = (id) => {
    setExpandedSection((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Icon path={mdiShieldLock} size={1} className="text-blue-600" />
          {t('settings.advanced.title')}
        </h2>
        <p className="text-sm text-gray-600 mt-1">{t('settings.advanced.description')}</p>
      </div>

      {/* Backup Manual */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Icon path={mdiDatabase} size={1} />
            {t('settings.advanced.backup.title')}
          </h3>
          <p className="text-blue-100 text-sm mt-1">{t('settings.advanced.backup.subtitle')}</p>
        </div>

        <div className="divide-y divide-gray-200">
          {/* Section: Overview */}
          <CollapsibleSection
            id="overview"
            icon={mdiInformationOutline}
            title={t('settings.advanced.backup.overview.title')}
            expanded={expandedSection === 'overview'}
            onToggle={() => toggleSection('overview')}
          >
            <div className="space-y-3">
              <p className="text-gray-700">{t('settings.advanced.backup.overview.description')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <StatusCard
                  icon={mdiClockOutline}
                  label={t('settings.advanced.backup.overview.schedule')}
                  value={t('settings.advanced.backup.overview.scheduleValue')}
                  color="blue"
                />
                <StatusCard
                  icon={mdiCloudCheck}
                  label={t('settings.advanced.backup.overview.storage')}
                  value={t('settings.advanced.backup.overview.storageValue')}
                  color="green"
                />
                <StatusCard
                  icon={mdiRestore}
                  label={t('settings.advanced.backup.overview.retention')}
                  value={t('settings.advanced.backup.overview.retentionValue')}
                  color="purple"
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* Section: What gets backed up */}
          <CollapsibleSection
            id="tables"
            icon={mdiTable}
            title={t('settings.advanced.backup.tables.title')}
            expanded={expandedSection === 'tables'}
            onToggle={() => toggleSection('tables')}
          >
            <div className="space-y-4">
              <p className="text-gray-700">{t('settings.advanced.backup.tables.description')}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TableGroup
                  title={t('settings.advanced.backup.tables.coreData')}
                  tables={[
                    'companies',
                    'event_subscriptions',
                    'assignments',
                    'subscription_line_items',
                  ]}
                  color="blue"
                />
                <TableGroup
                  title={t('settings.advanced.backup.tables.mapData')}
                  tables={[
                    'markers_core',
                    'markers_appearance',
                    'markers_content',
                    'map_snapshots',
                    'event_map_settings',
                  ]}
                  color="green"
                />
                <TableGroup
                  title={t('settings.advanced.backup.tables.orgSettings')}
                  tables={[
                    'organization_profile',
                    'organization_settings',
                    'user_roles',
                    'user_preferences',
                    'categories',
                    'category_translations',
                  ]}
                  color="purple"
                />
                <TableGroup
                  title={t('settings.advanced.backup.tables.otherData')}
                  tables={[
                    'event_activities',
                    'staged_invoices',
                    'invoice_folders',
                    'feedback_requests',
                    'feedback_votes',
                    'feedback_comments',
                    'company_categories',
                    'company_translations',
                  ]}
                  color="orange"
                />
                <TableGroup
                  title={t('settings.advanced.backup.tables.archiveData')}
                  tables={[
                    'assignments_archive',
                    'event_activities_archive',
                    'event_subscriptions_archive',
                  ]}
                  color="gray"
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                <Icon
                  path={mdiInformationOutline}
                  size={0.8}
                  className="text-blue-600 flex-shrink-0 mt-0.5"
                />
                <p className="text-sm text-blue-800">
                  {t('settings.advanced.backup.tables.totalNote')}
                </p>
              </div>
            </div>
          </CollapsibleSection>

          {/* Section: How it works */}
          <CollapsibleSection
            id="how"
            icon={mdiCog}
            title={t('settings.advanced.backup.how.title')}
            expanded={expandedSection === 'how'}
            onToggle={() => toggleSection('how')}
          >
            <div className="space-y-4">
              <ol className="space-y-3">
                {[1, 2, 3, 4, 5, 6].map((step) => (
                  <li key={step} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold">
                      {step}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">
                        {t(`settings.advanced.backup.how.step${step}.title`)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {t(`settings.advanced.backup.how.step${step}.description`)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </CollapsibleSection>

          {/* Section: GitHub Actions */}
          <CollapsibleSection
            id="github"
            icon={mdiGithub}
            title={t('settings.advanced.backup.github.title')}
            expanded={expandedSection === 'github'}
            onToggle={() => toggleSection('github')}
          >
            <div className="space-y-4">
              <p className="text-gray-700">{t('settings.advanced.backup.github.description')}</p>

              <div className="space-y-3">
                <InfoRow
                  label={t('settings.advanced.backup.github.workflowFile')}
                  value=".github/workflows/backup.yml"
                />
                <InfoRow
                  label={t('settings.advanced.backup.github.trigger')}
                  value={t('settings.advanced.backup.github.triggerValue')}
                />
                <InfoRow
                  label={t('settings.advanced.backup.github.branch')}
                  value={t('settings.advanced.backup.github.branchValue')}
                />
                <InfoRow
                  label={t('settings.advanced.backup.github.secrets')}
                  value="SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <Icon
                  path={mdiAlertCircle}
                  size={0.8}
                  className="text-amber-600 flex-shrink-0 mt-0.5"
                />
                <p className="text-sm text-amber-800">
                  {t('settings.advanced.backup.github.manualNote')}
                </p>
              </div>
            </div>
          </CollapsibleSection>

          {/* Section: Restore */}
          <CollapsibleSection
            id="restore"
            icon={mdiRestore}
            title={t('settings.advanced.backup.restore.title')}
            expanded={expandedSection === 'restore'}
            onToggle={() => toggleSection('restore')}
          >
            <div className="space-y-4">
              <p className="text-gray-700">{t('settings.advanced.backup.restore.description')}</p>

              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-800 px-4 py-2">
                  <p className="text-xs text-gray-400 font-mono">Terminal</p>
                </div>
                <pre className="px-4 py-3 text-sm text-gray-200 bg-gray-900 overflow-x-auto">
                  <code>{t('settings.advanced.backup.restore.commands')}</code>
                </pre>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <Icon
                  path={mdiAlertCircle}
                  size={0.8}
                  className="text-red-600 flex-shrink-0 mt-0.5"
                />
                <p className="text-sm text-red-800">
                  {t('settings.advanced.backup.restore.warning')}
                </p>
              </div>
            </div>
          </CollapsibleSection>

          {/* Section: Security */}
          <CollapsibleSection
            id="security"
            icon={mdiShieldLock}
            title={t('settings.advanced.backup.security.title')}
            expanded={expandedSection === 'security'}
            onToggle={() => toggleSection('security')}
          >
            <div className="space-y-3">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <Icon
                    path={mdiCheckCircle}
                    size={0.8}
                    className="text-green-600 flex-shrink-0 mt-0.5"
                  />
                  <p className="text-gray-700">
                    {t(`settings.advanced.backup.security.item${item}`)}
                  </p>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        </div>
      </div>
    </div>
  );
}

/* ── Helper components ── */

function CollapsibleSection({ id, icon, title, expanded, onToggle, children }) {
  return (
    <div data-testid={`backup-section-${id}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <Icon path={icon} size={0.9} className="text-gray-500 flex-shrink-0" />
        <span className="flex-1 font-medium text-gray-900">{title}</span>
        <Icon
          path={expanded ? mdiChevronUp : mdiChevronDown}
          size={0.9}
          className="text-gray-400"
        />
      </button>
      {expanded && <div className="px-6 pb-5">{children}</div>}
    </div>
  );
}

function StatusCard({ icon, label, value, color }) {
  const colors = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
  };
  return (
    <div className={`border rounded-lg p-3 ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon path={icon} size={0.7} />
        <span className="text-xs font-medium uppercase">{label}</span>
      </div>
      <p className="font-bold text-sm">{value}</p>
    </div>
  );
}

function TableGroup({ title, tables, color }) {
  const colors = {
    blue: 'border-blue-200 bg-blue-50',
    green: 'border-green-200 bg-green-50',
    purple: 'border-purple-200 bg-purple-50',
    orange: 'border-orange-200 bg-orange-50',
    gray: 'border-gray-200 bg-gray-50',
  };
  const dotColors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    gray: 'bg-gray-500',
  };
  return (
    <div className={`border rounded-lg p-3 ${colors[color]}`}>
      <p className="font-medium text-gray-900 text-sm mb-2">{title}</p>
      <ul className="space-y-1">
        {tables.map((table) => (
          <li key={table} className="flex items-center gap-2 text-xs text-gray-700">
            <span className={`w-1.5 h-1.5 rounded-full ${dotColors[color]}`} />
            <code className="font-mono">{table}</code>
          </li>
        ))}
      </ul>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="font-medium text-gray-700 w-32 flex-shrink-0">{label}</span>
      <code className="font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded text-xs">
        {value}
      </code>
    </div>
  );
}
