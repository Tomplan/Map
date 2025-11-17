import React from 'react';
import Icon from '@mdi/react';
import { mdiClockOutline, mdiMapMarker, mdiInformation } from '@mdi/js';

/**
 * EventSchedule - Timeline of event activities
 * TODO: Phase 6 - Connect to Event_Schedule database table
 */
export default function EventSchedule({ selectedYear }) {
  // Placeholder data - will be replaced with real database data in Phase 6
  const placeholderActivities = [
    {
      id: 1,
      title: 'RC Car Demonstrations',
      description: 'Watch professional RC drivers perform stunts and show off their skills',
      startTime: '10:00',
      endTime: '11:30',
      location: 'RC Arena',
      status: 'upcoming', // upcoming, current, past
    },
    {
      id: 2,
      title: 'Flight Demonstrations',
      description: 'Drone and aircraft flight shows featuring the latest technology',
      startTime: '12:00',
      endTime: '13:00',
      location: 'Outdoor Field',
      status: 'upcoming',
    },
    {
      id: 3,
      title: '4x4 Off-Road Workshop',
      description: 'Learn advanced off-road driving techniques from experienced instructors',
      startTime: '14:00',
      endTime: '15:30',
      location: 'Workshop Tent',
      status: 'upcoming',
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'current':
        return 'border-l-orange-600 bg-orange-50';
      case 'upcoming':
        return 'border-l-blue-600 bg-blue-50';
      case 'past':
        return 'border-l-gray-300 bg-gray-50 opacity-60';
      default:
        return 'border-l-gray-300';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'current':
        return (
          <span className="inline-block px-2 py-1 bg-red-600 text-white text-xs font-semibold rounded">
            🔴 LIVE
          </span>
        );
      case 'upcoming':
        return (
          <span className="inline-block px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded">
            Upcoming
          </span>
        );
      case 'past':
        return (
          <span className="inline-block px-2 py-1 bg-gray-400 text-white text-xs font-semibold rounded">
            Ended
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Event Schedule</h1>
          <p className="text-gray-600 mt-1">Plan your day at the event</p>
        </div>
      </div>

      {/* Schedule Timeline */}
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="space-y-4">
          {placeholderActivities.map((activity) => (
            <div
              key={activity.id}
              className={`bg-white rounded-lg shadow border-l-4 ${getStatusColor(
                activity.status
              )} p-4 transition-all hover:shadow-md`}
            >
              {/* Time and Status */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon path={mdiClockOutline} size={0.9} className="text-gray-600" />
                  <span className="font-semibold text-gray-900">
                    {activity.startTime} - {activity.endTime}
                  </span>
                </div>
                {getStatusBadge(activity.status)}
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-gray-900 mb-2">{activity.title}</h3>

              {/* Description */}
              <p className="text-gray-700 mb-3">{activity.description}</p>

              {/* Location */}
              <div className="flex items-center gap-2 text-sm">
                <Icon path={mdiMapMarker} size={0.8} className="text-orange-600" />
                <span className="text-gray-700">
                  <span className="font-medium">Location:</span> {activity.location}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Phase 6 Notice */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Icon path={mdiInformation} size={1} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Phase 1 Placeholder</p>
              <p className="mb-2">
                This is sample data. In Phase 6, this schedule will be:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Connected to Event_Schedule database table</li>
                <li>Show real-time "LIVE" status for current activities</li>
                <li>Allow tapping location to view on map</li>
                <li>Automatically updated when admins add/edit activities</li>
                <li>Highlight upcoming activities (within 30 minutes)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
