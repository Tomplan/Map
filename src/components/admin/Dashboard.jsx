import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '@mdi/react';
import { mdiMapMarker, mdiDomain, mdiCalendar, mdiClipboardCheck } from '@mdi/js';

/**
 * Dashboard - Overview page for admin panel
 * Shows key metrics and recent activity
 */
export default function Dashboard({ selectedYear }) {
  // TODO: Fetch real stats from Supabase
  const stats = [
    {
      label: 'Total Markers',
      value: '150',
      icon: mdiMapMarker,
      color: 'blue',
    },
    {
      label: 'Companies',
      value: '67',
      icon: mdiDomain,
      color: 'green',
    },
    {
      label: `${selectedYear} Subscriptions`,
      value: '45',
      icon: mdiCalendar,
      color: 'orange',
    },
    {
      label: 'Booth Assignments',
      value: '89',
      icon: mdiClipboardCheck,
      color: 'purple',
    },
  ];

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
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

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/companies"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="font-semibold text-gray-900">Add New Company</div>
            <div className="text-sm text-gray-600 mt-1">
              Register a new company in the system
            </div>
          </Link>
          <Link
            to="/admin/subscriptions"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="font-semibold text-gray-900">Manage Subscriptions</div>
            <div className="text-sm text-gray-600 mt-1">
              Add or update event subscriptions
            </div>
          </Link>
          <Link
            to="/admin/assignments"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="font-semibold text-gray-900">Assign Booths</div>
            <div className="text-sm text-gray-600 mt-1">
              Manage booth assignments for companies
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity - Placeholder */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
        <p className="text-gray-600">
          Activity tracking will be added in a future update.
        </p>
      </div>
    </div>
  );
}
