import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Bell,
  Utensils,
  HeartHandshake,
  ShieldAlert,
  LogOut,
  ChevronDown,
  Sparkles,
  MapPin,
  CheckCircle,
  Clock,
  Menu,
  X,
  PlusCircle,
  BarChart3,
  ListOrdered,
  FileCheck2,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, organization, unreadCount, notifications, quickLogin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isDemoMenuOpen, setIsDemoMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleQuickSwitch = async (type: 'donor' | 'ngo' | 'pending_ngo' | 'volunteer' | 'admin') => {
    setIsDemoMenuOpen(false);
    await quickLogin(type);
    if (type === 'donor') navigate('/donor/dashboard');
    else if (type === 'ngo' || type === 'pending_ngo') navigate('/recipient/dashboard');
    else if (type === 'volunteer') navigate('/volunteer/dashboard');
    else if (type === 'admin') navigate('/admin/dashboard');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-stone-50/95 backdrop-blur-md border-b border-stone-200/80">
      {/* Quick Judge/Evaluation Demo Bar */}
      <div className="bg-emerald-950 text-stone-200 text-xs px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 border-b border-emerald-900/50">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-emerald-400">⚡ Hackathon Demo Persona:</span>
          <span className="text-stone-300">
            {user ? (
              <>
                <strong className="text-white">{user.name}</strong> ({user.role} ·{' '}
                {organization?.organizationName || 'Staff'})
              </>
            ) : (
              'Public Guest View'
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-stone-400 hidden sm:inline">1-Click Switch:</span>
          <button
            onClick={() => handleQuickSwitch('donor')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              user?.role === 'DONOR'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'bg-emerald-900/60 hover:bg-emerald-800 text-stone-200'
            }`}
          >
            🍲 Donor
          </button>
          <button
            onClick={() => handleQuickSwitch('ngo')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              user?.role === 'RECIPIENT' && organization?.verificationStatus === 'VERIFIED'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'bg-emerald-900/60 hover:bg-emerald-800 text-stone-200'
            }`}
          >
            🤝 Verified NGO
          </button>
          <button
            onClick={() => handleQuickSwitch('pending_ngo')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              user?.role === 'RECIPIENT' && organization?.verificationStatus === 'PENDING'
                ? 'bg-amber-600 text-white font-semibold'
                : 'bg-emerald-900/60 hover:bg-emerald-800 text-stone-200'
            }`}
          >
            ⏳ Pending NGO
          </button>
          <button
            onClick={() => handleQuickSwitch('volunteer')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              user?.role === 'VOLUNTEER'
                ? 'bg-blue-600 text-white font-semibold'
                : 'bg-emerald-900/60 hover:bg-emerald-800 text-stone-200'
            }`}
          >
            🚴 Volunteer
          </button>
          <button
            onClick={() => handleQuickSwitch('admin')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              user?.role === 'ADMIN'
                ? 'bg-purple-700 text-white font-semibold'
                : 'bg-emerald-900/60 hover:bg-emerald-800 text-stone-200'
            }`}
          >
            🛡️ Admin
          </button>
        </div>
      </div>

      {/* Main Navigation Bar (Top Bar Contract: 3 Zones) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single Brand Wordmark */}
          <Link
            to={
              user?.role === 'DONOR'
                ? '/donor/dashboard'
                : user?.role === 'RECIPIENT'
                ? '/recipient/dashboard'
                : user?.role === 'VOLUNTEER'
                ? '/volunteer/dashboard'
                : user?.role === 'ADMIN'
                ? '/admin/dashboard'
                : '/'
            }
            className="flex items-center gap-2.5 text-stone-900 font-bold text-lg tracking-tight whitespace-nowrap shrink-0 group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:bg-emerald-700 transition-colors">
              FB
            </div>
            <span>FoodBridge AI</span>
          </Link>

          {/* Zone 2: Concise Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600">
            {user?.role === 'DONOR' && (
              <>
                <Link
                  to="/donor/dashboard"
                  className={`hover:text-emerald-800 transition-colors whitespace-nowrap ${
                    isActive('/donor/dashboard') ? 'text-emerald-900 font-semibold' : ''
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/donor/listings"
                  className={`hover:text-emerald-800 transition-colors whitespace-nowrap ${
                    isActive('/donor/listings') ? 'text-emerald-900 font-semibold' : ''
                  }`}
                >
                  My Listings
                </Link>
                <Link
                  to="/donor/requests"
                  className={`hover:text-emerald-800 transition-colors whitespace-nowrap ${
                    isActive('/donor/requests') ? 'text-emerald-900 font-semibold' : ''
                  }`}
                >
                  Requests
                </Link>
                <Link
                  to="/donor/pickups"
                  className={`hover:text-emerald-800 transition-colors whitespace-nowrap ${
                    isActive('/donor/pickups') ? 'text-emerald-900 font-semibold' : ''
                  }`}
                >
                  Pickups
                </Link>
                <Link
                  to="/donor/history"
                  className={`hover:text-emerald-800 transition-colors whitespace-nowrap ${
                    isActive('/donor/history') ? 'text-emerald-900 font-semibold' : ''
                  }`}
                >
                  Donation History
                </Link>
              </>
            )}

            {user?.role === 'RECIPIENT' && (
              <>
                <Link
                  to="/recipient/dashboard"
                  className={`hover:text-emerald-800 transition-colors whitespace-nowrap ${
                    isActive('/recipient/dashboard') ? 'text-emerald-900 font-semibold' : ''
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/browse"
                  className={`hover:text-emerald-800 transition-colors whitespace-nowrap ${
                    isActive('/browse') ? 'text-emerald-900 font-semibold' : ''
                  }`}
                >
                  Browse Surplus Food
                </Link>
                <Link
                  to="/recipient/requests"
                  className={`hover:text-emerald-800 transition-colors whitespace-nowrap ${
                    isActive('/recipient/requests') ? 'text-emerald-900 font-semibold' : ''
                  }`}
                >
                  My Requests
                </Link>
                <Link
                  to="/recipient/pickups"
                  className={`hover:text-emerald-800 transition-colors whitespace-nowrap ${
                    isActive('/recipient/pickups') ? 'text-emerald-900 font-semibold' : ''
                  }`}
                >
                  Pickup Tracking
                </Link>
                <Link
                  to="/recipient/completed"
                  className={`hover:text-emerald-800 transition-colors whitespace-nowrap ${
                    isActive('/recipient/completed') ? 'text-emerald-900 font-semibold' : ''
                  }`}
                >
                  History
                </Link>
              </>
            )}

            {user?.role === 'VOLUNTEER' && (
              <>
                <Link
                  to="/volunteer/dashboard"
                  className={`hover:text-emerald-800 transition-colors whitespace-nowrap ${
                    isActive('/volunteer/dashboard') ? 'text-emerald-900 font-semibold' : ''
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/volunteer/available"
                  className={`hover:text-emerald-800 transition-colors whitespace-nowrap ${
                    isActive('/volunteer/available') ? 'text-emerald-900 font-semibold' : ''
                  }`}
                >
                  Available Pickups
                </Link>
                <Link
                  to="/volunteer/history"
                  className={`hover:text-emerald-800 transition-colors whitespace-nowrap ${
                    isActive('/volunteer/history') ? 'text-emerald-900 font-semibold' : ''
                  }`}
                >
                  Delivery History
                </Link>
                <Link
                  to="/volunteer/profile"
                  className={`hover:text-emerald-800 transition-colors whitespace-nowrap ${
                    isActive('/volunteer/profile') ? 'text-emerald-900 font-semibold' : ''
                  }`}
                >
                  Courier Profile
                </Link>
              </>
            )}

            {user?.role === 'ADMIN' && (
              <>
                <Link
                  to="/admin/dashboard"
                  className={`hover:text-emerald-800 transition-colors whitespace-nowrap ${
                    isActive('/admin/dashboard') ? 'text-emerald-900 font-semibold' : ''
                  }`}
                >
                  Admin Overview
                </Link>
                <Link
                  to="/admin/verifications"
                  className={`hover:text-emerald-800 transition-colors whitespace-nowrap ${
                    isActive('/admin/verifications') ? 'text-emerald-900 font-semibold' : ''
                  }`}
                >
                  NGO Verifications
                </Link>
                <Link
                  to="/admin/users"
                  className={`hover:text-emerald-800 transition-colors whitespace-nowrap ${
                    isActive('/admin/users') ? 'text-emerald-900 font-semibold' : ''
                  }`}
                >
                  Users & Orgs
                </Link>
                <Link
                  to="/admin/listings"
                  className={`hover:text-emerald-800 transition-colors whitespace-nowrap ${
                    isActive('/admin/listings') ? 'text-emerald-900 font-semibold' : ''
                  }`}
                >
                  Listings
                </Link>
                <Link
                  to="/admin/reports"
                  className={`hover:text-emerald-800 transition-colors whitespace-nowrap ${
                    isActive('/admin/reports') ? 'text-emerald-900 font-semibold' : ''
                  }`}
                >
                  Safety Reports
                </Link>
              </>
            )}

            {!user && (
              <>
                <Link
                  to="/browse"
                  className={`hover:text-emerald-800 transition-colors whitespace-nowrap ${
                    isActive('/browse') ? 'text-emerald-900 font-semibold' : ''
                  }`}
                >
                  Available Food
                </Link>
                <Link
                  to="/how-it-works"
                  className={`hover:text-emerald-800 transition-colors whitespace-nowrap ${
                    isActive('/how-it-works') ? 'text-emerald-900 font-semibold' : ''
                  }`}
                >
                  How It Works
                </Link>
                <Link
                  to="/impact"
                  className={`hover:text-emerald-800 transition-colors whitespace-nowrap ${
                    isActive('/impact') ? 'text-emerald-900 font-semibold' : ''
                  }`}
                >
                  Impact Analytics
                </Link>
                <Link
                  to="/about"
                  className={`hover:text-emerald-800 transition-colors whitespace-nowrap ${
                    isActive('/about') ? 'text-emerald-900 font-semibold' : ''
                  }`}
                >
                  About FoodBridge
                </Link>
              </>
            )}
          </nav>

          {/* Zone 3: 1 Primary Action / Profile Control */}
          <div className="flex items-center gap-3 shrink-0">
            {user ? (
              <>
                {/* Notification Bell */}
                <div className="relative">
                  <button
                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                    className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg relative transition-colors"
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center font-mono">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown Panel */}
                  {isNotifOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white border border-stone-200 rounded-xl shadow-lg z-50 overflow-hidden">
                      <div className="px-4 py-3 bg-stone-50 border-b border-stone-100 flex items-center justify-between">
                        <span className="text-xs font-semibold text-stone-800 uppercase tracking-wider">
                          Notifications
                        </span>
                        <span className="text-xs text-stone-500 font-mono">{unreadCount} unread</span>
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-stone-100">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-xs text-stone-500">No notifications yet.</div>
                        ) : (
                          notifications.slice(0, 6).map((n) => (
                            <div
                              key={n.id}
                              className={`p-3 text-xs hover:bg-stone-50 transition-colors ${
                                !n.isRead ? 'bg-emerald-50/40' : ''
                              }`}
                            >
                              <div className="font-semibold text-stone-900">{n.title}</div>
                              <div className="text-stone-600 mt-0.5">{n.message}</div>
                              <div className="text-[10px] text-stone-400 mt-1 font-mono">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <div className="p-2 bg-stone-50 border-t border-stone-100 text-center">
                          <Link
                            to={user.role === 'DONOR' ? '/donor/requests' : '/recipient/requests'}
                            onClick={() => setIsNotifOpen(false)}
                            className="text-xs text-emerald-800 font-medium hover:underline"
                          >
                            View Active Requests
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Primary Role Action */}
                {user.role === 'DONOR' && (
                  <Link
                    to="/donor/create"
                    className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-800 rounded-lg hover:bg-emerald-700 transition-colors shadow-xs whitespace-nowrap shrink-0"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Create Donation</span>
                  </Link>
                )}

                {user.role === 'RECIPIENT' && (
                  <Link
                    to="/browse"
                    className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-800 rounded-lg hover:bg-emerald-700 transition-colors shadow-xs whitespace-nowrap shrink-0"
                  >
                    <Utensils className="w-4 h-4" />
                    <span>Browse Food</span>
                  </Link>
                )}

                {/* User Profile / Logout */}
                <button
                  onClick={logout}
                  className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs font-semibold text-stone-700 hover:text-stone-900 transition-colors whitespace-nowrap"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 rounded-lg hover:bg-emerald-700 transition-colors shadow-xs whitespace-nowrap shrink-0"
                >
                  Join FoodBridge
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-stone-600 hover:text-stone-900 rounded-lg"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 bg-white px-4 py-3 space-y-2">
          {user?.role === 'DONOR' && (
            <>
              <Link to="/donor/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 text-sm font-medium text-stone-700">Dashboard</Link>
              <Link to="/donor/create" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 text-sm font-medium text-emerald-800 font-semibold">+ Create Donation</Link>
              <Link to="/donor/listings" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 text-sm font-medium text-stone-700">My Listings</Link>
              <Link to="/donor/requests" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 text-sm font-medium text-stone-700">Incoming Requests</Link>
              <Link to="/donor/pickups" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 text-sm font-medium text-stone-700">Pickups</Link>
            </>
          )}
          {user?.role === 'RECIPIENT' && (
            <>
              <Link to="/recipient/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 text-sm font-medium text-stone-700">Dashboard</Link>
              <Link to="/browse" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 text-sm font-medium text-emerald-800 font-semibold">Browse Surplus Food</Link>
              <Link to="/recipient/requests" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 text-sm font-medium text-stone-700">My Requests</Link>
              <Link to="/recipient/pickups" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 text-sm font-medium text-stone-700">Pickup Tracking</Link>
            </>
          )}
          {user?.role === 'VOLUNTEER' && (
            <>
              <Link to="/volunteer/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 text-sm font-medium text-stone-700">Dashboard</Link>
              <Link to="/volunteer/available" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 text-sm font-medium text-emerald-800 font-semibold">Available Pickups</Link>
              <Link to="/volunteer/history" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 text-sm font-medium text-stone-700">Delivery History</Link>
              <Link to="/volunteer/profile" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 text-sm font-medium text-stone-700">Courier Profile</Link>
            </>
          )}
          {user?.role === 'ADMIN' && (
            <>
              <Link to="/admin/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 text-sm font-medium text-stone-700">Admin Overview</Link>
              <Link to="/admin/verifications" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 text-sm font-medium text-stone-700">Verifications</Link>
              <Link to="/admin/listings" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 text-sm font-medium text-stone-700">Listing Moderation</Link>
              <Link to="/admin/reports" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 text-sm font-medium text-stone-700">Reports</Link>
            </>
          )}
          {!user && (
            <>
              <Link to="/browse" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 text-sm font-medium text-stone-700">Browse Available Food</Link>
              <Link to="/how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 text-sm font-medium text-stone-700">How It Works</Link>
              <Link to="/impact" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 text-sm font-medium text-stone-700">Impact Analytics</Link>
              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 text-sm font-medium text-stone-700">Sign In</Link>
              <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 text-sm font-medium text-emerald-800 font-semibold">Register Organization</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
};
