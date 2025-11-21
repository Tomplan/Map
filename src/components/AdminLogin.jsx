import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import { BRANDING_CONFIG } from '../config/mapConfig';
import LanguageToggle from './LanguageToggle';

export default function AdminLogin({ onLogin, branding }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const errorRef = useRef(null);

  // Load remembered email on mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('adminRememberEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  // Focus on error when it appears
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus();
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Handle remember me
    if (rememberMe) {
      localStorage.setItem('adminRememberEmail', email);
    } else {
      localStorage.removeItem('adminRememberEmail');
    }

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (authError) {
      // User-friendly error messages
      if (authError.message.includes('Invalid login credentials')) {
        setError(t('adminLogin.errors.invalidCredentials'));
      } else if (authError.message.includes('Email not confirmed')) {
        setError(authError.message);
      } else if (authError.message.includes('Network')) {
        setError(t('adminLogin.errors.networkError'));
      } else {
        setError(t('adminLogin.errors.unknownError'));
      }
    } else {
      onLogin(data.user);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setError(null);

    // Use production URL for password reset redirect
    const productionUrl = import.meta.env.PROD 
      ? `${window.location.origin}${import.meta.env.BASE_URL}#/admin`
      : 'https://tomplan.github.io/Map/#/admin';
    
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: productionUrl,
    });

    setResetLoading(false);

    if (resetError) {
      setError(t('adminLogin.errors.resetFailed'));
    } else {
      setResetSuccess(true);
      setTimeout(() => {
        setShowResetForm(false);
        setResetSuccess(false);
        setResetEmail('');
      }, 5000);
    }
  };

  const eventName = branding?.eventName || '4x4 Vakantiebeurs';
  const logoUrl = branding?.logo || BRANDING_CONFIG.getDefaultLogoPath();

  // Password Reset Form
  if (showResetForm) {
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

            <h2 className="text-xl font-bold mb-2 text-gray-800">{t('adminLogin.resetPassword')}</h2>
            <p className="text-sm text-gray-600 mb-6">{t('adminLogin.resetInstructions')}</p>

            {resetSuccess ? (
              <div
                className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-lg mb-4 shadow-sm"
                role="alert"
                aria-live="polite"
              >
                <div className="flex items-center">
                  <span className="text-xl mr-3">✓</span>
                  <span>{t('adminLogin.resetEmailSent')}</span>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-5">
                <div>
                  <label htmlFor="reset-email" className="label-base">
                    {t('adminLogin.email')}
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="input-base"
                    placeholder={t('adminLogin.emailPlaceholder')}
                    aria-label={t('adminLogin.email')}
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
                  className="w-full py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg font-semibold hover:from-orange-700 hover:to-orange-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={resetLoading}
                >
                  {resetLoading ? t('adminLogin.loggingIn') : t('adminLogin.sendResetLink')}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowResetForm(false);
                    setError(null);
                    setResetEmail('');
                  }}
                  className="w-full py-2 text-orange-600 hover:text-orange-700 font-medium text-sm transition-colors"
                >
                  ← {t('adminLogin.backToLogin')}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Login Form
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

          <h2 className="text-lg font-semibold mb-6 text-gray-700 text-center">{t('adminLogin.subtitle')}</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="label-base">
                {t('adminLogin.email')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-base"
                placeholder={t('adminLogin.emailPlaceholder')}
                aria-label={t('adminLogin.email')}
                aria-required="true"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="label-base">
                {t('adminLogin.password')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-base pr-20"
                  placeholder={t('adminLogin.passwordPlaceholder')}
                  aria-label={t('adminLogin.password')}
                  aria-required="true"
                  required
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? t('adminLogin.hide') : t('adminLogin.show')}
                  tabIndex={-1}
                >
                  {showPassword ? '🔒' : '👁️'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label htmlFor="remember-me" className="flex items-center cursor-pointer group">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="mr-2 h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500 cursor-pointer"
                  aria-label={t('adminLogin.rememberMe')}
                />
                <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
                  {t('adminLogin.rememberMe')}
                </span>
              </label>

              <button
                type="button"
                onClick={() => setShowResetForm(true)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                {t('adminLogin.forgotPassword')}
              </button>
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
                  <span className="text-sm font-medium">{error}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg font-semibold hover:from-orange-700 hover:to-orange-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('adminLogin.loggingIn')}
                </span>
              ) : (
                t('adminLogin.loginButton')
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-gray-500">
          <p>Secure manager access only</p>
        </div>
      </div>
    </div>
  );
}
