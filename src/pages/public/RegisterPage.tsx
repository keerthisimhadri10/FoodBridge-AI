import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Utensils, HeartHandshake, AlertCircle, CheckCircle2 } from 'lucide-react';
import { UserRole, OrganizationType } from '../../types';

export const RegisterPage: React.FC = () => {
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<UserRole>('DONOR');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [organizationName, setOrganizationName] = useState<string>('');
  const [organizationType, setOrganizationType] = useState<OrganizationType>('RESTAURANT');
  const [address, setAddress] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [contactPerson, setContactPerson] = useState<string>('');
  const [capacityMeals, setCapacityMeals] = useState<number>(50);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await register({
        role,
        name,
        email,
        password,
        organizationName,
        organizationType,
        address,
        phone,
        contactPerson: contactPerson || name,
        capacityMeals,
        latitude: 17.4156, // Default Hyderabad center coordinates
        longitude: 78.4350,
      });

      if (role === 'DONOR') {
        navigate('/donor/dashboard');
      } else if (role === 'RECIPIENT') {
        navigate('/recipient/dashboard');
      } else {
        navigate('/volunteer/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
          Register on FoodBridge AI
        </h1>
        <p className="text-xs sm:text-sm text-stone-600">
          Join Hyderabad's network of food businesses and charitable recipients
        </p>
      </div>

      {/* Role Selection Tabs */}
      <div className="grid grid-cols-3 gap-2 p-1.5 bg-stone-200/60 rounded-xl">
        <button
          type="button"
          onClick={() => {
            setRole('DONOR');
            setOrganizationType('RESTAURANT');
          }}
          className={`py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
            role === 'DONOR'
              ? 'bg-white text-emerald-900 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Utensils className="w-3.5 h-3.5 text-emerald-700" />
          <span>Donor</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setRole('RECIPIENT');
            setOrganizationType('NGO');
          }}
          className={`py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
            role === 'RECIPIENT'
              ? 'bg-white text-emerald-900 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <HeartHandshake className="w-3.5 h-3.5 text-blue-700" />
          <span>Recipient NGO</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setRole('VOLUNTEER');
          }}
          className={`py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
            role === 'VOLUNTEER'
              ? 'bg-white text-emerald-900 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <span className="text-base">🚴</span>
          <span>Volunteer</span>
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-xs space-y-5">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* User Section */}
          <div className="font-bold text-stone-900 text-sm border-b border-stone-100 pb-2">
            Account Details
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Your Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Varma"
                required
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-700"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Official Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@org.org"
                required
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-700"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Secure Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              required
              minLength={6}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          {/* Organization Section */}
          <div className="font-bold text-stone-900 text-sm border-b border-stone-100 pb-2 pt-2">
            Organization Profile
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Organization Name</label>
              <input
                type="text"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder={role === 'DONOR' ? 'e.g., Grand Banquet Hall' : 'e.g., Hope Shelter'}
                required
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-700"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Organization Type</label>
              <select
                value={organizationType}
                onChange={(e) => setOrganizationType(e.target.value as OrganizationType)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-700"
              >
                {role === 'DONOR' ? (
                  <>
                    <option value="RESTAURANT">Restaurant</option>
                    <option value="HOTEL">Hotel</option>
                    <option value="BAKERY">Bakery</option>
                    <option value="SUPERMARKET">Supermarket</option>
                    <option value="CATERER">Catering Business</option>
                    <option value="COMMUNITY_KITCHEN">Community Kitchen</option>
                  </>
                ) : (
                  <>
                    <option value="NGO">Registered NGO</option>
                    <option value="ORPHANAGE">Children Orphanage</option>
                    <option value="SHELTER">Homeless Shelter</option>
                    <option value="CHARITY">Charitable Trust</option>
                    <option value="COMMUNITY_GROUP">Community Distribution Group</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Physical Address in Hyderabad</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g., Road No 36, Jubilee Hills, Hyderabad"
                required
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-700"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Contact Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 40 2341 0000"
                required
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-700"
              />
            </div>
          </div>

          {role === 'RECIPIENT' && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <span className="font-bold">Verification Policy Notice:</span>
              <p>
                To protect food safety, recipient organizations start in <strong>PENDING</strong> status upon registration until verified by platform administrators. Once approved, you can immediately request available surplus food.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50 text-xs mt-2"
          >
            {isLoading ? 'Registering Organization...' : 'Complete Registration'}
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-stone-500">
          Already registered?{' '}
          <Link to="/login" className="text-emerald-800 font-semibold hover:underline">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};
