import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bike,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  PackageCheck,
  Filter,
} from 'lucide-react';
import { api } from '../../services/api';
import { DeliveryTask } from '../../types';
import { FoodDonationMap } from '../../components/map/FoodDonationMap';

export const AvailableDeliveriesPage: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<DeliveryTask[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<DeliveryTask | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadTasks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getDeliveries({ status: 'AVAILABLE' });
      setTasks(data);
      if (data.length > 0 && !selectedTask) {
        setSelectedTask(data[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load available deliveries.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleAccept = async (task: DeliveryTask) => {
    setAcceptingId(task.id);
    setError(null);
    try {
      await api.acceptDelivery(task.id);
      setSuccessMsg(`Task accepted! Redirecting to live delivery navigation...`);
      setTimeout(() => {
        navigate(`/volunteer/active/${task.id}`);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Could not accept task.');
      setAcceptingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
            Surplus Food Courier Dispatch
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight mt-0.5">
            Available Delivery Tasks
          </h1>
          <p className="text-sm text-stone-600">
            Accept food transfers between licensed donors and verified NGOs across Hyderabad
          </p>
        </div>

        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm font-medium flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Tasks List (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between text-xs text-stone-500 font-medium px-1">
              <span>{tasks.length} tasks ready for pickup</span>
              <span>Sorted by nearest window</span>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl p-5 border border-stone-200 animate-pulse space-y-3">
                    <div className="h-4 bg-stone-200 rounded w-1/3" />
                    <div className="h-5 bg-stone-200 rounded w-3/4" />
                    <div className="h-10 bg-stone-200 rounded" />
                  </div>
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center">
                <PackageCheck className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-stone-900">No Open Deliveries</h3>
                <p className="text-xs text-stone-500 mt-1">
                  All current donations have already been assigned couriers. Check back when donors post new batches!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => {
                  const isSelected = selectedTask?.id === task.id;
                  return (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className={`bg-white rounded-2xl border p-5 transition-all cursor-pointer shadow-xs ${
                        isSelected
                          ? 'border-emerald-600 ring-2 ring-emerald-600/20 shadow-sm'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                          {task.estimatedDistanceKm} km
                        </span>
                        <span className="text-xs text-stone-400 font-mono">
                          Ref: {task.pickupReference || 'FB-REF'}
                        </span>
                      </div>

                      <h3 className="font-bold text-stone-900 text-base">
                        {task.listing?.foodName || 'Surplus Meal Boxes'}
                      </h3>

                      <p className="text-xs text-stone-500 mt-0.5">
                        Quantity: <strong className="text-stone-700">{task.quantity} {task.listing?.unit || 'Units'}</strong>
                      </p>

                      <div className="mt-3 pt-3 border-t border-stone-100 text-xs text-stone-600 space-y-1.5">
                        <div className="flex items-start gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
                          <span className="truncate">
                            From: <strong className="text-stone-800">{task.donorOrganization?.organizationName}</strong> ({task.pickupAddress})
                          </span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0" />
                          <span className="truncate">
                            To: <strong className="text-stone-800">{task.recipientOrganization?.organizationName}</strong> ({task.deliveryAddress})
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 pt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAccept(task);
                          }}
                          disabled={acceptingId === task.id}
                          className="w-full py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          <Bike className="w-4 h-4" />
                          <span>{acceptingId === task.id ? 'Accepting...' : 'Accept Delivery Task'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Selected Task Details & Route Preview (7 cols) */}
          <div className="lg:col-span-7 space-y-6 sticky top-24">
            {selectedTask ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                      Delivery Task Specification
                    </span>
                    <span className="text-xs font-mono text-stone-500">
                      ID: {selectedTask.id}
                    </span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-stone-900 mt-1">
                    {selectedTask.listing?.foodName || 'Surplus Food Batch'}
                  </h2>
                  <p className="text-sm text-stone-600 mt-1">
                    Pickup window: <strong className="text-stone-800">{selectedTask.pickupWindow}</strong> · Distance: <strong className="text-stone-800">{selectedTask.estimatedDistanceKm} km</strong>
                  </p>
                </div>

                {/* Route Visual Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                      <span>Pickup Facility (Donor)</span>
                    </div>
                    <p className="font-bold text-stone-900 text-sm">
                      {selectedTask.donorOrganization?.organizationName}
                    </p>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      {selectedTask.pickupAddress}
                    </p>
                    {selectedTask.donorOrganization?.phone && (
                      <p className="text-xs text-stone-500 pt-1 font-mono">
                        Contact: {selectedTask.donorOrganization.phone} ({selectedTask.donorOrganization.contactPerson || 'Dispatch'})
                      </p>
                    )}
                  </div>

                  <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800 uppercase">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                      <span>Delivery Facility (Recipient NGO)</span>
                    </div>
                    <p className="font-bold text-stone-900 text-sm">
                      {selectedTask.recipientOrganization?.organizationName}
                    </p>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      {selectedTask.deliveryAddress}
                    </p>
                    {selectedTask.recipientOrganization?.phone && (
                      <p className="text-xs text-stone-500 pt-1 font-mono">
                        Contact: {selectedTask.recipientOrganization.phone} ({selectedTask.recipientOrganization.contactPerson || 'Reception'})
                      </p>
                    )}
                  </div>
                </div>

                {/* Handling & Storage instructions */}
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                    <span>Handling & Temperature Guidance</span>
                  </p>
                  <p className="text-amber-800 leading-relaxed">
                    {selectedTask.listing?.storageMethod || 'Keep upright in sealed thermal food container.'}{' '}
                    {selectedTask.listing?.handlingInstructions || 'Deliver promptly within scheduled pickup window.'}
                  </p>
                </div>

                {/* Handover Code Notice */}
                <div className="p-4 bg-stone-100 rounded-xl border border-stone-200 text-xs text-stone-700 flex items-center justify-between">
                  <div>
                    <span className="font-bold block text-stone-900">Digital Pickup Code</span>
                    <span>Present on arrival at kitchen bay</span>
                  </div>
                  <span className="text-sm font-mono font-bold bg-white px-3 py-1.5 rounded-lg border border-stone-300 text-emerald-800">
                    {selectedTask.pickupReference || 'FB-REF'}
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => handleAccept(selectedTask)}
                    disabled={acceptingId === selectedTask.id}
                    className="w-full py-3.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Bike className="w-5 h-5" />
                    <span>{acceptingId === selectedTask.id ? 'Accepting Task...' : 'Accept This Delivery Route'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-500">
                <MapPin className="w-12 h-12 mx-auto text-stone-300 mb-2" />
                <p className="text-sm font-medium">Select a delivery task on the left to review details and route instructions</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
