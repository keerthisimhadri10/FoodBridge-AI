import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { DonationRequest } from '../../types';
import { Clock, MapPin, CheckCircle, ShieldCheck, Truck } from 'lucide-react';

export const PickupTrackingPage: React.FC = () => {
  const [requests, setRequests] = useState<DonationRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadPickups = async () => {
    setIsLoading(true);
    try {
      const data = await api.getRequests();
      setRequests(data.filter((r) => r.requestStatus === 'ACCEPTED' || r.requestStatus === 'COLLECTED'));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPickups();
  }, []);

  const handleConfirmReceipt = async (requestId: string) => {
    setFeedback(null);
    try {
      const res = await api.confirmPickup(requestId, 'Volunteer driver confirmed receipt of undamaged food batch.');
      setFeedback({
        type: 'success',
        message: res.message,
      });
      await loadPickups();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to confirm receipt.' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Pickup Tracking & Collection</h1>
        <p className="text-xs text-stone-600 mt-1">
          Coordinate physical food collection with donor dispatch staff and confirm received handovers.
        </p>
      </div>

      {/* Protocol Banner */}
      <div className="p-4 bg-emerald-50/70 border border-emerald-200/90 rounded-xl text-xs text-emerald-950 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div>
          <strong className="text-stone-900">Pickup Protocol:</strong> Present your Pickup Reference Code to the donor kitchen staff on arrival. Once the food containers are inspected and loaded into your vehicle, tap "Confirm Food Received" below.
        </div>
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
          <button onClick={() => setFeedback(null)} className="text-stone-400 hover:text-stone-600">
            ✕
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-stone-200/70 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-stone-200 text-xs text-stone-500">
          No scheduled pickups pending collection right now.
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-white p-5 rounded-xl border border-stone-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 text-xs flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-900 text-sm">{req.listing?.foodName}</span>
                  <span className="text-stone-400">·</span>
                  <span className="font-mono text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                    Code: {req.pickupReference || 'FB-REF'}
                  </span>
                </div>

                <div className="text-stone-700">
                  Donor Organization:{' '}
                  <strong className="text-stone-900">{req.donorOrganization?.organizationName || 'Donor'}</strong>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-stone-50 rounded-lg text-stone-600">
                  <div><strong>Quantity to Collect:</strong> {req.requestedQuantity} units</div>
                  <div><strong>Pickup Window:</strong> {req.pickupWindow}</div>
                  <div className="sm:col-span-2">
                    <strong>Dispatch Bay Address:</strong> {req.listing?.pickupLocation}
                  </div>
                  <div>
                    <strong>Your Confirmation:</strong>{' '}
                    {req.recipientConfirmed ? (
                      <span className="text-emerald-700 font-semibold">✓ Confirmed by you</span>
                    ) : (
                      <span className="text-amber-700 font-semibold">⏳ Awaiting your confirmation</span>
                    )}
                  </div>
                  <div>
                    <strong>Donor Confirmation:</strong>{' '}
                    {req.donorConfirmed ? (
                      <span className="text-emerald-700 font-semibold">✓ Confirmed by donor</span>
                    ) : (
                      <span className="text-stone-500">Awaiting donor check-off</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex flex-col items-end gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0">
                {!req.recipientConfirmed ? (
                  <button
                    onClick={() => handleConfirmReceipt(req.id)}
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Confirm Food Received</span>
                  </button>
                ) : (
                  <div className="text-right">
                    <span className="text-emerald-700 font-semibold text-xs flex items-center gap-1 justify-end">
                      <CheckCircle className="w-3.5 h-3.5" /> Receipt Confirmed
                    </span>
                    <span className="text-[11px] text-stone-400 block mt-0.5">
                      {req.donorConfirmed ? 'Donation Completed' : 'Awaiting donor confirmation'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
