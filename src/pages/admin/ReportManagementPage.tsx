import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Report } from '../../types';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export const ReportManagementPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAdminReports();
      setReports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleResolve = async (id: string, status: 'RESOLVED' | 'DISMISSED') => {
    const details = prompt(`Enter resolution notes for marking report ${status}:`, 'Verified food hygiene inspection protocol with kitchen manager.') || undefined;
    setFeedback(null);
    try {
      await api.resolveReport(id, status, details);
      setFeedback({ type: 'success', message: `Report marked as ${status}.` });
      await loadReports();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Action failed.' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Food Quality & Safety Reports</h1>
        <p className="text-xs text-stone-600 mt-1">Review concerns raised by recipients regarding listings or pickup handling.</p>
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
          {[1, 2].map((i) => (
            <div key={i} className="h-28 bg-stone-200/70 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-stone-200 text-xs text-stone-500">
          No reports currently on file. Platform compliance is clean!
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((rep) => (
            <div
              key={rep.id}
              className="bg-white p-5 rounded-xl border border-stone-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-900 text-sm">{rep.reason}</span>
                  <span className="text-stone-400">·</span>
                  <span className="text-stone-600 font-medium">Listing: {rep.listingName}</span>
                </div>

                <p className="text-stone-600 bg-stone-50 p-3 rounded-lg leading-relaxed">
                  "{rep.description}"
                </p>

                {rep.resolutionDetails && (
                  <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-950 font-medium">
                    <strong>Admin Resolution:</strong> {rep.resolutionDetails}
                  </div>
                )}

                <div className="text-stone-400 font-mono text-[11px]">
                  Reported: {new Date(rep.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0">
                <span
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                    rep.reportStatus === 'PENDING'
                      ? 'bg-amber-100 text-amber-900'
                      : rep.reportStatus === 'RESOLVED'
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  {rep.reportStatus}
                </span>

                {rep.reportStatus === 'PENDING' && (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleResolve(rep.id, 'RESOLVED')}
                      className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs"
                    >
                      Resolve
                    </button>
                    <button
                      onClick={() => handleResolve(rep.id, 'DISMISSED')}
                      className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-lg text-xs"
                    >
                      Dismiss
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
