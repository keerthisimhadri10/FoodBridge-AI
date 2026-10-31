import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { FoodListing, DonationRequest } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { FoodCard } from '../../components/common/FoodCard';
import { FoodDetailsModal } from '../../components/common/FoodDetailsModal';
import {
  HeartHandshake,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  MapPin,
  Clock,
  ArrowRight,
  CheckCircle,
  Truck,
  Building,
} from 'lucide-react';

export const RecipientDashboard: React.FC = () => {
  const { user, organization, quickLogin } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<any>(null);
  const [recommendedFood, setRecommendedFood] = useState<FoodListing[]>([]);
  const [myRequests, setMyRequests] = useState<DonationRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedListing, setSelectedListing] = useState<FoodListing | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [analyticsData, listingsData, requestsData] = await Promise.all([
        api.getRecipientAnalytics(),
        api.getListings({ status: 'AVAILABLE' }),
        api.getRequests(),
      ]);

      setStats(analyticsData);
      setRecommendedFood(listingsData.slice(0, 3));
      setMyRequests(requestsData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization?.id]);

  const isVerified = organization?.verificationStatus === 'VERIFIED';
  const isPending = organization?.verificationStatus === 'PENDING';

  if (isLoading && !stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center text-xs text-stone-500">
        Loading recipient shelter dashboard and available food data...
      </div>
    );
  }

  const activePickups = myRequests.filter((r) => r.requestStatus === 'ACCEPTED' || r.requestStatus === 'COLLECTED');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-stone-900 text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-stone-800 rounded text-[11px] font-semibold text-emerald-400">
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Recipient Organization Portal · {organization?.organizationType || 'NGO'}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {organization?.organizationName || 'Charitable Organization'}
          </h1>
          <p className="text-xs text-stone-300 max-w-xl">
            Discover available surplus food from nearby donor kitchens, track collection pickups, and view verified redistribution receipts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/browse"
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs whitespace-nowrap"
          >
            <MapPin className="w-4 h-4" />
            <span>Discover Food on Map</span>
          </Link>
        </div>
      </div>

      {/* Verification Status Banner (§11) */}
      {isVerified ? (
        <div className="p-4 bg-emerald-50 border border-emerald-200/90 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <div className="font-bold text-emerald-950 text-sm">Organization Verified by Administration</div>
              <div className="text-emerald-800 mt-0.5">
                Your credentials are active. You are authorized to submit donation requests and coordinate collections.
              </div>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-200 text-emerald-900 font-bold rounded-lg text-xs font-mono">
            VERIFIED
          </span>
        </div>
      ) : isPending ? (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-amber-950 text-sm">Verification Application Under Review</div>
              <div className="text-amber-800 mt-0.5 leading-relaxed">
                Your organization profile is currently in <strong>PENDING</strong> status. An administrator must verify your documentation before requests can be submitted.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => quickLogin('admin')}
              className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-semibold rounded-lg text-xs"
            >
              🛡️ Switch to Admin (Approve Now)
            </button>
            <button
              onClick={() => quickLogin('ngo')}
              className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs"
            >
              🤝 Switch to Verified NGO
            </button>
          </div>
        </div>
      ) : null}

      {/* Recipient Dashboard Statistics Cards (§8) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-stone-200/90 shadow-xs">
          <span className="text-[11px] text-stone-400 uppercase tracking-wider block font-medium">Pending Requests</span>
          <span className="text-2xl font-bold font-mono tabular-nums text-stone-900 mt-1 block">
            {stats?.pendingRequests || 0}
          </span>
          <span className="text-[11px] text-stone-500 mt-0.5 block">Awaiting donor reply</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200/90 shadow-xs">
          <span className="text-[11px] text-stone-400 uppercase tracking-wider block font-medium">Accepted Requests</span>
          <span className="text-2xl font-bold font-mono tabular-nums text-emerald-800 mt-1 block">
            {stats?.acceptedRequests || 0}
          </span>
          <span className="text-[11px] text-stone-500 mt-0.5 block">Approved by donor</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200/90 shadow-xs">
          <span className="text-[11px] text-stone-400 uppercase tracking-wider block font-medium">Upcoming Pickups</span>
          <span className="text-2xl font-bold font-mono tabular-nums text-amber-700 mt-1 block">
            {activePickups.length}
          </span>
          <span className="text-[11px] text-stone-500 mt-0.5 block">Scheduled collections</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200/90 shadow-xs">
          <span className="text-[11px] text-stone-400 uppercase tracking-wider block font-medium">Completed Donations</span>
          <span className="text-2xl font-bold font-mono tabular-nums text-stone-900 mt-1 block">
            {stats?.completedDonations || 0}
          </span>
          <span className="text-[11px] text-stone-500 mt-0.5 block">Dual confirmed</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200/90 shadow-xs">
          <span className="text-[11px] text-stone-400 uppercase tracking-wider block font-medium">Food Quantity Received</span>
          <span className="text-2xl font-bold font-mono tabular-nums text-stone-900 mt-1 block">
            {stats?.totalQuantityReceived || 0}
          </span>
          <span className="text-[11px] text-stone-500 mt-0.5 block">Total units received</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200/90 shadow-xs">
          <span className="text-[11px] text-stone-400 uppercase tracking-wider block font-medium">Estimated Meals</span>
          <span className="text-2xl font-bold font-mono tabular-nums text-emerald-800 mt-1 block">
            {stats?.estimatedMealsReceived || 0}
          </span>
          <span className="text-[11px] text-stone-500 mt-0.5 block">Served to community</span>
        </div>
      </div>

      {/* Active Scheduled Pickups */}
      {activePickups.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-stone-900">Upcoming Pickups Awaiting Collection</h2>
              <p className="text-xs text-stone-500">Show the pickup reference code to kitchen dispatch staff upon arrival.</p>
            </div>
            <Link to="/recipient/pickups" className="text-xs font-semibold text-emerald-800 hover:underline">
              View Tracking
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activePickups.map((pickup) => (
              <div key={pickup.id} className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900 text-sm">{pickup.listing?.foodName}</span>
                  <span className="font-mono font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded">
                    Code: {pickup.pickupReference || 'FB-CODE'}
                  </span>
                </div>
                <div className="text-stone-600">
                  Donor: <strong>{pickup.donorOrganization?.organizationName || 'Donor'}</strong>
                </div>
                <div className="text-stone-600 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  <span>{pickup.listing?.pickupLocation}</span>
                </div>
                <div className="text-stone-600 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-stone-400" />
                  <span>Window: {pickup.pickupWindow}</span>
                </div>
                <div className="pt-2 flex justify-end">
                  <Link
                    to="/recipient/pickups"
                    className="px-3 py-1.5 bg-emerald-800 text-white rounded-lg font-semibold text-xs hover:bg-emerald-700"
                  >
                    Confirm Collection Handover
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Surplus Food Near You */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-stone-900">Recommended Surplus Food Near You</h2>
            <p className="text-xs text-stone-500">Fresh batches ready for collection in Hyderabad</p>
          </div>
          <Link to="/browse" className="text-xs font-semibold text-emerald-800 hover:underline flex items-center gap-1">
            <span>Browse All Available</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendedFood.map((listing) => (
            <FoodCard
              key={listing.id}
              listing={listing}
              onViewDetails={(l) => setSelectedListing(l)}
              onRequest={(l) => setSelectedListing(l)}
            />
          ))}
        </div>
      </div>

      {/* Details / Request Modal */}
      {selectedListing && (
        <FoodDetailsModal
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          onRequestSubmitted={() => {
            loadData();
          }}
        />
      )}
    </div>
  );
};
