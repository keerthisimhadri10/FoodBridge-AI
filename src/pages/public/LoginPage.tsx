import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, Sparkles, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, quickLogin, isLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid email or password.');
    }
  };

  const handleDemo = async (type: 'donor' | 'ngo' | 'pending_ngo' | 'admin') => {
    setErrorMsg(null);
    try {
      await quickLogin(type);
      if (type === 'donor') navigate('/donor/dashboard');
      else if (type === 'ngo' || type === 'pending_ngo') navigate('/recipient/dashboard');
      else if (type === 'admin') navigate('/admin/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo login failed.');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white font-bold text-lg flex items-center justify-center mx-auto shadow-xs">
          FB
        </div>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Sign In to FoodBridge AI</h1>
        <p className="text-xs text-stone-600">Access your donor, recipient, or administration portal</p>
      </div>

      {/* 1-Click Quick Demo Sign In Box */}
      <div className="bg-emerald-950 text-white p-5 rounded-2xl shadow-md space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Evaluation Demo Personas (1-Click Instant Sign-In)</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={() => handleDemo('donor')}
            className="p-2.5 bg-emerald-900 hover:bg-emerald-800 rounded-lg text-left transition-colors border border-emerald-800"
          >
            <div className="font-semibold text-white">🍲 Restaurant Donor</div>
            <div className="text-[10px] text-stone-300 mt-0.5">Paradise Grand Kitchen</div>
          </button>
          <button
            onClick={() => handleDemo('ngo')}
            className="p-2.5 bg-emerald-900 hover:bg-emerald-800 rounded-lg text-left transition-colors border border-emerald-800"
          >
            <div className="font-semibold text-white">🤝 Verified NGO</div>
            <div className="text-[10px] text-stone-300 mt-0.5">Helping Hands Foundation</div>
          </button>
          <button
            onClick={() => handleDemo('pending_ngo')}
            className="p-2.5 bg-emerald-900 hover:bg-emerald-800 rounded-lg text-left transition-colors border border-emerald-800"
          >
            <div className="font-semibold text-amber-300">⏳ Pending NGO</div>
            <div className="text-[10px] text-stone-300 mt-0.5">Hope Community Shelter</div>
          </button>
          <button
            onClick={() => handleDemo('admin')}
            className="p-2.5 bg-emerald-900 hover:bg-emerald-800 rounded-lg text-left transition-colors border border-emerald-800"
          >
            <div className="font-semibold text-purple-300">🛡️ Administrator</div>
            <div className="text-[10px] text-stone-300 mt-0.5">Operations Console</div>
          </button>
        </div>
      </div>

      {/* Standard Credentials Form */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-xs space-y-4">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. donor@foodbridge.org"
              required
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50 text-xs"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-stone-500">
          Don't have an organization registered?{' '}
          <Link to="/register" className="text-emerald-800 font-semibold hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};
