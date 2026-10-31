import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { ShieldCheck, ShieldAlert, Save, CheckCircle, AlertCircle, Building2 } from 'lucide-react';

export const RecipientProfilePage: React.FC = () => {
  const { user, organization, refreshUser } = useAuth();

  const [orgName, setOrgName] = useState(organization?.organizationName || '');
  const [description, setDescription] = useState(organization?.description || '');
  const [address, setAddress] = useState(organization?.address || '');
  const [phone, setPhone] = useState(organization?.contactDetails?.phone || '');
  const [contactPerson, setContactPerson] = useState(organization?.contactDetails?.contactPerson || '');
  const [capacityMeals, setCapacityMeals] = useState<number>(organization?.capacityMeals || 50);

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isVerified = organization?.verificationStatus === 'VERIFIED';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      await api.updateProfile({
        organizationName: orgName,
        description,
        address,
        phone,
        contactPerson,
        capacityMeals,
      });
      await refreshUser();
      setSuccessMsg('Profile updated successfully.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Recipient Organization Profile</h1>
        <p className="text-xs text-stone-600 mt-1">Manage charitable registration details and operational capacities.</p>
      </div>

      {/* Verification Status Card */}
      <div
        className={`p-5 rounded-2xl border flex items-center justify-between gap-4 text-xs ${
          isVerified
            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
            : 'bg-amber-50 border-amber-200 text-amber-950'
        }`}
      >
        <div className="flex items-center gap-3">
          {isVerified ? (
            <ShieldCheck className="w-6 h-6 text-emerald-700 shrink-0" />
          ) : (
            <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0" />
          )}
          <div>
            <div className="font-bold text-sm">
              Status: {organization?.verificationStatus || 'PENDING'}
            </div>
            <div className="mt-0.5 text-stone-600">
              {isVerified
                ? 'Your organization is verified by FoodBridge AI administration. You can request surplus food.'
                : 'Your organization is awaiting admin verification. Switch to Administrator persona to approve.'}
            </div>
          </div>
        </div>
        <span
          className={`px-3 py-1 font-bold rounded-lg font-mono text-xs ${
            isVerified ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
          }`}
        >
          {organization?.verificationStatus}
        </span>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-xs space-y-4">
        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Organization Name</label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Mission & Communities Served</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Facility Address in Hyderabad</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Contact Person</label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                required
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-700"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Official Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-700"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Meal Capacity (Meals / Day)</label>
              <input
                type="number"
                min={1}
                value={capacityMeals}
                onChange={(e) => setCapacityMeals(Number(e.target.value))}
                required
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-700"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
