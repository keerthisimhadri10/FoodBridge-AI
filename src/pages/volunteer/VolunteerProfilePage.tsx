import React, { useState, useEffect } from 'react';
import {
  Bike,
  CheckCircle2,
  AlertCircle,
  Truck,
  ShieldCheck,
  Star,
  User,
  Phone,
} from 'lucide-react';
import { api } from '../../services/api';
import { VolunteerProfile, VehicleType } from '../../types';

export const VolunteerProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<VolunteerProfile | null>(null);
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('ELECTRIC_VAN');
  const [vehicleNumber, setVehicleNumber] = useState<string>('');
  const [isAvailable, setIsAvailable] = useState<boolean>(true);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const data = await api.getVolunteerProfile();
        if (data) {
          setProfile(data);
          setFullName(data.fullName);
          setPhone(data.phone);
          setVehicleType(data.vehicleType);
          setVehicleNumber(data.vehicleNumber || '');
          setIsAvailable(data.isAvailable);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load profile.');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const updated = await api.updateVolunteerProfile({
        fullName,
        phone,
        vehicleType,
        vehicleNumber,
        isAvailable,
      });
      setProfile(updated);
      setSuccessMsg('Volunteer profile updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 py-16 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-emerald-800 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
            Courier Credentials & Vehicle Registration
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight mt-0.5">
            Volunteer Courier Profile
          </h1>
          <p className="text-sm text-stone-600">
            Configure vehicle capacity, contact details, and route dispatch availability
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left stats card (1 col) */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-800 font-bold text-2xl flex items-center justify-center mx-auto">
                <Bike className="w-8 h-8" />
              </div>

              <div>
                <h3 className="font-bold text-stone-900 text-base">{fullName || 'Volunteer Courier'}</h3>
                <span className="text-xs text-stone-500 font-medium">Verified Community Courier</span>
              </div>

              <div className="pt-3 border-t border-stone-100 grid grid-cols-2 gap-2 text-center text-xs">
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                  <span className="block text-stone-400 text-[10px] uppercase">Rating</span>
                  <span className="font-bold text-stone-900 flex items-center justify-center gap-1 mt-0.5">
                    {profile?.averageRating || 5.0} <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  </span>
                </div>
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                  <span className="block text-stone-400 text-[10px] uppercase">Deliveries</span>
                  <span className="font-bold text-stone-900 mt-0.5 block">
                    {profile?.totalDeliveriesCompleted || 14}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-emerald-950 text-white rounded-2xl p-6 border border-emerald-900 space-y-3">
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
              <h4 className="font-bold text-sm">Food Safety Pledge</h4>
              <p className="text-xs text-stone-300 leading-relaxed">
                "I pledge to transport food donations in clean, covered, and temperature-appropriate containers, never breaking the cold/warm chain, and respecting donor and recipient integrity."
              </p>
            </div>
          </div>

          {/* Right form card (2 cols) */}
          <div className="md:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
              <h2 className="text-lg font-bold text-stone-900">Courier Profile Settings</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Direct Phone Number (for Handover Verification)</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Vehicle Type</label>
                    <select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-hidden"
                    >
                      <option value="ELECTRIC_VAN">Electric Van (Large capacity)</option>
                      <option value="MOTORCYCLE">Motorcycle / Scooter (Fast agile)</option>
                      <option value="BICYCLE">Bicycle (Eco local)</option>
                      <option value="CAR">Car / Hatchback</option>
                      <option value="TRUCK">Insulated Mini Truck</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Vehicle License Plate Number</label>
                    <input
                      type="text"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value)}
                      placeholder="e.g. TS 09 EZ 4412"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-3 p-3.5 bg-stone-50 border border-stone-200 rounded-xl cursor-pointer hover:bg-stone-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={isAvailable}
                      onChange={(e) => setIsAvailable(e.target.checked)}
                      className="w-4 h-4 text-emerald-800 rounded-sm focus:ring-emerald-700"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-stone-900 block">Dispatch Status: Available for New Tasks</span>
                      <span className="text-stone-500">When checked, donors and NGOs can match nearby delivery tasks to you.</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-xs disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
