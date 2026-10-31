import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bike,
  PackageCheck,
  MapPin,
  Clock,
  ArrowRight,
  Star,
  CheckCircle2,
  AlertCircle,
  Truck,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { api } from '../../services/api';
import { DeliveryTask, VolunteerProfile } from '../../types';
import { FoodDonationMap } from '../../components/map/FoodDonationMap';

export const VolunteerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<VolunteerProfile | null>(null);
  const [availableTasks, setAvailableTasks] = useState<DeliveryTask[]>([]);
  const [myTasks, setMyTasks] = useState<DeliveryTask[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [volProfile, available, mine] = await Promise.all([
        api.getVolunteerProfile(),
        api.getDeliveries({ status: 'AVAILABLE' }),
        api.getDeliveries({ my: true }),
      ]);
      setProfile(volProfile);
      setAvailableTasks(available);
      setMyTasks(mine);
    } catch (err: any) {
      setError(err.message || 'Failed to load volunteer data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleAvailability = async () => {
    if (!profile) return;
    try {
      const updated = await api.updateVolunteerProfile({
        isAvailable: !profile.isAvailable,
      });
      setProfile(updated);
      setActionSuccess(`Status updated to ${updated.isAvailable ? 'Online (Accepting Tasks)' : 'Offline'}`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update availability.');
    }
  };

  const handleAcceptTask = async (taskId: string) => {
    try {
      await api.acceptDelivery(taskId);
      setActionSuccess('Delivery task accepted! Redirecting to active route...');
      setTimeout(() => {
        navigate(`/volunteer/active/${taskId}`);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Could not accept task.');
    }
  };

  const activeTask = myTasks.find(
    (t) => t.status === 'ASSIGNED' || t.status === 'PICKED_UP' || t.status === 'IN_TRANSIT'
  );

  const completedCount = myTasks.filter((t) => t.status === 'DELIVERED').length;

  return (
    <div className="min-h-screen bg-stone-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header with Courier Card */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                Volunteer Dispatch Hub
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-100 text-blue-800">
                Courier Mode
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              Welcome back, {profile?.fullName || 'Volunteer Partner'}
            </h1>
            <p className="text-sm text-stone-600">
              Vehicle: <strong className="text-stone-800">{profile?.vehicleType || 'Electric Van'}</strong> ({profile?.vehicleNumber || 'TS 09 EZ 4412'}) · Rating: <strong className="text-stone-800">{profile?.averageRating || 5.0} ★</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleAvailability}
              className={`px-4 py-2 text-sm font-semibold rounded-xl border transition-colors flex items-center gap-2 shadow-xs ${
                profile?.isAvailable
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                  : 'bg-stone-100 border-stone-300 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  profile?.isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'
                }`}
              />
              <span>{profile?.isAvailable ? 'Online · Accepting Tasks' : 'Offline · Inactive'}</span>
            </button>

            <Link
              to="/volunteer/profile"
              className="px-4 py-2 text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
            >
              Settings
            </Link>
          </div>
        </div>

        {actionSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-medium flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm font-medium flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Active Task Banner if ongoing */}
        {activeTask && (
          <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 shadow-md border border-blue-800">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-300 uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                  <span>Delivery In Progress · Status: {activeTask.status}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold">
                  {activeTask.listing?.foodName || 'Food Surplus Donation'}
                </h3>
                <div className="text-sm text-blue-100 space-y-1">
                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>From: <strong>{activeTask.donorOrganization?.organizationName || 'Donor'}</strong> ({activeTask.pickupAddress})</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>To: <strong>{activeTask.recipientOrganization?.organizationName || 'NGO'}</strong> ({activeTask.deliveryAddress})</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                <div className="px-4 py-2 bg-white/10 rounded-xl text-center">
                  <span className="block text-[10px] text-blue-200 uppercase">Est. Distance</span>
                  <span className="text-base font-bold">{activeTask.estimatedDistanceKm} km</span>
                </div>
                <Link
                  to={`/volunteer/active/${activeTask.id}`}
                  className="px-6 py-3 bg-white text-blue-900 font-bold text-sm rounded-xl hover:bg-blue-50 transition-colors shadow-xs text-center flex items-center justify-center gap-2"
                >
                  <span>Open Active Route</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
            <span className="text-xs font-medium text-stone-500">Available Deliveries</span>
            <div className="text-2xl font-bold text-stone-900 mt-1">{availableTasks.length}</div>
            <span className="text-xs text-blue-700 font-medium">Ready for dispatch</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
            <span className="text-xs font-medium text-stone-500">Deliveries Completed</span>
            <div className="text-2xl font-bold text-stone-900 mt-1">
              {profile?.totalDeliveriesCompleted || completedCount || 0}
            </div>
            <span className="text-xs text-emerald-700 font-medium">Safe handovers</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
            <span className="text-xs font-medium text-stone-500">Courier Rating</span>
            <div className="text-2xl font-bold text-stone-900 mt-1 flex items-center gap-1.5">
              <span>{profile?.averageRating || 5.0}</span>
              <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
            </div>
            <span className="text-xs text-stone-500">From recipient NGOs</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
            <span className="text-xs font-medium text-stone-500">Total Distance Rescued</span>
            <div className="text-2xl font-bold text-stone-900 mt-1">
              {Math.round(((profile?.totalDeliveriesCompleted || 10) * 4.2) * 10) / 10} km
            </div>
            <span className="text-xs text-stone-500">Zero-emission courier</span>
          </div>
        </div>

        {/* Available Deliveries Section with Map */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-stone-900">Available Delivery Tasks Near You</h2>
              <p className="text-xs text-stone-600">Pickups scheduled by donors needing volunteer transport to NGOs</p>
            </div>
            <Link
              to="/volunteer/available"
              className="text-xs font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-1"
            >
              <span>View Map & Filter</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {availableTasks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center">
              <PackageCheck className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-stone-900">No Pending Delivery Tasks</h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto mt-1">
                All scheduled food donations currently have couriers assigned or are handled directly by donor/recipient teams. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {availableTasks.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-500 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md">
                        {task.estimatedDistanceKm} km route
                      </span>
                      <span className="text-xs text-stone-500 font-mono">
                        Ref: {task.pickupReference || 'FB-REF'}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-stone-900 text-base line-clamp-1">
                        {task.listing?.foodName || 'Nutritious Prepared Food'}
                      </h4>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Quantity: <strong>{task.quantity} {task.listing?.unit || 'Units'}</strong>
                      </p>
                    </div>

                    <div className="text-xs text-stone-600 space-y-2 border-t border-stone-100 pt-3">
                      <div>
                        <span className="text-[10px] text-stone-400 font-bold uppercase block">Pickup Facility</span>
                        <p className="font-medium text-stone-800">{task.donorOrganization?.organizationName || 'Donor'}</p>
                        <p className="text-stone-500 line-clamp-1">{task.pickupAddress}</p>
                      </div>

                      <div>
                        <span className="text-[10px] text-stone-400 font-bold uppercase block">Dropoff Center</span>
                        <p className="font-medium text-stone-800">{task.recipientOrganization?.organizationName || 'NGO'}</p>
                        <p className="text-stone-500 line-clamp-1">{task.deliveryAddress}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => handleAcceptTask(task.id)}
                      className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <Bike className="w-4 h-4" />
                      <span>Accept Delivery Task</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Volunteer Standards & Food Safety Guide */}
        <div className="bg-stone-100 rounded-2xl p-6 border border-stone-200">
          <div className="flex items-start gap-4">
            <ShieldCheck className="w-8 h-8 text-emerald-800 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-stone-900">Volunteer Safe Transport Protocols</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Ensure cooked meals are kept upright in insulated thermal carriers. Always check the donor pickup code (e.g. <code>FB-HYD-XXXX</code>) upon arrival, and obtain recipient confirmation upon handover. Never consume, alter, or delay delivery of food parcels.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
