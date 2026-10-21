import React, { useState } from 'react';
import { ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { User, UserRole } from '../types';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUserId: string;
  onSelectUser: (user: User) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUserId,
  onSelectUser,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('farmer');
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUserId);

  if (!isOpen) return null;

  const filteredUsers = users.filter((u) => u.role === selectedRole);

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    const firstOfRole = users.find((u) => u.role === role);
    if (firstOfRole) {
      setSelectedUserId(firstOfRole.id);
    }
  };

  const handleConfirm = () => {
    const chosenUser = users.find((u) => u.id === selectedUserId);
    if (chosenUser) {
      onSelectUser(chosenUser);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-xl border border-[#E8E7DF] relative animate-in fade-in zoom-in-95 duration-150">
        <div className="text-center mb-6">
          <div className="text-3xl mb-2">🌱</div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <h2 className="text-2xl font-bold tracking-tight text-[#2D452B]">
              saa-wak
            </h2>
            <span className="text-xl font-bold text-[#4A6B42] font-sindhi">
              ساوڪ
            </span>
          </div>

          <p className="text-xs font-semibold text-[#4A6B42] mb-0.5">
            Know the market. Grow with confidence.
          </p>
          <p className="text-xs text-[#767B70] font-sindhi">
            مارڪيٽ جا اگهه ڄاڻو، اعتماد سان اڳتي وڌو.
          </p>
        </div>

        {/* Step 1: Select Role */}
        <div className="mb-5">
          <label className="block text-[11px] font-bold text-[#767B70] uppercase tracking-wider mb-2">
            1. Select Demo Experience
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleRoleChange('farmer')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative ${
                selectedRole === 'farmer'
                  ? 'border-[#4A6B42] bg-[#EEF2E8] shadow-xs'
                  : 'border-[#E8E7DF] bg-[#FAF9F5] hover:bg-white'
              }`}
            >
              {selectedRole === 'farmer' && (
                <CheckCircle2 className="w-4 h-4 text-[#4A6B42] absolute top-3 right-3" />
              )}
              <div className="text-xl mb-1">🌾</div>
              <div className="font-semibold text-xs text-[#2D452B]">Farmer (هارِي)</div>
              <p className="text-[11px] text-[#767B70] mt-1 leading-snug">
                Track Mandi rates, set threshold alerts, simulate profit & list crops.
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('buyer')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative ${
                selectedRole === 'buyer'
                  ? 'border-[#4A6B42] bg-[#EEF2E8] shadow-xs'
                  : 'border-[#E8E7DF] bg-[#FAF9F5] hover:bg-white'
              }`}
            >
              {selectedRole === 'buyer' && (
                <CheckCircle2 className="w-4 h-4 text-[#4A6B42] absolute top-3 right-3" />
              )}
              <div className="text-xl mb-1">🏪</div>
              <div className="font-semibold text-xs text-[#2D452B]">Buyer (واپاري)</div>
              <p className="text-[11px] text-[#767B70] mt-1 leading-snug">
                Compare mandi quotes & discover Sindh farm produce lots.
              </p>
            </button>
          </div>
        </div>

        {/* Step 2: Select Profile */}
        <div className="mb-5">
          <label className="block text-[11px] font-bold text-[#767B70] uppercase tracking-wider mb-2">
            2. Choose Demo Profile
          </label>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {filteredUsers.map((u) => (
              <label
                key={u.id}
                className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-colors ${
                  selectedUserId === u.id
                    ? 'border-[#4A6B42] bg-[#EEF2E8]/60 text-[#2D452B]'
                    : 'border-[#E8E7DF] hover:bg-[#FAF9F5] text-[#2F332C]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="demoUser"
                    value={u.id}
                    checked={selectedUserId === u.id}
                    onChange={() => setSelectedUserId(u.id)}
                    className="accent-[#4A6B42]"
                  />
                  <div>
                    <div className="text-xs font-semibold">{u.displayName}</div>
                    <div className="text-[11px] text-[#767B70]">
                      {u.district} District · Demo: {u.phone}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-medium text-[#4A6B42] bg-[#EEF2E8] px-2 py-0.5 rounded capitalize">
                  {u.role}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="p-3 bg-[#FAF9F5] rounded-xl border border-[#E8E7DF] mb-5 flex items-start gap-2 text-xs text-[#666B60]">
          <ShieldCheck className="w-4 h-4 text-[#4A6B42] shrink-0 mt-0.5" />
          <span>
            Demonstration mode using fictional sample data for Sindh agriculture. You can switch profiles anytime.
          </span>
        </div>

        <button
          type="button"
          onClick={handleConfirm}
          className="w-full bg-[#2D452B] hover:bg-[#4A6B42] text-white py-3 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <span>Enter saa-wak (ساوڪ)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
