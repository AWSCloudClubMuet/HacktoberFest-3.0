import React from 'react';
import { Shield, AlertTriangle, Package, Truck, Heart, LayoutDashboard, Waves } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, role, setRole, criticalCount = 0 }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'camps', label: 'Relief Camps', icon: Shield },
    { id: 'inventory', label: 'Supplies & Needs', icon: Package },
    { id: 'dispatches', label: 'Dispatch Control', icon: Truck },
    { id: 'donations', label: 'Donations & Volunteers', icon: Heart },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-sky-200/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Artsy Logo */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 via-blue-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-sky-500/30 group-hover:scale-105 transition-transform">
              <Waves className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="font-black text-xl tracking-tight text-slate-800">
                RELIEF<span className="text-sky-600">HUB</span>
              </span>
              <span className="block text-[10px] font-mono text-sky-600 font-bold tracking-widest uppercase">
                Sindh Flood Command
              </span>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="hidden md:flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id || (item.id === 'donations' && activeTab === 'donations-volunteers');
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25 scale-105'
                      : 'text-slate-600 hover:text-sky-600 hover:bg-sky-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                  {item.id === 'dashboard' && criticalCount > 0 && (
                    <span className="ml-1 px-2 py-0.5 text-[10px] font-black bg-rose-500 text-white rounded-full flex items-center gap-1 shadow-sm">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      {criticalCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Role Toggle Switch */}
          <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button
              onClick={() => setRole('Admin')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                role === 'Admin'
                  ? 'bg-white text-sky-600 shadow-md shadow-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Coordinator
            </button>
            <button
              onClick={() => setRole('Volunteer')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                role === 'Volunteer'
                  ? 'bg-white text-sky-600 shadow-md shadow-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Volunteer
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}