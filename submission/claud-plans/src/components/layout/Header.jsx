import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, LogOut, ArrowRightLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Header = () => {
  const { currentUser, clearUser, users, switchUser, isFarmer } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-emerald-900 text-white shadow-md border-b border-emerald-800 px-4 py-2.5">
      <div className="flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-700/90 flex items-center justify-center text-emerald-300">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-black text-base tracking-tight text-white">
                Kisan<span className="text-amber-400">Mandi</span>
              </span>
              <span className="text-[9px] font-bold uppercase px-1 py-0.2 rounded bg-emerald-800 text-emerald-300 border border-emerald-700">
                Sindh
              </span>
            </div>
            <p className="text-[9px] text-emerald-200/80 -mt-0.5">
              کسان منڈی • ریٹس اور مارکیٹ
            </p>
          </div>
        </Link>

        {/* User Info & Switch User button */}
        <div className="flex items-center gap-2">
          {currentUser && (
            <div className="text-right">
              <div className="text-[11px] font-bold text-white max-w-[110px] truncate leading-tight">
                {currentUser.name}
              </div>
              <div className="flex items-center justify-end gap-1 text-[9px] font-semibold text-emerald-200">
                <span className={`px-1.5 py-0.2 rounded font-bold ${
                  isFarmer ? 'bg-emerald-800 text-emerald-300' : 'bg-amber-800 text-amber-300'
                }`}>
                  {isFarmer ? 'Farmer' : 'Buyer'}
                </span>
                <span className="truncate max-w-[60px] text-slate-300">{currentUser.district}</span>
              </div>
            </div>
          )}

          {/* Quick User Switcher dropdown */}
          {users && users.length > 0 && currentUser && (
            <div className="relative">
              <select
                aria-label="Switch User Account"
                value={currentUser.id}
                onChange={(e) => switchUser(e.target.value)}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                title="Select another user"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    [{u.role}] {u.name} ({u.district})
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="p-1.5 rounded-lg bg-emerald-800/80 text-emerald-200 hover:text-white hover:bg-emerald-700 transition-colors"
                title="Quick switch user"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Clear localStorage / Switch user button as required by spec */}
          <button
            type="button"
            id="switch-user-btn"
            onClick={clearUser}
            className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1 transition-colors"
            title="Switch User (clears localStorage)"
          >
            <LogOut className="w-3 h-3" />
            <span className="hidden sm:inline">Switch</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
