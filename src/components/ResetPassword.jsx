import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import { BRANDING_CONFIG } from '../config/mapConfig';
import LanguageToggle from './LanguageToggle';

/**
 * ResetPassword - Page for users to set a new password after clicking reset link in email
 * Detects access_token from URL (added by Supabase) and updates password
 */
export default function ResetPassword({ branding }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [tokenError, setTokenError] = useState(null); // Separate error for invalid/expired tokens
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const errorRef = useRef(null);

  // Focus on error when it appears
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus();
    }
  }, [error]);

  // Check for valid reset token
  useEffect(() => {
    const checkResetToken = async () => {
      // First, give Supabase time to process the token from URL
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const { data: { session } } = await supabase.auth.getSession();
      
      // Check for error parameters in URL
      const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || window.location.search);
      const errorParam = urlParams.get('error');
      const errorDescription = urlParams.get('error_description');

      if (errorParam && !session) {
        // Error in URL and no valid session = expired/invalid token
        if (errorParam === 'access_denied' || errorDescription?.includes('expired')) {
          setTokenError(t('resetPassword.errors.tokenExpired'));
        } else {
          setTokenError(t('resetPassword.errors.invalidToken'));
        }
      } else if (!session) {
        // No error param but also no session = invalid token
        setTokenError(t('resetPassword.errors.invalidToken'));
      }
      // If we have a session, everything is good - show the form
    };

    checkResetToken();
  }, [t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (newPassword.length < 6) {
      setError(t('resetPassword.errors.passwordTooShort'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('resetPassword.errors.passwordMismatch'));
      return;
    }

    setLoading(true);

    // Update password using Supabase
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setLoading(false);

    if (updateError) {
      setError(t('resetPassword.errors.updateFailed'));
    } else {
      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        const isProd = import.meta.env.PROD;
        const base = import.meta.env.BASE_URL || '/';
        const baseUrl = base.endsWith('/') ? base : `${base}/`;
        window.location.href = isProd ? `${baseUrl}#/admin` : `${baseUrl}admin`;
      }, 3000);
    }
  };

  const eventName = branding?.eventName || '4x4 Vakantiebeurs';
  const logoUrl = branding?.logo || BRANDING_CONFIG.getDefaultLogoPath();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="flex justify-end mb-6">
            <LanguageToggle />
          </div>
          
          <div className="flex flex-col items-center mb-8">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-xl shadow-lg mb-4">
              <img src={logoUrl} alt="Event Logo" className="h-12 w-12 object-contain" />
            </div>
            <h1 className="font-bold text-2xl text-gray-800 mb-1">{eventName}</h1>
            <p className="text-gray-500 text-sm">Manager Portal</p>
          </div>

          <h2 className="text-xl font-bold mb-2 text-gray-800">{t('resetPassword.title')}</h2>
          <p className="text-sm text-gray-600 mb-6">{t('resetPassword.instructions')}</p>

          {success ? (
            <div
              className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-lg shadow-sm"
              role="alert"
              aria-live="polite"
            >
              <div className="flex items-center mb-2">
                <span className="text-xl mr-3">✓</span>
                <span className="font-semibold">{t('resetPassword.success')}</span>
              </div>
              <p className="text-sm ml-8">{t('resetPassword.redirecting')}</p>
            </div>
          ) : tokenError ? (
            <div className="space-y-4">
              <div
                ref={errorRef}
                className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg shadow-sm"
                role="alert"
                aria-live="assertive"
                tabIndex={-1}
              >
                <div className="flex items-start">
                  <span className="text-xl mr-3">⚠</span>
                  <div className="flex-1">
                    <p className="font-semibold mb-1">{t('resetPassword.errors.linkExpiredTitle')}</p>
                    <p className="text-sm">{tokenError}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const isProd = import.meta.env.PROD;
                    const base = import.meta.env.BASE_URL || '/';
                    const baseUrl = base.endsWith('/') ? base : `${base}/`;
                    window.location.href = isProd ? `${baseUrl}#/admin` : `${baseUrl}admin`;
                  }}
                  className="flex-1 btn-primary"
                >
                  {t('resetPassword.requestNewLink')}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="new-password" className="label-base">
                  {t('resetPassword.newPassword')}
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-base"
                    placeholder={t('resetPassword.newPasswordPlaceholder')}
                    aria-label={t('resetPassword.newPassword')}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors text-sm"
                    aria-label={showPassword ? t('resetPassword.hidePassword') : t('resetPassword.showPassword')}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">{t('resetPassword.passwordRequirements')}</p>
              </div>

              <div>
                <label htmlFor="confirm-password" className="label-base">
                  {t('resetPassword.confirmPassword')}
                </label>
                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-base"
                  placeholder={t('resetPassword.confirmPasswordPlaceholder')}
                  aria-label={t('resetPassword.confirmPassword')}
                  required
                />
              </div>

              {error && (
                <div
                  ref={errorRef}
                  className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg shadow-sm"
                  role="alert"
                  aria-live="assertive"
                  tabIndex={-1}
                >
                  <div className="flex items-center">
                    <span className="text-xl mr-3">⚠</span>
                    <span className="text-sm">{error}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="btn-primary w-full"
                disabled={loading}
              >
                {loading ? t('resetPassword.updating') : t('resetPassword.updatePassword')}
              </button>

              <button
                type="button"
                onClick={() => {
                  const isProd = import.meta.env.PROD;
                  const base = import.meta.env.BASE_URL || '/';
                  const baseUrl = base.endsWith('/') ? base : `${base}/`;
                  window.location.href = isProd ? `${baseUrl}#/admin` : `${baseUrl}admin`;
                }}
                className="w-full py-2 text-orange-600 hover:text-orange-700 font-medium text-sm transition-colors"
              >
                ← {t('resetPassword.backToLogin')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
