import React from 'react';
import useUserRole from '../hooks/useUserRole';
import Icon from '@mdi/react';
import { mdiLockOutline } from '@mdi/js';

/**
 * ProtectedSection - Renders children only if user has required role
 * Shows "No Permission" message otherwise
 *
 * @param {string|string[]} requiredRole - Single role or array of roles
 * @param {ReactNode} children - Content to show if authorized
 * @param {string} message - Custom permission denied message
 */
export default function ProtectedSection({ requiredRole, children, message }) {
  const { role, loading, hasRole, hasAnyRole } = useUserRole();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // Check if user has required role(s)
  const isAuthorized = Array.isArray(requiredRole)
    ? hasAnyRole(requiredRole)
    : hasRole(requiredRole);

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-lg border-2 border-gray-200">
        <Icon path={mdiLockOutline} size={3} className="text-gray-400 mb-4" />
        <h2 className="text-xl font-bold text-gray-700 mb-2">Access Restricted</h2>
        <p className="text-gray-600 text-center max-w-md">
          {message || 'You do not have permission to view this section. Contact your administrator if you need access.'}
        </p>
        {role && (
          <p className="text-sm text-gray-500 mt-4">
            Your role: <span className="font-semibold">{role.replace('_', ' ')}</span>
          </p>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
