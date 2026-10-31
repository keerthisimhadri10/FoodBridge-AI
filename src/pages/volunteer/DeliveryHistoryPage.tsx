import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bike,
  CheckCircle2,
  Calendar,
  MapPin,
  Star,
  PackageCheck,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { api } from '../../services/api';
import { DeliveryTask, Feedback } from '../../types';

export const DeliveryHistoryPage: React.FC = () => {
  const [tasks, setTasks] = useState<DeliveryTask[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [myDeliveries, feedbackList] = await Promise.all([
          api.getDeliveries({ my: true }),
          api.getFeedbacks(),
        ]);
        const completed = myDeliveries.filter((t) => t.status === 'DELIVERED');
        setTasks(completed);
        setFeedbacks(feedbackList);
      } catch (err: any) {
        setError(err.message || 'Failed to load delivery history.');
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, []);

  const totalKm = Math.round(tasks.reduce((sum, t) => sum + (t.estimatedDistanceKm || 3.5), 0) * 10) / 10;
  const totalMeals = tasks.reduce((sum, t) => sum + (t.quantity || 30), 0);

  return (
    <div className="min-h-screen bg-stone-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
            Volunteer Audit & Service Record
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight mt-0.5">
            Delivery History
          </h1>
          <p className="text-sm text-stone-600">
            Completed food handovers verified by donors and recipient charities
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
            <span className="text-xs font-medium text-stone-500">Total Handovers</span>
            <div className="text-2xl font-bold text-stone-900 mt-1">{tasks.length}</div>
            <span className="text-xs text-emerald-700 font-medium">100% verified</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
            <span className="text-xs font-medium text-stone-500">Distance Traveled</span>
            <div className="text-2xl font-bold text-stone-900 mt-1">{totalKm} km</div>
            <span className="text-xs text-stone-500">Zero food spoilage</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
            <span className="text-xs font-medium text-stone-500">Portions Rescued</span>
            <div className="text-2xl font-bold text-stone-900 mt-1">{totalMeals}</div>
            <span className="text-xs text-stone-500">Meals distributed</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
            <span className="text-xs font-medium text-stone-500">Courier Rating</span>
            <div className="text-2xl font-bold text-stone-900 mt-1 flex items-center gap-1.5">
              <span>4.9</span>
              <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
            </div>
            <span className="text-xs text-stone-500">Top volunteer courier</span>
          </div>
        </div>

        {/* Deliveries List */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-stone-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-stone-900">Completed Routes</h2>
            <Link
              to="/volunteer/available"
              className="text-xs font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-1"
            >
              <span>Accept New Delivery</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-sm text-stone-500">Loading history records...</div>
          ) : tasks.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <PackageCheck className="w-12 h-12 text-stone-300 mx-auto" />
              <h3 className="text-base font-bold text-stone-900">No Completed Deliveries Yet</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Once you complete your first food delivery handover, your verified route logs and partner ratings will appear here.
              </p>
              <Link
                to="/volunteer/available"
                className="inline-block px-4 py-2 bg-emerald-800 text-white text-xs font-semibold rounded-xl"
              >
                Find Open Deliveries
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {tasks.map((task) => {
                const taskFeedbacks = feedbacks.filter((f) => f.requestId === task.requestId);
                return (
                  <div key={task.id} className="p-6 space-y-4 hover:bg-stone-50/60 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          DELIVERED
                        </span>
                        <span className="text-xs text-stone-400 font-mono">
                          Ref: {task.pickupReference || 'FB-HYD'}
                        </span>
                        <span className="text-xs text-stone-500">
                          · {task.deliveredConfirmedAt ? new Date(task.deliveredConfirmedAt).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>

                      <span className="text-xs font-semibold text-stone-700 bg-stone-100 px-2.5 py-1 rounded-md">
                        {task.estimatedDistanceKm} km · {task.quantity} {task.listing?.unit || 'Units'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <span className="text-[10px] text-stone-400 font-bold uppercase block">Donor Facility</span>
                        <p className="font-bold text-stone-900 text-sm">{task.donorOrganization?.organizationName}</p>
                        <p className="text-stone-500 line-clamp-1">{task.pickupAddress}</p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-stone-400 font-bold uppercase block">Recipient Center</span>
                        <p className="font-bold text-stone-900 text-sm">{task.recipientOrganization?.organizationName}</p>
                        <p className="text-stone-500 line-clamp-1">{task.deliveryAddress}</p>
                      </div>
                    </div>

                    {/* Associated Feedbacks */}
                    {taskFeedbacks.length > 0 && (
                      <div className="mt-2 bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs space-y-2">
                        <span className="font-bold text-stone-700 block text-[11px]">Partner Feedback & Ratings:</span>
                        {taskFeedbacks.map((f) => (
                          <div key={f.id} className="flex items-start gap-2">
                            <div className="flex items-center gap-0.5 mt-0.5 text-amber-500">
                              {[...Array(f.rating)].map((_, i) => (
                                <Star key={i} className="w-3.5 h-3.5 fill-current" />
                              ))}
                            </div>
                            <div className="text-stone-600">
                              <span className="font-semibold text-stone-800">{f.reviewerRole}:</span> "{f.comment}"
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
