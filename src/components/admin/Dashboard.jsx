import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Icon from '@mdi/react';
import {
  mdiMapMarker,
  mdiDomain,
  mdiCalendar,
  mdiClipboardCheck,
  mdiFoodCroissant,
  mdiFoodForkDrink,
  mdiGrill,
  mdiCircleMultiple,
  mdiAlertCircle,
  mdiAccountGroup,
  mdiAlert,
  mdiAccountTie,
  mdiEarth,
} from '@mdi/js';
import { supabase } from '../../supabaseClient';
import {
  useSubscriptionCount,
  useAssignmentCount,
  useMarkerCount,
  useCompanyCount,
} from '../../hooks/useCountViews';
import useEventSubscriptions from '../../hooks/useEventSubscriptions';
import useVisitorPresence from '../../hooks/useVisitorPresence';
import YearChangeModal from './YearChangeModal';
import YearScopeBadge from './YearScopeBadge';

/**
 * Dashboard - Overview page for admin panel
 * Shows key metrics and recent activity
 */
export default function Dashboard({ selectedYear, setSelectedYear }) {
  const { t } = useTranslation();
  // Use real-time count hooks
  const { count: subscriptionCount, loading } = useSubscriptionCount(selectedYear);
  const { count: assignmentCount, loading: assignmentsLoading } = useAssignmentCount(selectedYear);
  const { count: markerCount, loading: markersLoading } = useMarkerCount(selectedYear);
  const { count: companyCount, loading: companiesLoading } = useCompanyCount();
  
  // Real-time site visitors
  const { onlineCount, visitorCount, adminUsers } = useVisitorPresence(false);

  // Keep subscriptions hook for totals calculation (meal counts, coins)
  const { subscriptions } = useEventSubscriptions(selectedYear);

  const [showYearModal, setShowYearModal] = useState(false);
  const [pendingYear, setPendingYear] = useState(null);
  const statsLoading = markersLoading || companiesLoading;

  // Calculate meal and coin totals
  const totals = useMemo(() => {
    return subscriptions.reduce(
      (acc, sub) => ({
        breakfast_sat: acc.breakfast_sat + (sub.breakfast_sat || 0),
        lunch_sat: acc.lunch_sat + (sub.lunch_sat || 0),
        bbq_sat: acc.bbq_sat + (sub.bbq_sat || 0),
        breakfast_sun: acc.breakfast_sun + (sub.breakfast_sun || 0),
        lunch_sun: acc.lunch_sun + (sub.lunch_sun || 0),
        coins: acc.coins + (sub.coins || 0),
      }),
      {
        breakfast_sat: 0,
        lunch_sat: 0,
        bbq_sat: 0,
        breakfast_sun: 0,
        lunch_sun: 0,
        coins: 0,
      },
    );
  }, [subscriptions]);

  const stats = [
    {
      label: t('dashboard.totalAssignableBooths'),
      value: markersLoading ? '...' : markerCount.toString(),
      icon: mdiMapMarker,
      color: 'blue',
    },
    {
      label: t('dashboard.companies'),
      value: companiesLoading ? '...' : (companyCount - 1).toString(), // All companies minus organization
      icon: mdiDomain,
      color: 'green',
    },
    {
      label: `${selectedYear} ${t('dashboard.subscriptions')}`,
      value: loading ? '...' : subscriptionCount.toString(),
      icon: mdiCalendar,
      color: 'orange',
    },
    {
      label: `${selectedYear} ${t('dashboard.assignments')}`,
      value: assignmentsLoading ? '...' : assignmentCount.toString(),
      icon: mdiClipboardCheck,
      color: 'purple',
    },
  ];

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  };

  return (
    <div>
      {/* Year-scoped UI is handled in the admin sidebar (AdminLayout) — removed inline Dashboard card */}
      {/* Event Totals - Combined Stats and Meal/Coin Data */}
      <div className="event-totals bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          {selectedYear} {t('dashboard.eventTotals')}
          {(loading || statsLoading || assignmentsLoading) && (
            <span className="text-sm font-normal text-gray-500 ml-2">{t('common.loading')}</span>
          )}
        </h2>

        {/* Stats Grid - Inside Event Totals */}
        <div className="stats-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat) => (
            <div key={stat.label} className={`p-4 rounded-lg border-2 ${colorClasses[stat.color]}`}>
              <div className="flex items-center gap-3">
                <Icon path={stat.icon} size={1.5} />
                <div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm font-medium mt-1">{stat.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Saturday Totals */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">
            {t('dashboard.saturday')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border-2 bg-blue-50 text-blue-700 border-blue-200">
              <div className="flex items-center gap-3">
                <Icon path={mdiFoodCroissant} size={1.5} />
                <div>
                  <div className="text-2xl font-bold">{totals.breakfast_sat}</div>
                  <div className="text-sm font-medium">{t('dashboard.breakfast')}</div>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg border-2 bg-blue-50 text-blue-700 border-blue-200">
              <div className="flex items-center gap-3">
                <Icon path={mdiFoodForkDrink} size={1.5} />
                <div>
                  <div className="text-2xl font-bold">{totals.lunch_sat}</div>
                  <div className="text-sm font-medium">{t('dashboard.lunch')}</div>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg border-2 bg-blue-50 text-blue-700 border-blue-200">
              <div className="flex items-center gap-3">
                <Icon path={mdiGrill} size={1.5} />
                <div>
                  <div className="text-2xl font-bold">{totals.bbq_sat}</div>
                  <div className="text-sm font-medium">{t('dashboard.bbq')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sunday Totals */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">
            {t('dashboard.sunday')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border-2 bg-green-50 text-green-700 border-green-200">
              <div className="flex items-center gap-3">
                <Icon path={mdiFoodCroissant} size={1.5} />
                <div>
                  <div className="text-2xl font-bold">{totals.breakfast_sun}</div>
                  <div className="text-sm font-medium">{t('dashboard.breakfast')}</div>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg border-2 bg-green-50 text-green-700 border-green-200">
              <div className="flex items-center gap-3">
                <Icon path={mdiFoodForkDrink} size={1.5} />
                <div>
                  <div className="text-2xl font-bold">{totals.lunch_sun}</div>
                  <div className="text-sm font-medium">{t('dashboard.lunch')}</div>
                </div>
              </div>
            </div>
            {/* Empty placeholder for BBQ alignment */}
            <div className="p-4 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 text-gray-400">
              <div className="flex items-center gap-3">
                <Icon path={mdiGrill} size={1.5} />
                <div>
                  <div className="text-2xl font-bold">-</div>
                  <div className="text-sm font-medium">{t('dashboard.noBBQ')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Coins Total */}
        <div>
          <h3 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">
            {t('dashboard.coins')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border-2 bg-yellow-50 text-yellow-700 border-yellow-200">
              <div className="flex items-center gap-3">
                <Icon path={mdiCircleMultiple} size={1.5} />
                <div>
                  <div className="text-2xl font-bold">{totals.coins}</div>
                  <div className="text-sm font-medium">{t('dashboard.totalCoins')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions bg-white rounded-lg shadow p-6 hidden">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{t('dashboard.quickActions')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/companies"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="font-semibold text-gray-900">{t('dashboard.addNewCompany')}</div>
            <div className="text-sm text-gray-600 mt-1">{t('dashboard.addNewCompanyDesc')}</div>
          </Link>
          <Link
            to="/admin/subscriptions"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="font-semibold text-gray-900">{t('dashboard.manageSubscriptions')}</div>
            <div className="text-sm text-gray-600 mt-1">
              {t('dashboard.manageSubscriptionsDesc')}
            </div>
          </Link>
          <Link
            to="/admin/map"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="font-semibold text-gray-900">{t('adminNav.mapManagement')}</div>
            <div className="text-sm text-gray-600 mt-1">
              {t('dashboard.mapManagementDesc', 'Manage map and booth locations')}
            </div>
          </Link>
        </div>
      </div>

      {/* Event Preparations and System Limits Warning */}
      <div className="bg-white rounded-lg shadow mt-6 overflow-hidden">
        
        {/* Header / Live Visitors */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              {t('dashboard.liveOverview')}
            </h2>
            <p className="text-sm text-slate-600">{t('dashboard.liveOverviewDesc')}</p>
          </div>
          
          <div className="flex items-center gap-4 flex-wrap">
            <div className="bg-white px-4 py-2 rounded-lg border shadow-sm flex items-center gap-3">
              <Icon path={mdiEarth} size={1.2} className="text-blue-500" />
              <div>
                <div className="text-xl font-bold text-slate-800">{visitorCount}</div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{t('dashboard.activeVisitors', 'Visitors')}</div>
              </div>
            </div>
            
            <div className="bg-white px-4 py-2 rounded-lg border shadow-sm flex flex-col justify-center min-w-[140px] relative group">
              <div className="flex items-center gap-3">
                <Icon path={mdiAccountTie} size={1.2} className="text-purple-500" />
                <div>
                  <div className="text-xl font-bold text-slate-800">{adminUsers.length}</div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{t('dashboard.activeAdmins', 'Admins')}</div>
                </div>
              </div>
              {/* Tooltip to show admin emails */}
              {adminUsers.length > 0 && (
                <div className="absolute top-full left-0 mt-2 w-max min-w-[200px] max-w-[300px] bg-slate-800 text-white text-xs rounded shadow-lg p-2 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <div className="font-semibold border-b border-slate-600 pb-1 mb-1">Online Admins:</div>
                  <ul className="space-y-1">
                    {adminUsers.map((admin, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-400 flex-shrink-0"></span>
                        <span className="truncate" title={admin.email}>{admin.email}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Subtle Warning & Checklist */}
        <div className="bg-amber-50/50 border-t border-b border-amber-100/50 p-3 mt-2 text-xs">
          <div className="flex items-start gap-2 mb-2 text-amber-700">
            <Icon path={mdiAlertCircle} size={0.7} className="mt-0.5 flex-shrink-0" />
            <div className="leading-snug">
              <span className="font-bold mr-1">{t('dashboard.checklist.title')}:</span>
              <span className="opacity-90">
                {t('dashboard.checklist.warning')} {t('dashboard.checklist.warningDesc')} {t('dashboard.checklist.crashWarning')}
              </span>
            </div>
          </div>
          
          <div className="ml-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-2">
            <label className="flex items-start gap-1.5 cursor-pointer text-amber-900/80 group hover:text-amber-900 transition-colors">
              <input type="checkbox" className="mt-0.5 h-3 w-3 rounded border-amber-200 text-amber-500 focus:ring-amber-400 bg-transparent" />
              <div className="flex flex-col text-[11px] leading-tight">
                <span className="font-medium">{t('dashboard.checklist.upgradeTitle')}</span>
                <span className="opacity-70">{t('dashboard.checklist.upgradeDesc')}</span>
              </div>
            </label>
            <label className="flex items-start gap-1.5 cursor-pointer text-amber-900/80 group hover:text-amber-900 transition-colors">
              <input type="checkbox" className="mt-0.5 h-3 w-3 rounded border-amber-200 text-amber-500 focus:ring-amber-400 bg-transparent" />
              <div className="flex flex-col text-[11px] leading-tight">
                <span className="font-medium">{t('dashboard.checklist.lockMapTitle')}</span>
                <span className="opacity-70">{t('dashboard.checklist.lockMapDesc')}</span>
              </div>
            </label>
            <label className="flex items-start gap-1.5 cursor-pointer text-amber-900/80 group hover:text-amber-900 transition-colors">
              <input type="checkbox" className="mt-0.5 h-3 w-3 rounded border-amber-200 text-amber-500 focus:ring-amber-400 bg-transparent" />
              <div className="flex flex-col text-[11px] leading-tight">
                <span className="font-medium">{t('dashboard.checklist.verifyBackupsTitle')}</span>
                <span className="opacity-70">{t('dashboard.checklist.verifyBackupsDesc')}</span>
              </div>
            </label>
            <label className="flex items-start gap-1.5 cursor-pointer text-amber-900/80 group hover:text-amber-900 transition-colors">
              <input type="checkbox" className="mt-0.5 h-3 w-3 rounded border-amber-200 text-amber-500 focus:ring-amber-400 bg-transparent" />
              <div className="flex flex-col text-[11px] leading-tight">
                <span className="font-medium">{t('dashboard.checklist.checkPerfTitle')}</span>
                <span className="opacity-70">{t('dashboard.checklist.checkPerfDesc')}</span>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
