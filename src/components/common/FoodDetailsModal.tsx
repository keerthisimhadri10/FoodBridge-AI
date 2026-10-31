import React, { useState } from 'react';
import { FoodListing } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  X,
  Clock,
  MapPin,
  Building2,
  ShieldAlert,
  AlertCircle,
  CheckCircle,
  Truck,
  Thermometer,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

interface FoodDetailsModalProps {
  listing: FoodListing | null;
  onClose: () => void;
  onRequestSubmitted?: () => void;
}

export const FoodDetailsModal: React.FC<FoodDetailsModalProps> = ({
  listing,
  onClose,
  onRequestSubmitted,
}) => {
  const { user, organization, quickLogin } = useAuth();

  const [requestedQuantity, setRequestedQuantity] = useState<number>(1);
  const [pickupWindow, setPickupWindow] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Reporting sub-state
  const [isReporting, setIsReporting] = useState<boolean>(false);
  const [reportReason, setReportReason] = useState<string>('');
  const [reportDescription, setReportDescription] = useState<string>('');
  const [reportSuccess, setReportSuccess] = useState<boolean>(false);

  if (!listing) return null;

  const isVerifiedNGO = user?.role === 'RECIPIENT' && organization?.verificationStatus === 'VERIFIED';
  const isPendingNGO = user?.role === 'RECIPIENT' && organization?.verificationStatus === 'PENDING';

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!user) {
      setErrorMsg('Please sign in or select a demo persona to request food.');
      return;
    }

    if (user.role !== 'RECIPIENT' && user.role !== 'ADMIN') {
      setErrorMsg('Only recipient organizations (NGOs, shelters, community kitchens) can request surplus food.');
      return;
    }

    if (!isVerifiedNGO && user.role !== 'ADMIN') {
      setErrorMsg('Only admin-verified recipient organizations can request food. Your organization is currently PENDING verification.');
      return;
    }

    if (requestedQuantity <= 0 || requestedQuantity > listing.availableQuantity) {
      setErrorMsg(`Please enter a quantity between 1 and ${listing.availableQuantity} ${listing.unit}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createRequest({
        listingId: listing.id,
        requestedQuantity,
        pickupWindow: pickupWindow || 'Scheduled collection window',
        notes,
      });

      setSuccessMsg('Donation request submitted successfully! The food donor will review your request.');
      if (onRequestSubmitted) {
        onRequestSubmitted();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason) return;
    try {
      await api.submitReport(listing.id, reportReason, reportDescription);
      setReportSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit report.');
    }
  };

  const prepDate = new Date(listing.preparationTime);
  const deadlineDate = new Date(listing.collectionDeadline);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-stone-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="relative h-48 bg-stone-100">
          <img
            src={listing.imageUrl}
            alt={listing.foodName}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-3 left-4 bg-white/95 backdrop-blur-xs px-3 py-1 rounded-md text-xs font-semibold text-emerald-800 shadow-xs">
            {listing.category.replace('_', ' ')} · {listing.dietaryType === 'VEGETARIAN' ? '🌱 Vegetarian' : '🍖 Non-Veg'}
          </div>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {/* Title & Donor */}
          <div>
            <h2 className="text-xl font-bold text-stone-900 tracking-tight">{listing.foodName}</h2>
            <div className="flex items-center gap-2 text-xs text-stone-600 mt-1">
              <Building2 className="w-4 h-4 text-emerald-700" />
              <span className="font-medium text-stone-800">{listing.donorOrganizationName || 'Donor Kitchen'}</span>
              <span>·</span>
              <MapPin className="w-3.5 h-3.5 text-stone-400" />
              <span>{listing.pickupLocation}</span>
            </div>
            <p className="text-xs text-stone-600 mt-3 leading-relaxed">{listing.description}</p>
          </div>

          {/* Key Facts Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-stone-50 rounded-xl border border-stone-200/80 text-xs">
            <div>
              <span className="text-[11px] text-stone-400 uppercase tracking-wider block">Available</span>
              <span className="font-bold text-stone-900 text-sm font-mono tabular-nums">
                {listing.availableQuantity}{' '}
                <span className="text-xs font-normal text-stone-500">{listing.unit.replace('_', ' ').toLowerCase()}</span>
              </span>
            </div>
            <div>
              <span className="text-[11px] text-stone-400 uppercase tracking-wider block">Preparation Time</span>
              <span className="font-medium text-stone-800">
                {prepDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
                {prepDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-stone-400 uppercase tracking-wider block">Collection Window</span>
              <span className="font-medium text-stone-800">
                {new Date(listing.pickupStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                {new Date(listing.pickupEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-stone-400 uppercase tracking-wider block">Deadline</span>
              <span className="font-semibold text-rose-700">
                {deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
                {deadlineDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Handling & Storage Guidance */}
          <div className="space-y-2 text-xs border-t border-stone-100 pt-4">
            <div className="flex items-start gap-2 text-stone-700">
              <Thermometer className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-stone-900">Storage Protocol:</strong> {listing.storageMethod}
              </div>
            </div>
            <div className="flex items-start gap-2 text-stone-700">
              <Truck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-stone-900">Transport & Handling:</strong> {listing.handlingInstructions}
              </div>
            </div>
            <div className="flex items-start gap-2 text-stone-700">
              <AlertCircle className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-stone-900">Allergen Notice:</strong> {listing.allergenInformation}
              </div>
            </div>
          </div>

          {/* Food Safety Disclosure */}
          <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Responsible Coordination Notice:</strong> The donor has confirmed standard commercial hygiene protocols. Recipient organizations must transport in clean covered containers and distribute within recommended timelines.
            </p>
          </div>

          {/* Request Form or Status Banners */}
          {successMsg ? (
            <div className="p-4 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-950 text-xs flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm">Request Submitted!</div>
                <div className="mt-1">{successMsg}</div>
                <button
                  onClick={onClose}
                  className="mt-3 px-3 py-1.5 bg-emerald-800 text-white font-medium rounded-lg hover:bg-emerald-700 text-xs"
                >
                  Close & View Dashboard
                </button>
              </div>
            </div>
          ) : !user ? (
            /* Logged out state */
            <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl text-center space-y-3">
              <p className="text-xs text-stone-600 font-medium">
                Sign in with a verified recipient organization account to request this donation.
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => quickLogin('ngo')}
                  className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  ⚡ Instant Demo: Login as Verified NGO
                </button>
              </div>
            </div>
          ) : isPendingNGO ? (
            /* Pending verification state */
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-700" />
                <span>Verification In Progress</span>
              </div>
              <p>
                Your recipient organization (<strong>{organization?.organizationName}</strong>) is currently pending admin verification. Only verified NGOs can request surplus food to ensure food safety and chain of custody.
              </p>
              <div className="pt-1 flex items-center gap-2">
                <button
                  onClick={() => quickLogin('admin')}
                  className="px-3 py-1 bg-purple-700 hover:bg-purple-800 text-white font-semibold rounded-md text-[11px]"
                >
                  Switch to Admin (to verify this NGO)
                </button>
                <button
                  onClick={() => quickLogin('ngo')}
                  className="px-3 py-1 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold rounded-md text-[11px]"
                >
                  Switch to Pre-Verified NGO
                </button>
              </div>
            </div>
          ) : user.role === 'DONOR' ? (
            <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-600 text-center">
              You are signed in with a Food Donor account. To test requesting this food, switch to a Recipient NGO persona above.
            </div>
          ) : (
            /* Verified NGO or Admin request form */
            <form onSubmit={handleRequestSubmit} className="space-y-4 border-t border-stone-200 pt-4">
              <h3 className="text-sm font-bold text-stone-900">Request Donation</h3>

              {errorMsg && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Requested Quantity (Max: {listing.availableQuantity} {listing.unit.replace('_', ' ').toLowerCase()})
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={listing.availableQuantity}
                    value={requestedQuantity}
                    onChange={(e) => setRequestedQuantity(Math.max(1, Number(e.target.value)))}
                    required
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-700 font-mono font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Estimated Pickup Window
                  </label>
                  <input
                    type="text"
                    value={pickupWindow}
                    onChange={(e) => setPickupWindow(e.target.value)}
                    placeholder="e.g., Today 3:30 PM - 4:30 PM"
                    required
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="block font-semibold text-stone-700 mb-1">
                  Collection Notes / Vehicle Info (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Volunteer van equipped with insulated containers will arrive at Rear Dispatch."
                  rows={2}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || listing.availableQuantity <= 0}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting Request...' : 'Submit Donation Request'}
                </button>
              </div>
            </form>
          )}

          {/* Report listing toggle */}
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
            <span>Listing ID: {listing.id}</span>
            {!isReporting ? (
              <button
                onClick={() => setIsReporting(true)}
                className="hover:text-rose-600 flex items-center gap-1 transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Report Listing Issue
              </button>
            ) : (
              <button
                onClick={() => setIsReporting(false)}
                className="text-stone-500 hover:text-stone-800"
              >
                Close Report Form
              </button>
            )}
          </div>

          {isReporting && (
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-3">
              <h4 className="font-bold text-stone-900">Report Listing for Administrative Review</h4>
              {reportSuccess ? (
                <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg font-medium">
                  Report submitted. Thank you for helping keep FoodBridge AI safe.
                </div>
              ) : (
                <form onSubmit={handleReportSubmit} className="space-y-3">
                  <div>
                    <label className="block font-medium text-stone-700 mb-1">Reason</label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      required
                      className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg text-xs"
                    >
                      <option value="">Select reason...</option>
                      <option value="Storage protocol concern">Storage protocol concern</option>
                      <option value="Packaging integrity">Packaging integrity issue</option>
                      <option value="Inaccurate food description">Inaccurate food description</option>
                      <option value="Unreachable pickup location">Unreachable pickup location</option>
                      <option value="Other food quality issue">Other food quality issue</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-stone-700 mb-1">Details (Optional)</label>
                    <textarea
                      value={reportDescription}
                      onChange={(e) => setReportDescription(e.target.value)}
                      rows={2}
                      className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg text-xs"
                      placeholder="Explain your observation..."
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-rose-700 text-white rounded-lg font-semibold text-xs hover:bg-rose-800"
                  >
                    Send Report
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
