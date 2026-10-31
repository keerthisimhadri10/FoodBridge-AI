import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { FoodListing, DonationRequest, MatchScoreResult } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  PlusCircle,
  Sparkles,
  Utensils,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Package,
  Layers,
  ArrowRight,
  ShieldCheck,
  Building2,
} from 'lucide-react';

export const DonorDashboard: React.FC = () => {
  const { user, organization } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<any>(null);
  const [activeListings, setActiveListings] = useState<FoodListing[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<DonationRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // AI Matching state
  const [selectedListingForMatch, setSelectedListingForMatch] = useState<FoodListing | null>(null);
  const [matchingResults, setMatchingResults] = useState<MatchScoreResult[]>([]);
  const [isMatching, setIsMatching] = useState<boolean>(false);

  // Accept / Reject feedback
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [analyticsData, listingsData, requestsData] = await Promise.all([
        api.getDonorAnalytics(),
        api.getListings({ donorId: organization?.id }),
        api.getRequests(),
      ]);

      setStats(analyticsData);
      setActiveListings(listingsData);
      setIncomingRequests(requestsData);

      if (listingsData.length > 0 && !selectedListingForMatch) {
        setSelectedListingForMatch(listingsData[0]);
      }
    } catch (err) {
      console.error('Failed to load donor dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [organization?.id]);

  const handleRunAIMatch = async (listing: FoodListing) => {
    setSelectedListingForMatch(listing);
    setIsMatching(true);
    try {
      const data = await api.matchListing(listing.id);
      setMatchingResults(data.matches);
    } catch (err: any) {
      setActionError(err.message || 'AI matching failed.');
    } finally {
      setIsMatching(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await api.acceptRequest(requestId);
      setActionSuccess(`Request accepted! Inventory reserved. Pickup Reference: ${res.pickup.pickupReference}`);
      await loadDashboardData();
    } catch (err: any) {
      setActionError(err.message || 'Could not accept request.');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setActionError(null);
    setActionSuccess(null);
    const reason = prompt('Please provide a reason for rejecting this request (optional):') || undefined;
    try {
      await api.rejectRequest(requestId, reason);
      setActionSuccess('Request rejected. Available inventory remains untouched.');
      await loadDashboardData();
    } catch (err: any) {
      setActionError(err.message || 'Could not reject request.');
    }
  };

  if (isLoading && !stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center text-xs text-stone-500">
        Loading donor kitchen statistics and incoming requests...
      </div>
    );
  }

  const pendingRequests = incomingRequests.filter((r) => r.requestStatus === 'PENDING');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-emerald-950 text-white p-6 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-900/80 rounded text-[11px] font-semibold text-emerald-300">
            <Building2 className="w-3.5 h-3.5" />
            <span>Food Donor Portal · {organization?.organizationType || 'Restaurant'}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {organization?.organizationName || 'Donor Kitchen'}
          </h1>
          <p className="text-xs text-stone-300 max-w-xl">
            Manage surplus food listings, review incoming NGO requests, coordinate pickup times, and view completed redistribution records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/donor/create"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Food Listing</span>
          </Link>
        </div>
      </div>

      {/* Action Alerts */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-700" />
            <span className="font-semibold">{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-stone-400 hover:text-stone-600 text-xs">
            ✕
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-700" />
            <span className="font-semibold">{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-stone-400 hover:text-stone-600 text-xs">
            ✕
          </button>
        </div>
      )}

      {/* 9 Dashboard Statistics Cards (Strictly calculated from database records per §6) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-stone-200/90 shadow-xs">
          <span className="text-[11px] text-stone-400 uppercase tracking-wider block font-medium">Total Listings</span>
          <span className="text-2xl font-bold font-mono tabular-nums text-stone-900 mt-1 block">
            {stats?.totalListings || 0}
          </span>
          <span className="text-[11px] text-stone-500 mt-0.5 block">Lifetime published</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200/90 shadow-xs">
          <span className="text-[11px] text-stone-400 uppercase tracking-wider block font-medium">Active Listings</span>
          <span className="text-2xl font-bold font-mono tabular-nums text-emerald-800 mt-1 block">
            {stats?.activeListings || 0}
          </span>
          <span className="text-[11px] text-stone-500 mt-0.5 block">Available or partial</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200/90 shadow-xs">
          <span className="text-[11px] text-stone-400 uppercase tracking-wider block font-medium">Available Quantity</span>
          <span className="text-2xl font-bold font-mono tabular-nums text-stone-900 mt-1 block">
            {stats?.availableQuantity || 0}
          </span>
          <span className="text-[11px] text-stone-500 mt-0.5 block">Units open for request</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200/90 shadow-xs">
          <span className="text-[11px] text-stone-400 uppercase tracking-wider block font-medium">Reserved Quantity</span>
          <span className="text-2xl font-bold font-mono tabular-nums text-amber-700 mt-1 block">
            {stats?.reservedQuantity || 0}
          </span>
          <span className="text-[11px] text-stone-500 mt-0.5 block">Awaiting collection</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200/90 shadow-xs">
          <span className="text-[11px] text-stone-400 uppercase tracking-wider block font-medium">Pending Requests</span>
          <span className="text-2xl font-bold font-mono tabular-nums text-stone-900 mt-1 block">
            {stats?.pendingRequests || 0}
          </span>
          <span className="text-[11px] text-stone-500 mt-0.5 block">Awaiting your approval</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200/90 shadow-xs">
          <span className="text-[11px] text-stone-400 uppercase tracking-wider block font-medium">Accepted Requests</span>
          <span className="text-2xl font-bold font-mono tabular-nums text-stone-900 mt-1 block">
            {stats?.acceptedRequests || 0}
          </span>
          <span className="text-[11px] text-stone-500 mt-0.5 block">Pickup scheduled</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200/90 shadow-xs">
          <span className="text-[11px] text-stone-400 uppercase tracking-wider block font-medium">Completed Donations</span>
          <span className="text-2xl font-bold font-mono tabular-nums text-emerald-800 mt-1 block">
            {stats?.completedDonations || 0}
          </span>
          <span className="text-[11px] text-stone-500 mt-0.5 block">Dual confirmed</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200/90 shadow-xs">
          <span className="text-[11px] text-stone-400 uppercase tracking-wider block font-medium">Rejected / Cancelled</span>
          <span className="text-2xl font-bold font-mono tabular-nums text-stone-500 mt-1 block">
            {stats?.rejectedOrCancelled || 0}
          </span>
          <span className="text-[11px] text-stone-500 mt-0.5 block">Restored to stock</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200/90 shadow-xs sm:col-span-2">
          <span className="text-[11px] text-stone-400 uppercase tracking-wider block font-medium">Est. Meals Redistributed</span>
          <span className="text-2xl font-bold font-mono tabular-nums text-emerald-800 mt-1 block">
            {stats?.estimatedMealsRedistributed || 0} <span className="text-xs font-normal text-stone-500">meals</span>
          </span>
          <span className="text-[11px] text-stone-500 mt-0.5 block">Based on completed handovers</span>
        </div>
      </div>

      {/* Main Grid: Incoming Requests & Active Listings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Incoming Requests (8 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-stone-900">Incoming Donation Requests</h2>
                <p className="text-xs text-stone-500">Requests submitted by verified recipient organizations</p>
              </div>
              <Link to="/donor/requests" className="text-xs font-semibold text-emerald-800 hover:underline">
                View All ({incomingRequests.length})
              </Link>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-400 border border-dashed border-stone-200 rounded-xl">
                No pending requests awaiting your approval right now.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 bg-stone-50 rounded-xl border border-stone-200/80 space-y-3 text-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-stone-900 text-sm">
                          {req.recipientOrganization?.organizationName || 'Recipient NGO'}
                        </div>
                        <div className="text-stone-500 mt-0.5">
                          Requested: <strong className="text-stone-900">{req.requestedQuantity}</strong> units of{' '}
                          <span className="text-emerald-800 font-semibold">{req.listing?.foodName}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-900 font-semibold rounded text-[11px]">
                        Pending Review
                      </span>
                    </div>

                    <div className="p-2.5 bg-white rounded-lg border border-stone-200 text-stone-600">
                      <div><strong>Pickup Window:</strong> {req.pickupWindow}</div>
                      {req.notes && <div className="mt-1"><strong>NGO Note:</strong> {req.notes}</div>}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleRejectRequest(req.id)}
                        className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-700 font-semibold rounded-lg text-xs transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleAcceptRequest(req.id)}
                        className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-xs"
                      >
                        Accept & Reserve Quantity
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Listings Overview with Inventory Equation */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-stone-900">Active Surplus Food Listings</h2>
                <p className="text-xs text-stone-500">Live inventory equation: Total = Available + Reserved + Collected</p>
              </div>
              <Link to="/donor/listings" className="text-xs font-semibold text-emerald-800 hover:underline">
                Manage ({activeListings.length})
              </Link>
            </div>

            <div className="space-y-3">
              {activeListings.slice(0, 4).map((listing) => {
                const availPct = Math.round((listing.availableQuantity / listing.totalQuantity) * 100);
                const resPct = Math.round((listing.reservedQuantity / listing.totalQuantity) * 100);
                const colPct = Math.round((listing.collectedQuantity / listing.totalQuantity) * 100);

                return (
                  <div key={listing.id} className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-900">{listing.foodName}</span>
                      <span className="font-mono text-stone-500">
                        {listing.totalQuantity} {listing.unit.replace('_', ' ').toLowerCase()} total
                      </span>
                    </div>

                    {/* Inventory Equation Visual Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-stone-200 overflow-hidden flex">
                      <div style={{ width: `${availPct}%` }} className="bg-emerald-600" title={`Available: ${listing.availableQuantity}`} />
                      <div style={{ width: `${resPct}%` }} className="bg-amber-500" title={`Reserved: ${listing.reservedQuantity}`} />
                      <div style={{ width: `${colPct}%` }} className="bg-blue-600" title={`Collected: ${listing.collectedQuantity}`} />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-stone-500">
                      <span>Available: <strong className="text-emerald-700">{listing.availableQuantity}</strong></span>
                      <span>Reserved: <strong className="text-amber-700">{listing.reservedQuantity}</strong></span>
                      <span>Collected: <strong className="text-blue-700">{listing.collectedQuantity}</strong></span>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-stone-200/60">
                      <button
                        onClick={() => handleRunAIMatch(listing)}
                        className="text-xs font-semibold text-emerald-800 hover:underline flex items-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Run AI Match Engine
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: AI Smart Matching Assistant (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">Intelligent Matching Engine</h3>
                <p className="text-xs text-stone-500">Scored against accredited NGOs in Hyderabad</p>
              </div>
            </div>

            {selectedListingForMatch ? (
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                <div className="text-stone-500 text-[11px] uppercase tracking-wider font-semibold">Active Listing</div>
                <div className="font-bold text-stone-900 mt-0.5">{selectedListingForMatch.foodName}</div>
                <div className="text-stone-600 mt-0.5">
                  {selectedListingForMatch.availableQuantity} {selectedListingForMatch.unit.replace('_', ' ').toLowerCase()} available · {selectedListingForMatch.category}
                </div>
              </div>
            ) : (
              <div className="text-xs text-stone-400">Select a listing to compute matching scores.</div>
            )}

            <button
              onClick={() => selectedListingForMatch && handleRunAIMatch(selectedListingForMatch)}
              disabled={!selectedListingForMatch || isMatching}
              className="w-full py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isMatching ? 'Calculating AI Weighted Compatibility...' : 'Find Compatible Shelters'}</span>
            </button>

            {/* Match Criteria Transparency (§12.A) */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 text-[11px] text-stone-600 space-y-1">
              <span className="font-bold text-stone-800 block">Weighted Matching Formula:</span>
              <div className="grid grid-cols-2 gap-1 text-[11px]">
                <span>· Distance: 30%</span>
                <span>· Quantity Fit: 25%</span>
                <span>· Dietary Compatibility: 20%</span>
                <span>· Pickup Availability: 25%</span>
              </div>
            </div>

            {/* Results */}
            <div className="space-y-3 pt-2">
              {matchingResults.map((match) => (
                <div key={match.organizationId} className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-900">{match.organizationName}</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-emerald-100 text-emerald-900">
                      {match.totalScore}% Match
                    </span>
                  </div>

                  <div className="text-[11px] text-stone-500">
                    📍 {match.distanceKm} km away · {match.address}
                  </div>

                  <ul className="text-[11px] text-stone-600 space-y-1 list-disc list-inside">
                    {match.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>

                  {match.aiExplanation && (
                    <div className="p-2 bg-emerald-50 rounded-lg text-[11px] text-emerald-950 italic border border-emerald-200/60">
                      "{match.aiExplanation}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
