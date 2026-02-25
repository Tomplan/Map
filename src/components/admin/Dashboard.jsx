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
} from '@mdi/js';
import { supabase } from '../../supabaseClient';
import {
  useSubscriptionCount,
  useAssignmentCount,
  useMarkerCount,
  useCompanyCount,
} from '../../hooks/useCountViews';
import useEventSubscriptions from '../../hooks/useEventSubscriptions';
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
      <div className="quick-actions bg-white rounded-lg shadow p-6">
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

      {/* Recent Activity - Placeholder */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{t('dashboard.recentActivity')}</h2>
        <p className="text-gray-600">{t('dashboard.recentActivityPlaceholder')}</p>
      </div>
    </div>
  );
}
