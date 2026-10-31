import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ShieldCheck, ArrowRight, Lock, Clock, Truck, Users } from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Operational Blueprint</div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
          How Food Redistribution Works
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          FoodBridge AI is engineered to eliminate the two main failure modes of food charity: double booking and missed
          handover deadlines.
        </p>
      </div>

      {/* Lifecycle Flow */}
      <div className="space-y-6">
        <div className="p-6 bg-white rounded-2xl border border-stone-200/90 shadow-xs flex flex-col md:flex-row items-start gap-6">
          <div className="w-12 h-12 rounded-xl bg-emerald-800 text-white font-extrabold text-lg flex items-center justify-center shrink-0">
            1
          </div>
          <div className="space-y-2 flex-1">
            <h3 className="text-lg font-bold text-stone-900">Surplus Food Publication</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              When food businesses (restaurants, wedding caterers, bakeries, or supermarkets) have prepared edible
              dishes or surplus batches, staff enter food quantity, category, preparation time, and storage protocols.
              Our Gemini AI integration automatically generates clear handling guidance and allergen declarations.
            </p>
            <div className="text-xs text-emerald-800 font-semibold flex items-center gap-1.5 pt-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Mandatory Food Handling Declaration signed by donor</span>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-stone-200/90 shadow-xs flex flex-col md:flex-row items-start gap-6">
          <div className="w-12 h-12 rounded-xl bg-emerald-800 text-white font-extrabold text-lg flex items-center justify-center shrink-0">
            2
          </div>
          <div className="space-y-2 flex-1">
            <h3 className="text-lg font-bold text-stone-900">Intelligent Proximity & Capacity Matching</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Verified recipient organizations (NGOs, homeless shelters, orphanages) browse the available listings or
              receive recommendations based on a deterministic weighted formula: Distance (30%), Capacity Suitability
              (25%), Dietary Preferences (20%), and Pickup Window Availability (25%).
            </p>
            <div className="text-xs text-emerald-800 font-semibold flex items-center gap-1.5 pt-1">
              <Users className="w-4 h-4" />
              <span>Restricted strictly to admin-audited, verified recipient organizations</span>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-stone-200/90 shadow-xs flex flex-col md:flex-row items-start gap-6">
          <div className="w-12 h-12 rounded-xl bg-emerald-800 text-white font-extrabold text-lg flex items-center justify-center shrink-0">
            3
          </div>
          <div className="space-y-2 flex-1">
            <h3 className="text-lg font-bold text-stone-900">Request & Atomic Quantity Reservation</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              When an NGO requests food, the request starts as PENDING without locking inventory. When the donor approves
              the request, the system runs an atomic check on the database. If enough quantity exists, the exact quantity
              is reserved and the unique Pickup Reference Code (e.g. <code>FB-HYD-7821</code>) is issued.
            </p>
            <div className="text-xs text-emerald-800 font-semibold flex items-center gap-1.5 pt-1">
              <Lock className="w-4 h-4" />
              <span>Guaranteed concurrency protection: No double bookings can ever occur</span>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-stone-200/90 shadow-xs flex flex-col md:flex-row items-start gap-6">
          <div className="w-12 h-12 rounded-xl bg-emerald-800 text-white font-extrabold text-lg flex items-center justify-center shrink-0">
            4
          </div>
          <div className="space-y-2 flex-1">
            <h3 className="text-lg font-bold text-stone-900">Dual Independent Pickup Confirmation</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              At the dispatch door, the recipient displays their Pickup Code. Both parties confirm collection in their
              respective portal dashboards independently. Only once BOTH sides have confirmed does the request transition
              to COMPLETED, permanently recording the meal metrics in impact analytics.
            </p>
            <div className="text-xs text-emerald-800 font-semibold flex items-center gap-1.5 pt-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Immutable audit logs ensure accountability for donors and recipients</span>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Strip */}
      <div className="p-8 bg-stone-900 rounded-2xl text-white text-center space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold">Ready to Start Redistributing?</h2>
        <p className="text-xs sm:text-sm text-stone-400 max-w-lg mx-auto">
          Whether you are a food business looking to prevent waste or a shelter coordinator in need of supplies, join FoodBridge AI today.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            to="/register"
            className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold"
          >
            Register Organization
          </Link>
          <Link
            to="/browse"
            className="px-5 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-semibold"
          >
            Browse Food Listings
          </Link>
        </div>
      </div>
    </div>
  );
};
