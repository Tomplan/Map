import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { BRANDING_CONFIG } from '../config/mapConfig';

export default function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      onLogin(data.user);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-sm mx-auto mt-8 p-6 border rounded shadow bg-white"
    >
      <div className="flex flex-col items-center mb-4">
        <img src={BRANDING_CONFIG.getDefaultLogoPath()} alt="Event Logo" className="h-12 mb-2" />
        <span className="font-bold text-xl">4x4 Vakantiebeurs Admin</span>
      </div>
      <h2 className="text-lg font-bold mb-4">Sign in to manage event markers</h2>
      <label className="block mb-2">
        Email
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
      </label>
      <label className="block mb-4">
        Password
        <div className="flex">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
          <button
            type="button"
            className="ml-2 px-2 py-1 text-xs bg-gray-200 rounded"
            onClick={() => setShowPassword((s) => !s)}
            tabIndex={-1}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
      </label>
      <div className="mb-4 text-right">
        <a href="#" className="text-blue-600 text-sm hover:underline">
          Forgot password?
        </a>
      </div>
      {error && <div className="text-red-600 mb-2 font-semibold">{error}</div>}
      <button
        type="submit"
        className="w-full py-2 bg-blue-600 text-white rounded"
        disabled={loading}
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
