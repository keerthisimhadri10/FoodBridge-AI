import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { PlatformAnalytics } from '../../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  TrendingUp,
  Award,
  Users,
  Building,
  CheckCircle2,
  Scale,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

const COLORS = ['#047857', '#0284c7', '#d97706', '#9333ea', '#e11d48', '#0d9488'];

export const ImpactPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getPlatformAnalytics();
        setAnalytics(data);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading || !analytics) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center text-xs text-stone-500">
        Loading impact telemetry and verified distribution data...
      </div>
    );
  }

  const { metrics, categoryBreakdown, redistributionTrends, areaDistribution } = analytics;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div>
        <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
          Operational Transparency & Impact Telemetry
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
          Food Redistribution Impact
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 mt-2 max-w-2xl leading-relaxed">
          All metrics on this dashboard are calculated strictly from independently confirmed, completed donation handovers.
          Pending, rejected, or cancelled requests are explicitly excluded from impact totals.
        </p>
      </div>

      {/* Serving Size Rigor Notice */}
      <div className="p-4 bg-stone-100 rounded-xl border border-stone-200 text-xs text-stone-700 flex items-start gap-3">
        <Scale className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
        <div>
          <strong className="text-stone-900">Serving-Size Standard:</strong> {metrics.averageServingSizeAssumption}.
          Calculated by converting batch weights (0.40 kg edible portion per adult meal) and individual meal boxes. Environmental benefits are conservative estimates based on diverted organic landfill decomposition.
        </div>
      </div>

      {/* Primary KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-stone-200/90 shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Meals</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold font-mono tabular-nums text-emerald-800">
            {metrics.totalMealsRedistributed}
          </div>
          <div className="text-xs text-stone-500 mt-1">Directly received by beneficiaries</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200/90 shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Food Weight</span>
            <Scale className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold font-mono tabular-nums text-stone-900">
            {metrics.totalWeightRedistributedKg} <span className="text-sm font-normal text-stone-500">kg</span>
          </div>
          <div className="text-xs text-stone-500 mt-1">Diverted from commercial waste</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200/90 shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Active Donors</span>
            <Building className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold font-mono tabular-nums text-stone-900">
            {metrics.activeDonorsCount}
          </div>
          <div className="text-xs text-stone-500 mt-1">Restaurants, Bakeries & Markets</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200/90 shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Verified NGOs</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold font-mono tabular-nums text-stone-900">
            {metrics.verifiedRecipientsCount}
          </div>
          <div className="text-xs text-stone-500 mt-1">Audited distribution centers</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Trend Chart */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-stone-900">7-Day Meal Redistribution Trend</h3>
            <p className="text-xs text-stone-500">Daily meals collected and delivered across Hyderabad</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={redistributionTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMeals" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#047857" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#047857" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#78716c' }} />
                <YAxis tick={{ fontSize: 11, fill: '#78716c' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1c1917',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
                <Area type="monotone" dataKey="meals" stroke="#047857" strokeWidth={2} fillOpacity={1} fill="url(#colorMeals)" name="Meals" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Chart */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-stone-900">Meals Redistributed by Category</h3>
            <p className="text-xs text-stone-500">Distribution across cooked dishes, bakery surplus, and fresh produce</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#78716c' }} />
                <YAxis tick={{ fontSize: 11, fill: '#78716c' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1c1917',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
                <Bar dataKey="meals" fill="#047857" radius={[6, 6, 0, 0]} name="Meals Provided">
                  {categoryBreakdown.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Locality Distribution in Hyderabad */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-stone-900">Locality-Wise Redistribution Activity (Hyderabad)</h3>
          <p className="text-xs text-stone-500">Volume distribution across active municipal zones</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {areaDistribution.map((item) => (
            <div key={item.locality} className="p-3 bg-stone-50 rounded-xl border border-stone-200/80">
              <span className="text-xs text-stone-500 block">{item.locality}</span>
              <span className="text-lg font-bold text-stone-900 font-mono tabular-nums">
                {item.meals} <span className="text-xs font-normal text-stone-400">meals</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
