import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Organization } from '../../types';
import { ShieldCheck, ShieldAlert, CheckCircle, XCircle, Building2, MapPin, Phone } from 'lucide-react';

export const VerificationsPage: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadOrgs = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAdminVerifications();
      setOrganizations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrgs();
  }, []);

  const handleVerify = async (id: string, name: string) => {
    setFeedback(null);
    const reason = prompt(`Approve verification for "${name}"? Enter optional notes:`, '12A/80G NGO certification and physical shelter kitchen inspection verified.') || undefined;
    try {
      await api.verifyOrganization(id, reason);
      setFeedback({ type: 'success', message: `Organization "${name}" successfully VERIFIED. They can now request food.` });
      await loadOrgs();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Verification failed.' });
    }
  };

  const handleReject = async (id: string, name: string) => {
    setFeedback(null);
    const reason = prompt(`Reject verification for "${name}". Enter reason for documentation:`, 'Incomplete documentation or unverified contact location.') || undefined;
    try {
      await api.rejectOrganization(id, reason);
      setFeedback({ type: 'success', message: `Organization "${name}" marked as REJECTED.` });
      await loadOrgs();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Rejection failed.' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Recipient Organization Verifications</h1>
        <p className="text-xs text-stone-600 mt-1">
          Review charitable recipient applications. Only admin-approved organizations can request food donations.
        </p>
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
      ) : organizations.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-stone-200 text-xs text-stone-500">
          No recipient organizations registered.
        </div>
      ) : (
        <div className="space-y-4">
          {organizations.map((org) => {
            const isVerified = org.verificationStatus === 'VERIFIED';
            const isPending = org.verificationStatus === 'PENDING';

            return (
              <div
                key={org.id}
                className="bg-white p-5 rounded-xl border border-stone-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900 text-sm">{org.organizationName}</span>
                    <span className="text-stone-400">·</span>
                    <span className="text-emerald-800 font-semibold">{org.organizationType.replace('_', ' ')}</span>
                  </div>

                  <p className="text-stone-600 leading-relaxed">{org.description}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-stone-50 rounded-lg text-stone-600">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="line-clamp-1">{org.address}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>{org.contactDetails?.phone} ({org.contactDetails?.contactPerson})</span>
                    </div>
                    <div>
                      <strong>Capacity:</strong> {org.capacityMeals || 50} meals/batch
                    </div>
                  </div>
                </div>

                {/* Verification Actions */}
                <div className="flex flex-col items-end gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0">
                  <span
                    className={`px-3 py-1 font-bold rounded-lg font-mono text-[11px] ${
                      isVerified
                        ? 'bg-emerald-100 text-emerald-900'
                        : isPending
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-rose-100 text-rose-900'
                    }`}
                  >
                    {org.verificationStatus}
                  </span>

                  <div className="flex items-center gap-2 pt-1">
                    {!isVerified && (
                      <button
                        onClick={() => handleVerify(org.id, org.organizationName)}
                        className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-xs"
                      >
                        Approve & Verify
                      </button>
                    )}
                    {isPending && (
                      <button
                        onClick={() => handleReject(org.id, org.organizationName)}
                        className="px-3 py-1.5 bg-stone-100 hover:bg-rose-100 hover:text-rose-800 text-stone-700 font-semibold rounded-lg text-xs transition-colors"
                      >
                        Reject
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
