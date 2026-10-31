import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { DonationRequest } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Clock, MapPin, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';

export const PickupManagementPage: React.FC = () => {
  const [requests, setRequests] = useState<DonationRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadPickups = async () => {
    setIsLoading(true);
    try {
      const data = await api.getRequests();
      // Show accepted or collected requests
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

  const handleConfirmPickup = async (requestId: string) => {
    setFeedback(null);
    try {
      const res = await api.confirmPickup(requestId, 'Kitchen staff verified volunteer ID and handed over food containers.');
      setFeedback({
        type: 'success',
        message: res.message,
      });
      await loadPickups();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to confirm pickup.' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Pickup Coordination & Dispatch</h1>
        <p className="text-xs text-stone-600 mt-1">
          Coordinate scheduled collections with recipient transport teams and record handover confirmations.
        </p>
      </div>

      {/* Dual Confirmation Notice (§10) */}
      <div className="p-4 bg-emerald-50/70 border border-emerald-200/90 rounded-xl text-xs text-emerald-950 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div>
          <strong className="text-stone-900">Dual Independent Confirmation Protocol:</strong> Both donor and recipient must confirm collection independently. Once one side confirms, status updates to COLLECTED. When both parties verify, the donation is finalized as COMPLETED and recorded in impact history.
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
          No pickups currently scheduled. When you accept an incoming donation request, it will appear here.
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
                  <span className="font-mono text-emerald-800 font-bold">
                    Ref Code: {req.pickupReference || 'PENDING-CODE'}
                  </span>
                </div>

                <div className="text-stone-700">
                  Recipient Organization:{' '}
                  <strong className="text-stone-900">
                    {req.recipientOrganization?.organizationName || 'Recipient NGO'}
                  </strong>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-stone-50 rounded-lg text-stone-600">
                  <div><strong>Quantity to Hand Over:</strong> {req.requestedQuantity} units</div>
                  <div><strong>Pickup Window:</strong> {req.pickupWindow}</div>
                  <div><strong>Dispatch Location:</strong> {req.listing?.pickupLocation}</div>
                  <div>
                    <strong>Confirmation Status:</strong>{' '}
                    {req.donorConfirmed ? (
                      <span className="text-emerald-700 font-semibold">✓ Confirmed by you</span>
                    ) : (
                      <span className="text-amber-700 font-semibold">⏳ Awaiting your confirmation</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="flex flex-col items-end gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0">
                {!req.donorConfirmed ? (
                  <button
                    onClick={() => handleConfirmPickup(req.id)}
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs shadow-xs transition-colors"
                  >
                    Confirm Food Handover
                  </button>
                ) : (
                  <div className="text-right">
                    <span className="text-emerald-700 font-semibold text-xs flex items-center gap-1 justify-end">
                      <CheckCircle className="w-3.5 h-3.5" /> Handover Confirmed
                    </span>
                    <span className="text-[11px] text-stone-400 block mt-0.5">
                      {req.recipientConfirmed ? 'Both confirmed' : 'Awaiting NGO verification'}
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
