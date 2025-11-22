import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '@mdi/react';
import {
  mdiAccount,
  mdiPlus,
  mdiPencil,
  mdiDelete,
  mdiEmail,
  mdiClose,
  mdiCheck,
  mdiAlertCircle,
} from '@mdi/js';
import { supabase } from '../../supabaseClient';
import useUserRole from '../../hooks/useUserRole';

/**
 * UserManagement - Manage admin users, roles, and permissions
 * Accessible to Super Admin and System Manager only
 */
export default function UserManagement() {
  const { t } = useTranslation();
  const { isSuperAdmin } = useUserRole();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('event_manager');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Fetch all users from Supabase auth
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to use the function first (if migration 011 has been run)
      let usersData;
      let usersError;
      
      try {
        const result = await supabase.rpc('get_user_roles_with_email');
        usersData = result.data;
        usersError = result.error;
      } catch (rpcError) {
        // Function doesn't exist yet, fall back to direct table query
        console.warn('get_user_roles_with_email not available, using fallback');
        const result = await supabase
          .from('user_roles')
          .select('user_id, role, created_at, updated_at')
          .order('created_at', { ascending: false });
        
        usersData = result.data;
        usersError = result.error;
      }

      if (usersError) {
        throw usersError;
      }

      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      // Build user list
      const userList = (usersData || []).map((userData) => {
        const isCurrentUser = currentUser?.id === userData.user_id;
        return {
          id: userData.user_id,
          email: userData.email || (isCurrentUser ? currentUser.email : `user-${userData.user_id.substring(0, 8)}...`),
          role: userData.role,
          created_at: userData.created_at,
          last_sign_in_at: userData.last_sign_in_at || (isCurrentUser ? currentUser.last_sign_in_at : null),
          isCurrentUser,
        };
      });

      setUsers(userList);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(t('settings.userManagement.errors.fetchFailed'));
      setLoading(false);
    }
  };

  const handleInviteUser = async (e) => {
    e.preventDefault();
    setInviteLoading(true);
    setError(null);

    try {
      // Build redirect URL for password setup
      const isProd = import.meta.env.PROD;
      const base = import.meta.env.BASE_URL || '/';
      const redirectUrl = isProd 
        ? `${window.location.origin}${base}#/reset-password`
        : `${window.location.origin}${base}reset-password`;

      // Use Supabase Admin API to invite user
      // Note: This requires server-side implementation or Supabase service role key
      // For now, using resetPasswordForEmail as a workaround to send invite
      
      // Proper implementation would be:
      // const { data, error } = await supabase.auth.admin.inviteUserByEmail(inviteEmail, {
      //   data: { role: inviteRole },
      //   redirectTo: redirectUrl,
      // });

      // Create user account and send password reset email
      const tempPassword = Math.random().toString(36).slice(-12) + 'A1!'; // Random temp password
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: inviteEmail,
        password: tempPassword,
        options: {
          data: { role: inviteRole },
          emailRedirectTo: redirectUrl,
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      // Debug: Check if email was auto-confirmed
      console.log('SignUp Response:', {
        userId: signUpData?.user?.id,
        email: signUpData?.user?.email,
        emailConfirmedAt: signUpData?.user?.email_confirmed_at,
        identities: signUpData?.user?.identities?.length,
      });

      // Add user to user_roles table
      if (signUpData?.user?.id) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: signUpData.user.id,
            role: inviteRole,
          });

        if (roleError) {
          console.warn('Failed to add user to user_roles:', roleError);
          // Don't throw - the user was created successfully
        }
      }

      // Send password reset email so they can set their own password
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(inviteEmail, {
        redirectTo: redirectUrl,
      });

      if (resetError) {
        console.warn('Password reset email failed:', resetError);
        // Don't throw - account was created successfully
      }

      setInviteSuccess(true);
      setTimeout(() => {
        setShowInviteModal(false);
        setInviteSuccess(false);
        setInviteEmail('');
        setInviteRole('event_manager');
        fetchUsers(); // Refresh user list
      }, 8000);

    } catch (err) {
      console.error('Error inviting user:', err);
      setError(err.message || t('settings.userManagement.errors.inviteFailed'));
    } finally {
      setInviteLoading(false);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      setError(null);

      // Update role in user_roles table
      const { error: updateError } = await supabase
        .from('user_roles')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        throw updateError;
      }

      // Refresh user list
      await fetchUsers();
      setEditingUser(null);
      
    } catch (err) {
      console.error('Error updating role:', err);
      setError(t('settings.userManagement.errors.updateFailed'));
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (!confirm(t('settings.userManagement.confirmDelete', { email: userEmail }))) {
      return;
    }

    try {
      setError(null);

      // Delete from user_roles table
      // This will also trigger auth.users deletion due to ON DELETE CASCADE
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        throw deleteError;
      }

      // Refresh user list
      await fetchUsers();

    } catch (err) {
      console.error('Error deleting user:', err);
      setError(t('settings.userManagement.errors.deleteFailed'));
    }
  };

  const roleLabels = {
    super_admin: t('settings.userManagement.roles.superAdmin'),
    system_manager: t('settings.userManagement.roles.systemManager'),
    event_manager: t('settings.userManagement.roles.eventManager'),
  };

  const roleColors = {
    super_admin: 'bg-purple-100 text-purple-800 border-purple-200',
    system_manager: 'bg-blue-100 text-blue-800 border-blue-200',
    event_manager: 'bg-green-100 text-green-800 border-green-200',
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">{t('settings.userManagement.loading')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Icon path={mdiAccount} size={1} />
              {t('settings.userManagement.title')}
            </h2>
            <p className="text-sm text-gray-600 mt-1">{t('settings.userManagement.description')}</p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Icon path={mdiPlus} size={0.8} />
            {t('settings.userManagement.inviteUser')}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-4">
            <div className="flex items-center">
              <Icon path={mdiAlertCircle} size={0.8} className="mr-2" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  {t('settings.userManagement.table.email')}
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  {t('settings.userManagement.table.role')}
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  {t('settings.userManagement.table.created')}
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  {t('settings.userManagement.table.lastLogin')}
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                  {t('settings.userManagement.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Icon path={mdiEmail} size={0.7} className="text-gray-400" />
                      <span className="text-sm text-gray-900">{user.email}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${roleColors[user.role] || 'bg-gray-100 text-gray-800'}`}>
                      {roleLabels[user.role] || user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title={t('settings.userManagement.editRole')}
                      >
                        <Icon path={mdiPencil} size={0.7} />
                      </button>
                      {isSuperAdmin && (
                        <button
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title={t('settings.userManagement.deleteUser')}
                        >
                          <Icon path={mdiDelete} size={0.7} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">{t('settings.userManagement.inviteUser')}</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Icon path={mdiClose} size={0.8} />
              </button>
            </div>

            {inviteSuccess ? (
              <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-lg">
                <div className="flex items-center">
                  <Icon path={mdiCheck} size={0.8} className="mr-2" />
                  <div>
                    <p className="font-semibold">{t('settings.userManagement.inviteSuccess')}</p>
                    <p className="text-sm mt-1">{t('settings.userManagement.inviteSuccessMessage')}</p>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInviteUser} className="space-y-4">
                <div>
                  <label className="label-base">
                    {t('settings.userManagement.emailLabel')}
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="input-base"
                    placeholder="manager@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="label-base">
                    {t('settings.userManagement.roleLabel')}
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="input-base"
                  >
                    <option value="event_manager">{roleLabels.event_manager}</option>
                    <option value="system_manager">{roleLabels.system_manager}</option>
                    {isSuperAdmin && (
                      <option value="super_admin">{roleLabels.super_admin}</option>
                    )}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {t(`settings.userManagement.roleDescriptions.${inviteRole}`)}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {t('settings.userManagement.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={inviteLoading}
                    className="flex-1 btn-primary"
                  >
                    {inviteLoading ? t('settings.userManagement.sending') : t('settings.userManagement.sendInvite')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
