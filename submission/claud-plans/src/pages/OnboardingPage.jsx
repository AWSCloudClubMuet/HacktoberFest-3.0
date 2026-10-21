import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SINDH_DISTRICTS } from '../utils/sindhLocations';
import { Sprout, Briefcase, UserPlus, Check, ArrowRight } from 'lucide-react';

export const OnboardingPage = () => {
  const { registerUser, switchUser, users } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('Hyderabad');
  const [role, setRole] = useState('Farmer');

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = {};
    if (!name.trim()) validationErrors.name = 'Name is required';
    if (!phone.trim()) validationErrors.phone = 'Phone number is required';
    if (!district.trim()) validationErrors.district = 'District is required';
    if (!role) validationErrors.role = 'Role is required';

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      await registerUser({ name, phone, district, role });
      navigate('/', { replace: true });
    } catch (err) {
      setErrors({ form: err.message || 'Registration failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePickDemoUser = (userId) => {
    switchUser(userId);
    navigate('/', { replace: true });
  };

  return (
    <div className="p-4 sm:p-5 flex flex-col justify-center min-h-[80vh] space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-1">
        <div className="w-14 h-14 rounded-2xl bg-emerald-700 text-white flex items-center justify-center mx-auto shadow-md">
          <Sprout className="w-8 h-8 text-emerald-300" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Welcome to Kisan<span className="text-emerald-700">Mandi</span>
        </h1>
        <p className="text-xs text-slate-500">
          Sindh Mandi Wholesale Rates & Direct Farmer Produce Marketplace
        </p>
      </div>

      {/* Onboarding Form */}
      <div className="bg-white rounded-2xl border border-earth-300 p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Create Your Profile</h2>
          <p className="text-[11px] text-slate-500">
            Tell us who you are to personalize your mandi dashboard
          </p>
        </div>

        {errors.form && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs">
            {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Role Choice */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[10px]">
              Select Your Role <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                id="role-farmer-btn"
                onClick={() => setRole('Farmer')}
                className={`p-3 rounded-xl border-2 font-bold flex flex-col items-center gap-1 transition-all ${
                  role === 'Farmer'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Sprout className="w-5 h-5 text-emerald-600" />
                <span className="text-xs">Farmer / ہاری</span>
                <span className="text-[9px] text-slate-400 font-normal">Grower & Seller</span>
              </button>

              <button
                type="button"
                id="role-buyer-btn"
                onClick={() => setRole('Buyer')}
                className={`p-3 rounded-xl border-2 font-bold flex flex-col items-center gap-1 transition-all ${
                  role === 'Buyer'
                    ? 'border-amber-600 bg-amber-50 text-amber-950 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Briefcase className="w-5 h-5 text-amber-600" />
                <span className="text-xs">Buyer / بیوپاری</span>
                <span className="text-[9px] text-slate-400 font-normal">Trader & Wholesaler</span>
              </button>
            </div>
            {errors.role && <p className="text-rose-500 text-[11px] mt-1">{errors.role}</p>}
          </div>

          {/* Full Name */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 text-[11px]">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              id="onboarding-name"
              placeholder="e.g. Ghulam Rasool"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl border ${
                errors.name ? 'border-rose-500' : 'border-earth-300'
              } bg-white text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500`}
            />
            {errors.name && <p className="text-rose-500 text-[11px] mt-1">{errors.name}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 text-[11px]">
              Phone Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              id="onboarding-phone"
              placeholder="e.g. 0300-1234501"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl border ${
                errors.phone ? 'border-rose-500' : 'border-earth-300'
              } bg-white text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500`}
            />
            {errors.phone && <p className="text-rose-500 text-[11px] mt-1">{errors.phone}</p>}
          </div>

          {/* District */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 text-[11px]">
              District (Sindh) <span className="text-rose-500">*</span>
            </label>
            <select
              id="onboarding-district"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl border ${
                errors.district ? 'border-rose-500' : 'border-earth-300'
              } bg-white text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium`}
            >
              {SINDH_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            {errors.district && <p className="text-rose-500 text-[11px] mt-1">{errors.district}</p>}
          </div>

          <button
            type="submit"
            id="onboarding-submit-btn"
            disabled={isSubmitting}
            className="w-full mt-2 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow transition-colors flex items-center justify-center gap-1.5 text-xs disabled:opacity-50"
          >
            {isSubmitting ? 'Registering...' : `Continue as ${role}`}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Or quick pick demo user */}
      {users && users.length > 0 && (
        <div className="bg-white/80 rounded-2xl border border-earth-200 p-4 space-y-2">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">
            Or Quick Login As Existing Persona
          </p>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {users.slice(0, 4).map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => handlePickDemoUser(u.id)}
                className="p-2 rounded-xl border border-earth-200 bg-white hover:bg-emerald-50 text-left transition-colors"
              >
                <div className="font-bold text-slate-800 truncate">{u.name}</div>
                <div className="text-[10px] text-slate-400">
                  {u.role} • {u.district}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingPage;
