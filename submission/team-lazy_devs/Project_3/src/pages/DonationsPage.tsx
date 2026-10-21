import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../services/api.ts';
import { Donation, DonationType, InventoryItem } from '../types/index.ts';
import { DonationModal } from '../components/modals/DonationModal.tsx';
import {
  HeartHandshake,
  Plus,
  Search,
  Banknote,
  Package,
  Calendar,
  Layers,
} from 'lucide-react';

export const DonationsPage: React.FC = () => {
  const { role, refreshKey, triggerRefresh } = useApp();

  const [donations, setDonations] = useState<Donation[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [donRes, invRes] = await Promise.all([
          api.getDonations({
            type: selectedType !== 'all' ? selectedType : undefined,
            search: search.trim() || undefined,
          }),
          api.getInventory(),
        ]);

        if (mounted) {
          setDonations(donRes);
          setInventory(invRes);
        }
      } catch (err) {
        console.error('Failed to load donations:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, [refreshKey, selectedType, search]);

  // Aggregate metrics
  const cashDonations = useMemo(() => {
    return donations.filter((d) => d.type === 'Cash');
  }, [donations]);

  const inKindDonations = useMemo(() => {
    return donations.filter((d) => d.type === 'In-Kind');
  }, [donations]);

  const totalCashPkr = useMemo(() => {
    return cashDonations.reduce((sum, d) => sum + d.amount_or_quantity, 0);
  }, [cashDonations]);

  // Group cash by category
  const cashByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const d of cashDonations) {
      map[d.category] = (map[d.category] || 0) + d.amount_or_quantity;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [cashDonations]);

  // Group in-kind by item
  const inKindByItem = useMemo(() => {
    const map: Record<string, { name: string; quantity: number; unit: string }> = {};
    for (const d of inKindDonations) {
      const key = d.item_id || d.category;
      const itemName = d.item_name || d.category;
      const unit = d.item_unit || 'units';
      if (!map[key]) {
        map[key] = { name: itemName, quantity: 0, unit };
      }
      map[key].quantity += d.amount_or_quantity;
    }
    return Object.values(map).sort((a, b) => b.quantity - a.quantity);
  }, [inKindDonations]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#263242]">
            Relief Donations & Contributions Ledger
          </h1>
          <p className="text-xs text-[#697586] mt-0.5">
            Monetary cash grants in PKR and incoming physical relief supply consignments.
          </p>
        </div>

        {role === 'admin' ? (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-[#202B3C] hover:bg-[#172232] rounded-lg transition-colors flex items-center gap-2 shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4 text-[#D6A85F]" />
            <span>Record New Donation</span>
          </button>
        ) : (
          <span className="text-xs text-[#697586] bg-[#F0ECE3] px-3 py-1.5 rounded-lg border border-[#E5E1D9]">
            Field Volunteer Mode (Read-Only)
          </span>
        )}
      </div>

      {/* Aggregate KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-[#E5E1D9] border-t-2 border-t-[#D6A85F] p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#697586] uppercase tracking-wider">
              Total Cash Donations (PKR)
            </span>
            <div className="p-2 rounded-lg bg-[#D6A85F]/15 text-[#a87a2a] border border-[#D6A85F]/30">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-[#263242] tabular-nums">
              PKR {totalCashPkr.toLocaleString()}
            </span>
            <p className="text-xs text-[#697586] mt-1">
              From {cashDonations.length} registered donors & philanthropies
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E1D9] border-t-2 border-t-emerald-600 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#697586] uppercase tracking-wider">
              In-Kind Goods Inflow
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-emerald-800 tabular-nums">
              {inKindDonations.length} consignments
            </span>
            <p className="text-xs text-[#697586] mt-1">
              Direct physical stock replenishment to central depot
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E1D9] border-t-2 border-t-[#202B3C] p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#697586] uppercase tracking-wider">
              Accounting Invariants
            </span>
            <div className="p-2 rounded-lg bg-[#F0ECE3] text-[#263242] border border-[#E5E1D9]">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 space-y-1.5 text-xs text-[#697586]">
            <div className="flex justify-between">
              <span>Cash touches inventory:</span>
              <span className="font-semibold text-[#263242]">Never (Strict separation)</span>
            </div>
            <div className="flex justify-between">
              <span>In-kind stock increment:</span>
              <span className="font-semibold text-emerald-800">Exact-once atomic</span>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Grids: Cash By Category & In-Kind by Supply */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E5E1D9] shadow-xs">
          <h3 className="text-xs font-bold text-[#263242] uppercase tracking-wider mb-3">
            Cash Contributions by Sector
          </h3>
          <div className="space-y-2">
            {cashByCategory.map(([cat, amount]) => (
              <div key={cat} className="flex items-center justify-between text-xs p-2.5 bg-[#F0ECE3]/50 rounded-lg border border-[#E5E1D9]/60">
                <span className="font-medium text-[#263242]">{cat}</span>
                <span className="font-mono font-bold text-[#263242] tabular-nums">
                  PKR {amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E5E1D9] shadow-xs">
          <h3 className="text-xs font-bold text-[#263242] uppercase tracking-wider mb-3">
            In-Kind Goods Replenishment by Supply
          </h3>
          <div className="space-y-2">
            {inKindByItem.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs p-2.5 bg-[#F0ECE3]/50 rounded-lg border border-[#E5E1D9]/60">
                <span className="font-medium text-[#263242]">{item.name}</span>
                <span className="font-mono font-bold text-emerald-800 tabular-nums">
                  +{item.quantity} {item.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E5E1D9] shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[#697586] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search donor, category, or notes..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-[#E5E1D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D6A85F]/20 focus:border-[#D6A85F] text-[#263242]"
          />
        </div>

        <div className="flex items-center p-0.5 bg-[#F0ECE3] rounded-lg border border-[#E5E1D9] text-xs">
          {['all', 'Cash', 'In-Kind'].map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                selectedType === t
                  ? 'bg-[#202B3C] text-white shadow-xs font-semibold'
                  : 'text-[#697586] hover:text-[#263242]'
              }`}
            >
              {t === 'all' ? 'All Types' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Donations Table */}
      <div className="bg-white rounded-xl border border-[#E5E1D9] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F0ECE3] text-[#263242] font-semibold border-b border-[#E5E1D9]">
              <tr>
                <th className="px-5 py-3">Donation Type</th>
                <th className="px-4 py-3">Category / Item</th>
                <th className="px-4 py-3 text-right">Contribution Amount / Qty</th>
                <th className="px-4 py-3">Donor / Organization</th>
                <th className="px-4 py-3">Operational Notes</th>
                <th className="px-5 py-3 text-right">Date Recorded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E1D9] font-medium text-[#263242]">
              {donations.map((don) => {
                const dateStr = new Date(don.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });

                return (
                  <tr key={don.id} className="hover:bg-[#F0ECE3]/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2 py-0.5 text-[11px] font-semibold rounded-md border ${
                          don.type === 'Cash'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-[#D6A85F]/15 text-[#a87a2a] border-[#D6A85F]/30'
                        }`}
                      >
                        {don.type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#263242]">
                          {don.type === 'In-Kind' ? don.item_name || don.category : don.category}
                        </span>
                        {don.type === 'In-Kind' && (
                          <span className="text-[11px] text-[#697586]">Category: {don.category}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold tabular-nums text-sm text-[#263242]">
                      {don.type === 'Cash' ? (
                        <span className="text-emerald-800">
                          PKR {don.amount_or_quantity.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-[#202B3C]">
                          +{don.amount_or_quantity} {don.item_unit || 'units'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-[#263242]">
                      {don.donor_name || <span className="text-[#697586] italic">Anonymous</span>}
                    </td>
                    <td className="px-4 py-3.5 text-[#697586] max-w-xs truncate">
                      {don.notes || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-[11px] text-[#697586]">
                      {dateStr}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {donations.length === 0 && !isLoading && (
          <div className="p-12 text-center bg-white">
            <HeartHandshake className="w-8 h-8 text-[#697586] mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-[#263242]">No donation records found</p>
            <p className="text-xs text-[#697586] mt-1">Record a cash or in-kind donation to replenish relief funds.</p>
          </div>
        )}
      </div>

      {/* Donation Modal */}
      <DonationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        inventory={inventory}
      />
    </div>
  );
};
