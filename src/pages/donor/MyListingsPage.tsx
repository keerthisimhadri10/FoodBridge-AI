import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { FoodListing } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { PlusCircle, Trash2, Edit3, Clock, AlertCircle, CheckCircle } from 'lucide-react';

export const MyListingsPage: React.FC = () => {
  const { organization } = useAuth();
  const [listings, setListings] = useState<FoodListing[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadListings = async () => {
    setIsLoading(true);
    try {
      const data = await api.getListings({ donorId: organization?.id });
      setListings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, [organization?.id]);

  const handleRemove = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this listing from active redistribution?')) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await api.removeListing(id);
      setSuccessMsg('Listing removed from active distribution.');
      await loadListings();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to remove listing.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">My Surplus Food Listings</h1>
          <p className="text-xs text-stone-600 mt-1">
            Track and manage food offerings published by {organization?.organizationName || 'your organization'}.
          </p>
        </div>
        <Link
          to="/donor/create"
          className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-xs whitespace-nowrap self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Publish New Food</span>
        </Link>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-stone-200/70 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-stone-200 space-y-3">
          <span className="text-4xl">🍲</span>
          <h3 className="text-base font-bold text-stone-900">No Food Listings Yet</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            You haven't published any surplus food offerings. Turn avoidable waste into community meals today!
          </p>
          <Link
            to="/donor/create"
            className="inline-block px-4 py-2 bg-emerald-800 text-white rounded-lg text-xs font-semibold"
          >
            Create Your First Listing
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => {
            const availPct = Math.round((listing.availableQuantity / listing.totalQuantity) * 100);
            const resPct = Math.round((listing.reservedQuantity / listing.totalQuantity) * 100);
            const colPct = Math.round((listing.collectedQuantity / listing.totalQuantity) * 100);

            return (
              <div
                key={listing.id}
                className="bg-white p-5 rounded-xl border border-stone-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={listing.imageUrl}
                    alt={listing.foodName}
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 rounded-lg object-cover shrink-0"
                  />
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2 text-stone-500">
                      <span className="font-semibold text-emerald-800">{listing.category.replace('_', ' ')}</span>
                      <span>·</span>
                      <span>{listing.dietaryType === 'VEGETARIAN' ? '🌱 Veg' : '🍖 Non-Veg'}</span>
                      <span>·</span>
                      <span className="font-mono">{listing.totalQuantity} {listing.unit.replace('_', ' ').toLowerCase()} total</span>
                    </div>

                    <h3 className="text-base font-bold text-stone-900">{listing.foodName}</h3>

                    <div className="text-stone-500 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        Deadline: {new Date(listing.collectionDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
                        {new Date(listing.collectionDeadline).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    {/* Inventory Equation Mini Bar */}
                    <div className="pt-2 flex items-center gap-3">
                      <div className="w-36 h-2 rounded-full bg-stone-200 overflow-hidden flex">
                        <div style={{ width: `${availPct}%` }} className="bg-emerald-600" />
                        <div style={{ width: `${resPct}%` }} className="bg-amber-500" />
                        <div style={{ width: `${colPct}%` }} className="bg-blue-600" />
                      </div>
                      <span className="text-[11px] text-stone-500 font-mono">
                        Avail: {listing.availableQuantity} | Res: {listing.reservedQuantity} | Col: {listing.collectedQuantity}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex md:flex-col items-end justify-between md:justify-center gap-2 border-t md:border-t-0 pt-3 md:pt-0">
                  <span
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                      listing.listingStatus === 'AVAILABLE'
                        ? 'bg-emerald-100 text-emerald-900'
                        : listing.listingStatus === 'PARTIALLY_RESERVED'
                        ? 'bg-amber-100 text-amber-900'
                        : listing.listingStatus === 'FULLY_RESERVED'
                        ? 'bg-purple-100 text-purple-900'
                        : listing.listingStatus === 'COMPLETED'
                        ? 'bg-blue-100 text-blue-900'
                        : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    {listing.listingStatus.replace('_', ' ')}
                  </span>

                  {listing.listingStatus !== 'COMPLETED' && listing.listingStatus !== 'REMOVED' && (
                    <button
                      onClick={() => handleRemove(listing.id)}
                      disabled={listing.reservedQuantity > 0}
                      title={listing.reservedQuantity > 0 ? 'Cannot remove while requests are reserved' : 'Remove listing'}
                      className="text-stone-400 hover:text-rose-600 text-xs flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
