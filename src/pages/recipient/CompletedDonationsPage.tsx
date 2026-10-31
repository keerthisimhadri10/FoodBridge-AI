import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { DonationRequest } from '../../types';
import { CheckCircle2, Award, Calendar } from 'lucide-react';

export const CompletedDonationsPage: React.FC = () => {
  const [completed, setCompleted] = useState<DonationRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const data = await api.getRequests({ status: 'COMPLETED' });
        setCompleted(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const totalUnits = completed.reduce((sum, r) => sum + r.requestedQuantity, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Completed Food Receipts</h1>
          <p className="text-xs text-stone-600 mt-1">
            Verified food redistribution handovers received and distributed to community beneficiaries.
          </p>
        </div>

        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs flex items-center gap-3">
          <Award className="w-5 h-5 text-emerald-700" />
          <div>
            <span className="text-stone-500 block">Total Units Received</span>
            <span className="text-lg font-bold text-emerald-900 font-mono tabular-nums">
              {totalUnits} <span className="text-xs font-normal">units</span>
            </span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 bg-stone-200/70 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : completed.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-stone-200 text-xs text-stone-500">
          No completed donation records yet. Completed collections will be permanently recorded here.
        </div>
      ) : (
        <div className="space-y-4">
          {completed.map((req) => (
            <div
              key={req.id}
              className="bg-white p-5 rounded-xl border border-stone-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-900 text-sm">{req.listing?.foodName}</span>
                  <span className="text-stone-400">·</span>
                  <span className="font-mono text-emerald-800 font-semibold">{req.pickupReference}</span>
                </div>

                <div className="text-stone-600">
                  Received from{' '}
                  <strong className="text-stone-900">{req.donorOrganization?.organizationName || 'Donor'}</strong> ·{' '}
                  <span className="font-mono font-bold text-stone-900">{req.requestedQuantity}</span>{' '}
                  {req.listing?.unit?.replace('_', ' ').toLowerCase()}
                </div>

                {req.notes && <div className="text-stone-500 italic">"{req.notes}"</div>}

                <div className="text-stone-400 font-mono text-[11px] pt-1">
                  Completed on: {new Date(req.updatedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-lg shrink-0">
                <CheckCircle2 className="w-4 h-4" />
                <span>Verified Handover</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
