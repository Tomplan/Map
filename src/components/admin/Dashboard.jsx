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
  mdiCircleMultiple
} from '@mdi/js';
import { supabase } from '../../supabaseClient';
import useEventSubscriptions from '../../hooks/useEventSubscriptions';

/**
 * Dashboard - Overview page for admin panel
 * Shows key metrics and recent activity
 */
export default function Dashboard({ selectedYear }) {
  const { t } = useTranslation();
  const { subscriptions, loading } = useEventSubscriptions(selectedYear);
  const [counts, setCounts] = useState({
    markers: null,
    companies: null,
    assignments: null,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Fetch counts from Supabase
  useEffect(() => {
    async function fetchCounts() {
      setStatsLoading(true);
      try {
        const [markersRes, companiesRes, assignmentsRes] = await Promise.all([
          supabase.from('Markers_Core').select('id', { count: 'exact', head: true }).gt('id', 0),
          supabase.from('companies').select('id', { count: 'exact', head: true }),
          supabase.from('assignments').select('id', { count: 'exact', head: true }).eq('event_year', selectedYear),
        ]);

        setCounts({
          markers: markersRes.count ?? 0,
          companies: companiesRes.count ?? 0,
          assignments: assignmentsRes.count ?? 0,
        });
      } catch (error) {
        console.error('Error fetching dashboard counts:', error);
      } finally {
        setStatsLoading(false);
      }
    }

    fetchCounts();
  }, [selectedYear]);

  // Calculate meal and coin totals
  const totals = useMemo(() => {
    return subscriptions.reduce((acc, sub) => ({
      breakfast_sat: acc.breakfast_sat + (sub.breakfast_sat || 0),
      lunch_sat: acc.lunch_sat + (sub.lunch_sat || 0),
      bbq_sat: acc.bbq_sat + (sub.bbq_sat || 0),
      breakfast_sun: acc.breakfast_sun + (sub.breakfast_sun || 0),
      lunch_sun: acc.lunch_sun + (sub.lunch_sun || 0),
      coins: acc.coins + (sub.coins || 0),
    }), {
      breakfast_sat: 0,
      lunch_sat: 0,
      bbq_sat: 0,
      breakfast_sun: 0,
      lunch_sun: 0,
      coins: 0
    });
  }, [subscriptions]);

  const stats = [
    {
      label: t('dashboard.totalMarkers'),
      value: statsLoading ? '...' : (counts.markers?.toString() ?? '-'),
      icon: mdiMapMarker,
      color: 'blue',
    },
    {
      label: t('dashboard.companies'),
      value: statsLoading ? '...' : (counts.companies?.toString() ?? '-'),
      icon: mdiDomain,
      color: 'green',
    },
    {
      label: `${selectedYear} ${t('dashboard.subscriptions')}`,
      value: loading ? '...' : subscriptions.length.toString(),
      icon: mdiCalendar,
      color: 'orange',
    },
    {
      label: `${selectedYear} ${t('dashboard.assignments')}`,
      value: statsLoading ? '...' : (counts.assignments?.toString() ?? '-'),
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
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`p-6 rounded-lg border-2 ${colorClasses[stat.color]}`}
          >
            <div className="flex items-center gap-4">
              <Icon path={stat.icon} size={2} />
              <div>
                <div className="text-3xl font-bold">{stat.value}</div>
                <div className="text-sm font-medium mt-1">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Daily Meal & Coin Totals */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {selectedYear} {t('dashboard.eventTotals')}
          {loading && <span className="text-sm font-normal text-gray-500 ml-2">{t('common.loading')}</span>}
        </h2>

        {/* Saturday Totals */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">{t('dashboard.saturday')}</h3>
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
          <h3 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">{t('dashboard.sunday')}</h3>
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
          <h3 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">{t('dashboard.coins')}</h3>
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
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{t('dashboard.quickActions')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/companies"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="font-semibold text-gray-900">{t('dashboard.addNewCompany')}</div>
            <div className="text-sm text-gray-600 mt-1">
              {t('dashboard.addNewCompanyDesc')}
            </div>
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
            to="/admin/assignments"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="font-semibold text-gray-900">{t('dashboard.assignBooths')}</div>
            <div className="text-sm text-gray-600 mt-1">
              {t('dashboard.assignBoothsDesc')}
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity - Placeholder */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{t('dashboard.recentActivity')}</h2>
        <p className="text-gray-600">
          {t('dashboard.recentActivityPlaceholder')}
        </p>
      </div>
    </div>
  );
}
