import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { DonationRequest } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle, XCircle, Clock, AlertCircle, Phone, User, Calendar } from 'lucide-react';

export const IncomingRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<DonationRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const data = await api.getRequests();
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleAccept = async (id: string) => {
    setFeedback(null);
    try {
      const res = await api.acceptRequest(id);
      setFeedback({
        type: 'success',
        message: `Request accepted! Reserved quantity locked. Pickup Code: ${res.pickup.pickupReference}`,
      });
      await loadRequests();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Could not accept request.' });
    }
  };

  const handleReject = async (id: string) => {
    setFeedback(null);
    const reason = prompt('Reason for rejection (optional):') || undefined;
    try {
      await api.rejectRequest(id, reason);
      setFeedback({ type: 'success', message: 'Request rejected. Inventory restored to available pool.' });
      await loadRequests();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Could not reject request.' });
    }
  };

  const filtered = requests.filter((r) => {
    if (filterStatus === 'ALL') return true;
    return r.requestStatus === filterStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Incoming Donation Requests</h1>
          <p className="text-xs text-stone-600 mt-1">
            Review and approve requests submitted by verified recipient organizations across Hyderabad.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {['ALL', 'PENDING', 'ACCEPTED', 'COMPLETED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterStatus === st
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {st}
            </button>
          ))}
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
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-stone-200/70 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-stone-200 text-xs text-stone-500">
          No donation requests found matching this filter.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((req) => (
            <div
              key={req.id}
              className="bg-white p-5 rounded-xl border border-stone-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 text-xs flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-900 text-sm">
                    {req.recipientOrganization?.organizationName || 'Recipient NGO'}
                  </span>
                  <span className="text-stone-400">·</span>
                  <span className="text-emerald-700 font-medium">
                    Verified {req.recipientOrganization?.organizationType || 'NGO'}
                  </span>
                </div>

                <div className="text-stone-700">
                  Requested <strong className="text-stone-900 font-mono text-sm">{req.requestedQuantity}</strong>{' '}
                  {req.listing?.unit?.replace('_', ' ').toLowerCase()} of{' '}
                  <strong className="text-stone-900">{req.listing?.foodName}</strong>
                </div>

                <div className="p-2.5 bg-stone-50 rounded-lg text-stone-600 space-y-1">
                  <div><strong>Pickup Window:</strong> {req.pickupWindow}</div>
                  {req.notes && <div><strong>Volunteer Notes:</strong> {req.notes}</div>}
                  {req.pickupReference && (
                    <div className="text-emerald-800 font-mono font-bold">
                      Pickup Reference Code: {req.pickupReference}
                    </div>
                  )}
                  {req.rejectionReason && (
                    <div className="text-rose-700"><strong>Rejection Reason:</strong> {req.rejectionReason}</div>
                  )}
                </div>

                <div className="text-stone-400 font-mono text-[11px]">
                  Submitted on: {new Date(req.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex flex-col items-end gap-3 shrink-0 border-t md:border-t-0 pt-3 md:pt-0">
                <span
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                    req.requestStatus === 'PENDING'
                      ? 'bg-amber-100 text-amber-900'
                      : req.requestStatus === 'ACCEPTED'
                      ? 'bg-emerald-100 text-emerald-900'
                      : req.requestStatus === 'COMPLETED'
                      ? 'bg-blue-100 text-blue-900'
                      : req.requestStatus === 'REJECTED'
                      ? 'bg-rose-100 text-rose-900'
                      : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  {req.requestStatus.replace('_', ' ')}
                </span>

                {req.requestStatus === 'PENDING' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReject(req.id)}
                      className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-lg text-xs"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleAccept(req.id)}
                      className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs shadow-xs"
                    >
                      Accept & Reserve
                    </button>
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
