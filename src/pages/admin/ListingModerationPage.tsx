import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { FoodListing } from '../../types';
import { Trash2, AlertCircle, Clock, Building2 } from 'lucide-react';

export const ListingModerationPage: React.FC = () => {
  const [listings, setListings] = useState<FoodListing[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadListings = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAdminListings();
      setListings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  const handleRemove = async (id: string, name: string) => {
    if (!window.confirm(`Moderate and remove listing "${name}"?`)) return;
    setFeedback(null);
    try {
      await api.removeAdminListing(id);
      setFeedback({ type: 'success', message: `Listing "${name}" removed by administration.` });
      await loadListings();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to remove listing.' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Listing Moderation</h1>
        <p className="text-xs text-stone-600 mt-1">Audit active and historic food donation listings across all donors.</p>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-stone-400 hover:text-stone-600">✕</button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-stone-200/70 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((l) => (
            <div
              key={l.id}
              className="bg-white p-5 rounded-xl border border-stone-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
            >
              <div className="flex items-start gap-4">
                <img
                  src={l.imageUrl}
                  alt={l.foodName}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-lg object-cover shrink-0"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900 text-sm">{l.foodName}</span>
                    <span className="text-stone-400">·</span>
                    <span className="text-emerald-800 font-medium">{l.category.replace('_', ' ')}</span>
                  </div>
                  <div className="text-stone-600">
                    Donor: <strong>{l.donorOrganizationName || 'Donor'}</strong> · {l.availableQuantity} of {l.totalQuantity} {l.unit.toLowerCase()} available
                  </div>
                  <div className="text-stone-400 font-mono text-[11px]">
                    Deadline: {new Date(l.collectionDeadline).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                    l.listingStatus === 'AVAILABLE'
                      ? 'bg-emerald-100 text-emerald-900'
                      : l.listingStatus === 'PARTIALLY_RESERVED'
                      ? 'bg-amber-100 text-amber-900'
                      : l.listingStatus === 'COMPLETED'
                      ? 'bg-blue-100 text-blue-900'
                      : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  {l.listingStatus.replace('_', ' ')}
                </span>

                {l.listingStatus !== 'REMOVED' && (
                  <button
                    onClick={() => handleRemove(l.id, l.foodName)}
                    className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Moderate / Remove listing"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
