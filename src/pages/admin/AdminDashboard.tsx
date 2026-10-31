import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import {
  Users,
  Building,
  ShieldCheck,
  ShieldAlert,
  Utensils,
  Award,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  FileCheck2,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [aiInsights, setAIInsights] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [dashData, insightsData] = await Promise.all([
          api.getAdminDashboard(),
          api.getAIInsights(),
        ]);
        setData(dashData);
        setAIInsights(insightsData);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center text-xs text-stone-500">
        Loading administrative console and platform metrics...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Banner */}
      <div className="bg-purple-950 text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-purple-900 rounded text-[11px] font-semibold text-purple-300">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Master Operations Console</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">FoodBridge AI Administration</h1>
          <p className="text-xs text-stone-300 max-w-xl">
            Audit recipient registrations, moderate listings, monitor dual-confirmed pickups, and inspect system audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/verifications"
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs whitespace-nowrap"
          >
            <span>Review Verifications ({data.pendingVerifications})</span>
          </Link>
        </div>
      </div>

      {/* Admin KPI Cards (§14) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-stone-200/90 shadow-xs">
          <span className="text-[11px] text-stone-400 uppercase tracking-wider block font-medium">Total Users</span>
          <span className="text-2xl font-bold font-mono tabular-nums text-stone-900 mt-1 block">
            {data.totalUsers}
          </span>
          <span className="text-[11px] text-stone-500 mt-0.5 block">Donors & Recipient staff</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200/90 shadow-xs">
          <span className="text-[11px] text-stone-400 uppercase tracking-wider block font-medium">Active Donors</span>
          <span className="text-2xl font-bold font-mono tabular-nums text-emerald-800 mt-1 block">
            {data.totalDonors}
          </span>
          <span className="text-[11px] text-stone-500 mt-0.5 block">Restaurants & Caterers</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200/90 shadow-xs">
          <span className="text-[11px] text-stone-400 uppercase tracking-wider block font-medium">Pending NGOs</span>
          <span className={`text-2xl font-bold font-mono tabular-nums mt-1 block ${data.pendingVerifications > 0 ? 'text-amber-600' : 'text-stone-900'}`}>
            {data.pendingVerifications}
          </span>
          <span className="text-[11px] text-stone-500 mt-0.5 block">Awaiting license review</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200/90 shadow-xs">
          <span className="text-[11px] text-stone-400 uppercase tracking-wider block font-medium">Active Food Listings</span>
          <span className="text-2xl font-bold font-mono tabular-nums text-stone-900 mt-1 block">
            {data.activeListings}
          </span>
          <span className="text-[11px] text-stone-500 mt-0.5 block">Currently available</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200/90 shadow-xs">
          <span className="text-[11px] text-stone-400 uppercase tracking-wider block font-medium">Completed Donations</span>
          <span className="text-2xl font-bold font-mono tabular-nums text-emerald-800 mt-1 block">
            {data.completedDonations}
          </span>
          <span className="text-[11px] text-stone-500 mt-0.5 block">Dual confirmed</span>
        </div>
      </div>

      {/* AI Donation Insights & Recommendations (§12.C & §12.D) */}
      {aiInsights && (
        <div className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">AI Platform Insights & Operational Guidance</h3>
              <p className="text-xs text-stone-500 font-mono">Derived from database telemetry via Gemini AI</p>
            </div>
          </div>

          <div className="p-4 bg-emerald-50/60 border border-emerald-200/70 rounded-xl space-y-2 text-xs">
            <div className="font-bold text-emerald-950 text-sm">{aiInsights.headline}</div>
            <p className="text-emerald-900 leading-relaxed">{aiInsights.summary}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
              <span className="font-bold text-stone-800 block">Redistribution Hotspots & Urgency Alerts:</span>
              <ul className="space-y-1.5 text-stone-600 list-disc list-inside">
                {aiInsights.unclaimedAlerts?.map((alert: string, i: number) => (
                  <li key={i}>{alert}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
              <span className="font-bold text-stone-800 block">AI Recommended Operational Actions:</span>
              <ul className="space-y-1.5 text-stone-600 list-disc list-inside">
                {aiInsights.actionableRecommendations?.map((rec: string, i: number) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Administration Sub-Modules Navigation Grid (§14) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          to="/admin/verifications"
          className="p-5 bg-white rounded-2xl border border-stone-200/90 shadow-xs hover:border-emerald-700/40 hover:shadow-sm transition-all group flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-stone-900 group-hover:text-emerald-800 transition-colors">
              Organization Verifications
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Audit NGO legal registrations, license documentation, and approve/reject verification status.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-emerald-800">
            <span>{data.pendingVerifications} Pending Approvals</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        <Link
          to="/admin/listings"
          className="p-5 bg-white rounded-2xl border border-stone-200/90 shadow-xs hover:border-emerald-700/40 hover:shadow-sm transition-all group flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <Utensils className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-stone-900 group-hover:text-emerald-800 transition-colors">
              Listing Moderation
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Review all published food listings across Hyderabad, inspect handling descriptions, and moderate.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-emerald-800">
            <span>{data.totalListings} Total Listings</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        <Link
          to="/admin/users"
          className="p-5 bg-white rounded-2xl border border-stone-200/90 shadow-xs hover:border-emerald-700/40 hover:shadow-sm transition-all group flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-stone-900 group-hover:text-emerald-800 transition-colors">
              User & Organization Accounts
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              View registered users, inspect linked organizations, and suspend or reactivate accounts.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-emerald-800">
            <span>{data.totalUsers} Active Accounts</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        <Link
          to="/admin/reports"
          className="p-5 bg-white rounded-2xl border border-stone-200/90 shadow-xs hover:border-emerald-700/40 hover:shadow-sm transition-all group flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-stone-900 group-hover:text-emerald-800 transition-colors">
              Safety & Quality Reports
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Investigate reports filed by recipients regarding food packaging, transport temperature, or descriptions.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-rose-700">
            <span>{data.pendingReports} Pending Reviews</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        <Link
          to="/admin/audit-logs"
          className="p-5 bg-white rounded-2xl border border-stone-200/90 shadow-xs hover:border-emerald-700/40 hover:shadow-sm transition-all group flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-stone-900 group-hover:text-emerald-800 transition-colors">
              Administrative Audit Logs
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Immutable chronological record of administrative verifications, account modifications, and resolutions.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-stone-700">
            <span>View Full Trail</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        <Link
          to="/impact"
          className="p-5 bg-white rounded-2xl border border-stone-200/90 shadow-xs hover:border-emerald-700/40 hover:shadow-sm transition-all group flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-stone-900 group-hover:text-emerald-800 transition-colors">
              Platform Impact Analytics
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Public and internal interactive charts tracking meal redistribution, category share, and localities.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-emerald-800">
            <span>{data.totalMealsRedistributed} Verified Meals</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
      </div>
    </div>
  );
};
