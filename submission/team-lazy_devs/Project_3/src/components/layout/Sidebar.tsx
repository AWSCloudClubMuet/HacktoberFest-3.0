import React from 'react';
import { useApp, NavigationTab } from '../../context/AppContext.tsx';
import {
  LayoutDashboard,
  Tent,
  PackageCheck,
  ClipboardList,
  Truck,
  HeartHandshake,
  Users2,
  HelpCircle,
  ShieldCheck,
  UserCheck,
  Activity,
  Layers,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  criticalGapsCount?: number;
  lowStockCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  mobileOpen,
  setMobileOpen,
  criticalGapsCount = 0,
  lowStockCount = 0,
}) => {
  const { activeTab, setActiveTab, role } = useApp();

  const navGroups: {
    title: string;
    items: {
      id: NavigationTab;
      label: string;
      icon: React.ReactNode;
      badge?: number;
      badgeColor?: string;
    }[];
  }[] = [
    {
      title: 'Operations Command',
      items: [
        {
          id: 'overview',
          label: 'Overview',
          icon: <LayoutDashboard className="w-4 h-4" />,
        },
        {
          id: 'camps',
          label: 'Relief Camps',
          icon: <Tent className="w-4 h-4" />,
        },
        {
          id: 'inventory',
          label: 'Warehouse Inventory',
          icon: <PackageCheck className="w-4 h-4" />,
          badge: lowStockCount > 0 ? lowStockCount : undefined,
          badgeColor: 'bg-amber-400/20 text-amber-300 border border-amber-400/30',
        },
        {
          id: 'needs',
          label: 'Camp Needs',
          icon: <ClipboardList className="w-4 h-4" />,
          badge: criticalGapsCount > 0 ? criticalGapsCount : undefined,
          badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
        },
      ],
    },
    {
      title: 'Logistics & Personnel',
      items: [
        {
          id: 'dispatches',
          label: 'Dispatches & Fleet',
          icon: <Truck className="w-4 h-4" />,
        },
        {
          id: 'donations',
          label: 'Donations Ledger',
          icon: <HeartHandshake className="w-4 h-4" />,
        },
        {
          id: 'volunteers',
          label: 'Volunteer Force',
          icon: <Users2 className="w-4 h-4" />,
        },
      ],
    },
    {
      title: 'System & Invariants',
      items: [
        {
          id: 'demo',
          label: 'Demo Guide & Tests',
          icon: <HelpCircle className="w-4 h-4" />,
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#172232] border-r border-[#29384B] flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 overflow-hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Subtle Topographic Map Contour Texture Overlay (low contrast, non-intrusive) */}
        <div className="absolute inset-0 bg-topo-pattern opacity-[0.08] pointer-events-none" />

        {/* Brand header */}
        <div className="relative z-10 flex items-center gap-3 px-5 h-16 border-b border-[#29384B] shrink-0 bg-[#172232]">
          <div className="w-8 h-8 rounded-lg bg-[#D6A85F] text-[#172232] flex items-center justify-center font-bold shadow-xs shrink-0">
            <Activity className="w-4.5 h-4.5 text-[#172232] stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold tracking-tight text-white truncate">
                ReliefHub
              </span>
              <span className="text-[10px] font-semibold text-[#E8C98E] bg-[#D6A85F]/15 border border-[#D6A85F]/30 px-1 py-0.2 rounded-xs">
                Sindh
              </span>
            </div>
            <p className="text-[11px] text-[#697586] font-medium truncate">
              Flood Relief Operations
            </p>
          </div>
        </div>

        {/* Operational Zone Context Banner */}
        <div className="relative z-10 px-3.5 py-2.5 mx-3.5 my-3 bg-[#202B3C] rounded-lg border border-[#29384B]">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#697586] font-medium">Command Sector</span>
            <span className="font-semibold text-[#D6A85F]">Sindh Basin</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] text-[#697586]">
            <span>Priority Districts:</span>
            <span className="text-slate-300 font-medium">Dadu, Badin, Sukkur</span>
          </div>
        </div>

        {/* Navigation list with logical groups */}
        <nav className="relative z-10 flex-1 px-3 py-1 space-y-4 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-bold text-[#697586] uppercase tracking-wider">
                {group.title}
              </div>
              {group.items.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileOpen(false);
                    }}
                    className={`w-full relative flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-all duration-150 text-left ${
                      isActive
                        ? 'bg-[#344354] text-white shadow-xs font-semibold'
                        : 'text-slate-300 hover:text-white hover:bg-[#29384B]'
                    }`}
                  >
                    {/* Active antique gold vertical indicator */}
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#D6A85F] rounded-r" />
                    )}

                    <div className="flex items-center gap-2.5 truncate">
                      <span className={`${isActive ? 'text-[#D6A85F]' : 'text-[#697586]'}`}>
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span
                        className={`ml-2 px-1.5 py-0.2 text-[10px] font-mono font-semibold rounded tabular-nums ${
                          isActive ? 'bg-[#D6A85F]/20 text-[#E8C98E] border border-[#D6A85F]/30' : item.badgeColor
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Role Footer */}
        <div className="relative z-10 p-3.5 border-t border-[#29384B] shrink-0 bg-[#141C28]">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-1.5 rounded-md shrink-0 ${
                role === 'admin'
                  ? 'bg-[#D6A85F]/15 text-[#D6A85F] border border-[#D6A85F]/30'
                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              }`}
            >
              {role === 'admin' ? (
                <ShieldCheck className="w-4 h-4" />
              ) : (
                <UserCheck className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 truncate">
                  {role === 'admin' ? 'Coordinator (Admin)' : 'Field Volunteer'}
                </span>
              </div>
              <p className="text-[11px] text-[#697586] truncate">
                {role === 'admin' ? 'Full operational authority' : 'Operational view only'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
