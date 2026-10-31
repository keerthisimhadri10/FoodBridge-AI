import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Bike,
  MapPin,
  Clock,
  Phone,
  CheckCircle2,
  AlertCircle,
  Truck,
  ShieldCheck,
  ChevronRight,
  Star,
  ExternalLink,
} from 'lucide-react';
import { api } from '../../services/api';
import { DeliveryTask } from '../../types';
import { FeedbackModal } from '../../components/common/FeedbackModal';

export const ActiveDeliveryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [task, setTask] = useState<DeliveryTask | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [isFeedbackOpen, setIsFeedbackOpen] = useState<boolean>(false);
  const [stepMessage, setStepMessage] = useState<string | null>(null);

  const loadTask = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (id) {
        const data = await api.getDeliveryById(id);
        setTask(data);
      } else {
        // Find first active task for this volunteer
        const myTasks = await api.getDeliveries({ my: true });
        const active = myTasks.find(
          (t) => t.status === 'ASSIGNED' || t.status === 'PICKED_UP' || t.status === 'IN_TRANSIT'
        );
        if (active) {
          setTask(active);
        } else if (myTasks.length > 0) {
          setTask(myTasks[0]);
        } else {
          setTask(null);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load delivery task.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTask();
  }, [id]);

  const handleUpdateStatus = async (newStatus: 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED') => {
    if (!task) return;
    setIsUpdating(true);
    setError(null);
    try {
      const res = await api.updateDeliveryStatus(task.id, newStatus, notes);
      setTask(res.task);
      setNotes('');
      if (newStatus === 'DELIVERED') {
        setStepMessage('Delivery marked as DELIVERED! Please provide quality feedback.');
        setIsFeedbackOpen(true);
      } else {
        setStepMessage(`Status updated to ${newStatus}. Keep going!`);
        setTimeout(() => setStepMessage(null), 3500);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update delivery status.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 py-16 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-emerald-800 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-stone-600">Loading delivery route & verification details...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-stone-50 py-16 px-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-stone-200 p-8 text-center space-y-4">
          <Bike className="w-12 h-12 text-stone-300 mx-auto" />
          <h2 className="text-xl font-bold text-stone-900">No Active Delivery Task</h2>
          <p className="text-xs text-stone-600">
            You do not currently have an active task in progress. Browse open deliveries to claim a route.
          </p>
          <Link
            to="/volunteer/available"
            className="inline-block px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
          >
            Browse Available Tasks
          </Link>
        </div>
      </div>
    );
  }

  const isAssigned = task.status === 'ASSIGNED';
  const isInTransit = task.status === 'PICKED_UP' || task.status === 'IN_TRANSIT';
  const isDelivered = task.status === 'DELIVERED';

  return (
    <div className="min-h-screen bg-stone-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Breadcrumb / Top Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-stone-500">
            <Link to="/volunteer/dashboard" className="hover:text-stone-800">Volunteer</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to="/volunteer/available" className="hover:text-stone-800">Deliveries</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-stone-900 font-semibold font-mono">Task #{task.id.slice(-6)}</span>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              isDelivered
                ? 'bg-emerald-100 text-emerald-800'
                : isInTransit
                ? 'bg-blue-100 text-blue-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {task.status}
          </span>
        </div>

        {stepMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{stepMessage}</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm font-medium flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Milestone Steps Progress Bar */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className={`p-3 rounded-xl border ${isAssigned ? 'bg-amber-50 border-amber-300 font-bold text-amber-900' : 'bg-stone-50 border-stone-200 text-stone-500'}`}>
              <span className="block text-[10px] uppercase text-stone-400">Step 1</span>
              <span>1. En Route to Donor</span>
            </div>

            <div className={`p-3 rounded-xl border ${isInTransit ? 'bg-blue-50 border-blue-300 font-bold text-blue-900' : isDelivered ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-stone-50 border-stone-200 text-stone-500'}`}>
              <span className="block text-[10px] uppercase text-stone-400">Step 2</span>
              <span>2. Food In Transit</span>
            </div>

            <div className={`p-3 rounded-xl border ${isDelivered ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-900' : 'bg-stone-50 border-stone-200 text-stone-500'}`}>
              <span className="block text-[10px] uppercase text-stone-400">Step 3</span>
              <span>3. Delivered Handover</span>
            </div>
          </div>
        </div>

        {/* Main Route & Task Information Card */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-100">
            <div>
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Active Courier Mission</span>
              <h1 className="text-2xl font-extrabold text-stone-900 mt-1">
                {task.listing?.foodName || 'Surplus Food Transfer'}
              </h1>
              <p className="text-xs text-stone-500 mt-0.5">
                Quantity: <strong>{task.quantity} {task.listing?.unit || 'Units'}</strong> · Est. Distance: <strong>{task.estimatedDistanceKm} km</strong>
              </p>
            </div>

            <div className="bg-stone-50 px-4 py-3 rounded-xl border border-stone-200 text-right">
              <span className="text-[10px] text-stone-400 font-bold uppercase block">Handover Verification Code</span>
              <span className="text-base font-mono font-bold text-emerald-800">
                {task.pickupReference || 'FB-HYD-7821'}
              </span>
            </div>
          </div>

          {/* Donor & Recipient Addresses and Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Origin */}
            <div className={`p-5 rounded-xl border space-y-3 ${isAssigned ? 'bg-amber-50/60 border-amber-300' : 'bg-stone-50 border-stone-200'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 uppercase flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  <span>Origin: Donor Kitchen</span>
                </span>
                {isAssigned && (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                    Target: Pickup Now
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-bold text-stone-900 text-base">{task.donorOrganization?.organizationName}</h3>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">{task.pickupAddress}</p>
              </div>

              {task.donorOrganization?.phone && (
                <div className="pt-2 flex items-center gap-2">
                  <a
                    href={`tel:${task.donorOrganization.phone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call {task.donorOrganization.contactPerson || 'Kitchen'}</span>
                  </a>
                </div>
              )}
            </div>

            {/* Destination */}
            <div className={`p-5 rounded-xl border space-y-3 ${isInTransit ? 'bg-blue-50/60 border-blue-300' : 'bg-stone-50 border-stone-200'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-800 uppercase flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <span>Destination: NGO Facility</span>
                </span>
                {isInTransit && (
                  <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-md">
                    Target: Dropoff
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-bold text-stone-900 text-base">{task.recipientOrganization?.organizationName}</h3>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">{task.deliveryAddress}</p>
              </div>

              {task.recipientOrganization?.phone && (
                <div className="pt-2 flex items-center gap-2">
                  <a
                    href={`tel:${task.recipientOrganization.phone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-800 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call {task.recipientOrganization.contactPerson || 'Coordinator'}</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Food Transport & Handling Advisory */}
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-700 space-y-1">
            <span className="font-bold flex items-center gap-1.5 text-stone-900">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Transport Standard: {task.listing?.storageMethod || 'Room temperature / insulated carrier'}</span>
            </span>
            <p className="text-stone-600">
              {task.listing?.handlingInstructions || 'Keep crates level. Verify temperature upon handover.'}
            </p>
          </div>

          {/* Action Area */}
          <div className="pt-4 border-t border-stone-100 space-y-4">
            {!isDelivered && (
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Handover Notes / Verification Remarks (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Arrived at Dispatch Bay 2; crates inspected and warm; receiver Sister Mary verified."
                  className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-hidden"
                />
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <Link
                to="/volunteer/dashboard"
                className="text-xs font-semibold text-stone-600 hover:text-stone-900"
              >
                ← Back to Dashboard
              </Link>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {isAssigned && (
                  <button
                    onClick={() => handleUpdateStatus('PICKED_UP')}
                    disabled={isUpdating}
                    className="w-full sm:w-auto px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isUpdating ? 'Recording...' : '1. Confirm Pickup from Donor Kitchen'}</span>
                  </button>
                )}

                {isInTransit && (
                  <button
                    onClick={() => handleUpdateStatus('DELIVERED')}
                    disabled={isUpdating}
                    className="w-full sm:w-auto px-6 py-3 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isUpdating ? 'Recording Handover...' : '2. Confirm Delivery at Recipient NGO'}</span>
                  </button>
                )}

                {isDelivered && (
                  <button
                    onClick={() => setIsFeedbackOpen(true)}
                    className="w-full sm:w-auto px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2"
                  >
                    <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
                    <span>Leave Partner Feedback</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {task && (
        <FeedbackModal
          isOpen={isFeedbackOpen}
          onClose={() => setIsFeedbackOpen(false)}
          requestId={task.requestId}
          listingId={task.listingId}
          foodName={task.listing?.foodName || 'Food Surplus'}
          targetOrgName={task.recipientOrganization?.organizationName || 'Recipient NGO'}
          targetOrgId={task.recipientOrgId}
          onSubmitted={() => {
            setIsFeedbackOpen(false);
            navigate('/volunteer/history');
          }}
        />
      )}
    </div>
  );
};
