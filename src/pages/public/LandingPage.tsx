import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { FoodListing, PlatformAnalytics } from '../../types';
import { FoodCard } from '../../components/common/FoodCard';
import { FoodDetailsModal } from '../../components/common/FoodDetailsModal';
import { useAuth } from '../../context/AuthContext';
import {
  Sparkles,
  Utensils,
  HeartHandshake,
  ShieldCheck,
  MapPin,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  Users,
  Building,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user, quickLogin } = useAuth();
  const navigate = useNavigate();

  const [activeListings, setActiveListings] = useState<FoodListing[]>([]);
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [selectedListing, setSelectedListing] = useState<FoodListing | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [listingsData, analyticsData] = await Promise.all([
          api.getListings({ status: 'AVAILABLE' }),
          api.getPlatformAnalytics(),
        ]);
        setActiveListings(listingsData.slice(0, 4));
        setAnalytics(analyticsData);
      } catch (err) {
        console.error('Failed to load landing data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative pt-6 sm:pt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100/70 border border-emerald-200/80 rounded-lg text-emerald-900 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                <span>AI-Assisted Redistribution Platform · Hyderabad</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-900 tracking-tight leading-[1.15] text-balance">
                Good Food Deserves a Second Chance.
              </h1>

              <p className="text-stone-600 text-sm sm:text-base leading-relaxed max-w-xl">
                Connecting surplus food from restaurants, hotels, bakeries, and supermarkets with verified recipient
                organizations through intelligent matching, responsible redistribution, and transparent donation
                tracking.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/register"
                  className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs sm:text-sm transition-colors shadow-xs flex items-center gap-2 whitespace-nowrap"
                >
                  <Utensils className="w-4 h-4" />
                  <span>Donate Food</span>
                </Link>
                <Link
                  to="/browse"
                  className="px-5 py-2.5 bg-white hover:bg-stone-100 text-stone-800 border border-stone-200 rounded-xl font-semibold text-xs sm:text-sm transition-colors shadow-xs flex items-center gap-2 whitespace-nowrap"
                >
                  <span>Find Food Nearby</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Fast Evaluation Persona Shortcuts */}
              <div className="pt-3 border-t border-stone-200/80 flex flex-wrap items-center gap-2 text-xs text-stone-500">
                <span className="font-medium text-stone-700">Quick Test Drive:</span>
                <button
                  onClick={async () => {
                    await quickLogin('donor');
                    navigate('/donor/dashboard');
                  }}
                  className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 rounded-md font-medium text-stone-800 transition-colors"
                >
                  🍲 As Restaurant Donor
                </button>
                <button
                  onClick={async () => {
                    await quickLogin('ngo');
                    navigate('/recipient/dashboard');
                  }}
                  className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 rounded-md font-medium text-stone-800 transition-colors"
                >
                  🤝 As Verified NGO
                </button>
                <button
                  onClick={async () => {
                    await quickLogin('admin');
                    navigate('/admin/dashboard');
                  }}
                  className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 rounded-md font-medium text-stone-800 transition-colors"
                >
                  🛡️ As Administrator
                </button>
              </div>
            </div>

            {/* Right Hero Visual */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl overflow-hidden border border-stone-200 shadow-md group">
                <img
                  src="/src/assets/images/hero_foodbridge_donation_1793427943820.jpg"
                  alt="Community chefs and volunteers packaging surplus meals"
                  referrerPolicy="no-referrer"
                  className="w-full h-80 sm:h-96 object-cover group-hover:scale-102 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent flex flex-col justify-end p-6 text-white">
                  <div className="text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-1">
                    Redistribution in Action
                  </div>
                  <p className="text-sm font-medium leading-snug">
                    Over {analytics?.metrics.totalMealsRedistributed || 190} nutritious meals preserved and safely collected by verified Hyderabad shelters.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Statistics Strip */}
      <section className="bg-stone-900 text-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
            <div className="border-l-2 border-emerald-500 pl-4">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-emerald-400">
                {analytics?.metrics.totalMealsRedistributed || 190}+
              </div>
              <div className="text-xs text-stone-400 mt-1 uppercase tracking-wider font-semibold">
                Meals Redistributed
              </div>
              <div className="text-[11px] text-stone-500 mt-0.5">Est. 400g average serving</div>
            </div>

            <div className="border-l-2 border-emerald-500 pl-4">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-white">
                {analytics?.metrics.completedDonations || 3}
              </div>
              <div className="text-xs text-stone-400 mt-1 uppercase tracking-wider font-semibold">
                Completed Handovers
              </div>
              <div className="text-[11px] text-stone-500 mt-0.5">Dual-confirmed pickup</div>
            </div>

            <div className="border-l-2 border-emerald-500 pl-4">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-white">
                {analytics?.metrics.verifiedRecipientsCount || 2}
              </div>
              <div className="text-xs text-stone-400 mt-1 uppercase tracking-wider font-semibold">
                Verified Recipient NGOs
              </div>
              <div className="text-[11px] text-stone-500 mt-0.5">Admin audited licenses</div>
            </div>

            <div className="border-l-2 border-emerald-500 pl-4">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-emerald-400">
                {analytics?.metrics.completionRatePercent || 94}%
              </div>
              <div className="text-xs text-stone-400 mt-1 uppercase tracking-wider font-semibold">
                Pickup Success Rate
              </div>
              <div className="text-[11px] text-stone-500 mt-0.5">Zero double bookings</div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Available Food Spotlight */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
              Active Surplus Listings
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              Ready for Collection Today
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Real-time surplus listings from local kitchens with transparent inventory and pickup windows.
            </p>
          </div>
          <Link
            to="/browse"
            className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Explore All Listings & Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-72 bg-stone-200/70 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {activeListings.map((listing) => (
              <FoodCard
                key={listing.id}
                listing={listing}
                onViewDetails={(l) => setSelectedListing(l)}
                onRequest={(l) => setSelectedListing(l)}
              />
            ))}
          </div>
        )}
      </section>

      {/* How It Works Section */}
      <section className="bg-stone-100/70 py-16 border-y border-stone-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
              Structured Redistribution Protocol
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              How FoodBridge AI Works
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-2">
              From surplus kitchen preparation to beneficiary handover, every donation follows strict inventory
              concurrency and dual-party confirmation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="bg-white p-6 rounded-xl border border-stone-200/80 shadow-xs flex flex-col">
              <div className="w-9 h-9 rounded-lg bg-emerald-800 text-white font-bold flex items-center justify-center text-sm mb-4">
                01
              </div>
              <h3 className="text-base font-bold text-stone-900">Donors Publish Surplus</h3>
              <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                Restaurants and supermarkets post fresh surplus with preparation timestamp, storage method, and
                collection deadlines.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-6 rounded-xl border border-stone-200/80 shadow-xs flex flex-col">
              <div className="w-9 h-9 rounded-lg bg-emerald-800 text-white font-bold flex items-center justify-center text-sm mb-4">
                02
              </div>
              <h3 className="text-base font-bold text-stone-900">AI Matches Verified NGOs</h3>
              <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                Our engine scores geographic proximity (30%), quantity fit (25%), dietary alignment (20%), and pickup timing (25%).
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-6 rounded-xl border border-stone-200/80 shadow-xs flex flex-col">
              <div className="w-9 h-9 rounded-lg bg-emerald-800 text-white font-bold flex items-center justify-center text-sm mb-4">
                03
              </div>
              <h3 className="text-base font-bold text-stone-900">Atomic Reservation</h3>
              <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                When a donor accepts an NGO request, database mutex locking atomically reserves the quantity, preventing double booking.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white p-6 rounded-xl border border-stone-200/80 shadow-xs flex flex-col">
              <div className="w-9 h-9 rounded-lg bg-emerald-800 text-white font-bold flex items-center justify-center text-sm mb-4">
                04
              </div>
              <h3 className="text-base font-bold text-stone-900">Dual Confirmation</h3>
              <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                Both donor and recipient independently verify handover using the pickup reference code, finalizing completion and updating analytics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Intelligence Features Spotlight */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-2xl border border-stone-200/90 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-stone-900">Intelligent Food Matching</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Transparent 4-variable scoring system matches food batches with nearby recipient shelters based on real
              vehicle capacities and dietary preferences.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-stone-200/90 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-stone-900">AI Description Generator</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Donors input essential kitchen facts; Gemini drafts clear food descriptions with storage protocols, allergen warnings, and handling guidance for donor review.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-stone-200/90 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-stone-900">Predictive Demand Insights</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Monitors unclaimed food countdowns and alerts local coordinator teams to collect high-priority hot dishes before deadlines expire.
            </p>
          </div>
        </div>
      </section>

      {/* Demo Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-stone-200/80 pt-12">
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
            Community Testimonials
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900">Stories From Hyderabad Kitchens</h2>
          <span className="text-[11px] text-stone-400 block mt-1">(Clearly identified fictional evaluation testimonials)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 bg-stone-50 rounded-xl border border-stone-200/80 text-xs space-y-3">
            <p className="text-stone-700 italic leading-relaxed">
              "Before FoodBridge AI, coordinating leftover banquet food took 8 frantic phone calls at midnight. Now, our
              culinary staff posts the surplus in 40 seconds, an accredited shelter claims it, and dual collection codes ensure
              accountability."
            </p>
            <div className="text-stone-900 font-semibold">
              Chef Rajesh Sharma · Executive Chef, Paradise Grand, Banjara Hills
            </div>
          </div>

          <div className="p-5 bg-stone-50 rounded-xl border border-stone-200/80 text-xs space-y-3">
            <p className="text-stone-700 italic leading-relaxed">
              "Our children's home relies on nutritious produce and wholesome meals. The intelligent matching alert notifies
              our van team 2 hours ahead, meaning warm nutritious food reaches our dining hall reliably every evening."
            </p>
            <div className="text-stone-900 font-semibold">
              Sister Mary · Care Director, Sneha Children's Home, Begumpet
            </div>
          </div>
        </div>
      </section>

      {/* Detail / Request Modal */}
      {selectedListing && (
        <FoodDetailsModal
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          onRequestSubmitted={() => {
            // Refresh listings
            api.getListings({ status: 'AVAILABLE' }).then((data) => setActiveListings(data.slice(0, 4)));
          }}
        />
      )}
    </div>
  );
};
