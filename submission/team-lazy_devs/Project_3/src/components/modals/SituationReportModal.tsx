import React from 'react';
import { Modal } from '../ui/Modal.tsx';
import {
  DashboardSummary,
  Camp,
  CampNeed,
  InventoryItem,
  Dispatch,
  SmartRecommendation,
  CriticalGap,
} from '../../types/index.ts';
import {
  Printer,
  Download,
  FileText,
  ShieldAlert,
  Tent,
  Users,
  Percent,
  AlertTriangle,
  Truck,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

interface SituationReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: DashboardSummary | null;
  camps: Camp[];
  needs: CampNeed[];
  inventory: InventoryItem[];
  dispatches: Dispatch[];
  recommendations: SmartRecommendation[];
  criticalGaps: CriticalGap[];
}

export const SituationReportModal: React.FC<SituationReportModalProps> = ({
  isOpen,
  onClose,
  summary,
  camps,
  needs,
  inventory,
  dispatches,
  recommendations,
  criticalGaps,
}) => {
  const generatedAt = new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'full',
    timeStyle: 'medium',
  }).format(new Date());

  const reportId = `SITREP-SINDH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
    1000 + Math.random() * 9000
  )}`;

  const lowStockItems = inventory.filter((i) => i.stock <= i.reorder_level);
  const pendingDispatches = dispatches.filter((d) => d.status === 'Pending' || d.status === 'In Transit');

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const lines: string[] = [];

    // Header
    lines.push('RELIEFHUB - SINDH FLOOD RELIEF OPERATIONS SITUATION REPORT');
    lines.push(`Report ID,${reportId}`);
    lines.push(`Generated At,"${generatedAt}"`);
    lines.push(`Provincial Corridor,"Sindh Basin (Dadu, Badin, Sukkur, Larkana, Jamshoro, Mirpur Khas)"`);
    lines.push('');

    // Executive Metrics
    lines.push('EXECUTIVE METRICS');
    lines.push('Metric,Value,Note');
    lines.push(`Active Camps,${summary?.active_camps ?? 0},Out of ${summary?.total_camps ?? 0} registered`);
    lines.push(`Families Sheltered,${summary?.families_sheltered ?? 0},Evacuees currently accommodated`);
    lines.push(`Overall Supply Fulfilment,${summary?.overall_fulfilment ?? 0}%,Delivered vs required demand`);
    lines.push(`Low-Stock Depot Items,${summary?.low_stock_items ?? 0},At or below reorder threshold`);
    lines.push(`Volunteers Deployed,${summary?.volunteers_deployed ?? 0},Of ${summary?.total_volunteers ?? 0} registered force`);
    lines.push(`Total Cash Grants (PKR),${summary?.total_cash_donations_pkr ?? 0},Provincial relief ledger`);
    lines.push('');

    // Smart Recommendations
    lines.push('SMART PRIORITY RECOMMENDATIONS (DECISION SUPPORT)');
    lines.push('Camp,District,Resource,Priority,Fulfilment %,Remaining Demand,Available Stock,Recommendation Rationale');
    for (const r of recommendations.slice(0, 10)) {
      lines.push(
        `"${r.camp_name}","${r.district}","${r.item_name}","${r.priority}",${r.fulfilment_percentage}%,${r.remaining_unreserved_quantity} ${r.item_unit},${r.available_stock} ${r.item_unit},"${r.explanation.replace(/"/g, '""')}"`
      );
    }
    lines.push('');

    // Critical Supply Gaps
    lines.push('CRITICAL SHORTAGE GAPS (<40% FULFILMENT)');
    lines.push('Camp,District,Shortage Item,Category,Required,Fulfilled,Remaining Gap,Fulfilment %');
    for (const g of criticalGaps) {
      lines.push(
        `"${g.camp_name}","${g.district}","${g.item_name}","${g.category}",${g.required_quantity} ${g.item_unit},${g.fulfilled_quantity} ${g.item_unit},${g.remaining_quantity} ${g.item_unit},${g.fulfilment_percentage}%`
      );
    }
    lines.push('');

    // Low Stock Inventory
    lines.push('DEPOT SHORTAGE ALERTS (AT OR BELOW REORDER LEVEL)');
    lines.push('Item Name,Category,Current Stock,Reorder Level,Unit,Daily Consumption,Estimated Days Remaining');
    for (const i of lowStockItems) {
      const days = i.daily_consumption && i.daily_consumption > 0 ? Math.floor(i.stock / i.daily_consumption) : 'Insufficient data';
      lines.push(
        `"${i.name}","${i.category}",${i.stock},${i.reorder_level},"${i.unit}",${i.daily_consumption ?? 'N/A'},"${days}"`
      );
    }
    lines.push('');

    // Active Convoys
    lines.push('ACTIVE CONVOYS & DISPATCHES');
    lines.push('Dispatch ID,Destination Camp,District,Item,Quantity,Status,Created At');
    for (const d of pendingDispatches) {
      lines.push(
        `"${d.id}","${d.camp_name}","${d.camp_district}","${d.item_name}",${d.quantity} ${d.item_unit},"${d.status}","${d.created_at}"`
      );
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(lines.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `ReliefHub_Sindh_SitRep_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Provincial Emergency Situation Report (SITREP)"
      subtitle={`Verified Humanitarian Operational Brief · ID: ${reportId}`}
      maxWidth="2xl"
    >
      <div className="space-y-6 text-slate-900">
        {/* Printable Container */}
        <div id="printable-sitrep" className="space-y-6">
          {/* Header Banner */}
          <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400 block">
                  Government of Sindh · ReliefHub Command
                </span>
                <h3 className="text-base font-bold text-white">
                  Provincial Flood Relief Situation Report
                </h3>
              </div>
              <div className="text-right">
                <span className="font-mono text-[11px] text-slate-300 block">{reportId}</span>
                <span className="text-[10px] text-slate-400 font-mono">{generatedAt}</span>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
              <div>
                <span className="text-slate-400">Jurisdiction: </span>
                <strong className="text-white">Sindh Province (6 Priority Districts)</strong>
              </div>
              <div>
                <span className="text-slate-400">Classification: </span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded">
                  Active Emergency Relief
                </span>
              </div>
            </div>
          </div>

          {/* Key Metrics Matrix */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              1. Executive Operational Metrics
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Active Relief Camps</span>
                <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">
                  {summary?.active_camps ?? 0}
                </span>
                <span className="text-[10px] text-slate-400 block">Of {summary?.total_camps ?? 0} registered</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Families Sheltered</span>
                <span className="text-lg font-bold font-mono text-teal-700 tabular-nums">
                  {(summary?.families_sheltered ?? 0).toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 block">Displaced evacuees</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Overall Fulfilment</span>
                <span className="text-lg font-bold font-mono text-emerald-700 tabular-nums">
                  {summary?.overall_fulfilment ?? 0}%
                </span>
                <span className="text-[10px] text-slate-400 block">Delivered / required</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Low Stock Depot Items</span>
                <span className="text-lg font-bold font-mono text-amber-700 tabular-nums">
                  {summary?.low_stock_items ?? 0}
                </span>
                <span className="text-[10px] text-slate-400 block">At/below reorder</span>
              </div>
            </div>
          </div>

          {/* Smart Recommendations Section */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                2. Top Smart Priority Recommendations
              </h4>
              <span className="text-[10px] font-mono text-slate-500">Rule-Based Priority Matrix</span>
            </div>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-3.5 py-2">Camp & District</th>
                    <th className="px-3 py-2">Resource</th>
                    <th className="px-3 py-2">Priority</th>
                    <th className="px-3 py-2 text-right">Fulfilment</th>
                    <th className="px-3 py-2 text-right">Remaining</th>
                    <th className="px-3 py-2">Stock Availability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {recommendations.slice(0, 5).map((rec) => (
                    <tr key={rec.need_id}>
                      <td className="px-3.5 py-2.5">
                        <span className="font-semibold text-slate-900 block">{rec.camp_name}</span>
                        <span className="text-[10px] text-slate-400">{rec.district}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="font-semibold text-slate-800">{rec.item_name}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`px-1.5 py-0.2 text-[10px] font-semibold rounded ${
                          rec.priority === 'High' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {rec.priority}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">
                        {rec.fulfilment_percentage}%
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-slate-900">
                        {rec.remaining_unreserved_quantity} {rec.item_unit}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                          rec.stock_status === 'Sufficient'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : rec.stock_status === 'Partial'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {rec.stock_status} ({rec.available_stock} avail)
                        </span>
                      </td>
                    </tr>
                  ))}
                  {recommendations.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-4 text-center text-slate-500">
                        No active recommendation needs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Critical Shortage Gaps */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              3. Critical High-Priority Gaps (&lt;40% Fulfilment)
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-3.5 py-2">Camp</th>
                    <th className="px-3 py-2">District</th>
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2 text-right">Required</th>
                    <th className="px-3 py-2 text-right">Fulfilled</th>
                    <th className="px-3 py-2 text-right">Remaining Gap</th>
                    <th className="px-3.5 py-2 text-right">Fulfilment %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {criticalGaps.map((gap) => (
                    <tr key={gap.need_id}>
                      <td className="px-3.5 py-2 font-semibold text-slate-900">{gap.camp_name}</td>
                      <td className="px-3 py-2 text-slate-600">{gap.district}</td>
                      <td className="px-3 py-2 font-semibold text-slate-800">{gap.item_name}</td>
                      <td className="px-3 py-2 text-right font-mono">{gap.required_quantity} {gap.item_unit}</td>
                      <td className="px-3 py-2 text-right font-mono text-emerald-700">{gap.fulfilled_quantity} {gap.item_unit}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-rose-700">{gap.remaining_quantity} {gap.item_unit}</td>
                      <td className="px-3.5 py-2 text-right font-mono font-bold text-rose-700">{gap.fulfilment_percentage}%</td>
                    </tr>
                  ))}
                  {criticalGaps.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-4 text-center text-slate-500">
                        All high-priority needs have reached over 40% fulfilment.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Low Stock Items & Active Fleet */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-900 block mb-2">Warehouse Shortage Alerts ({lowStockItems.length})</span>
              <ul className="space-y-1.5 font-medium text-slate-700">
                {lowStockItems.slice(0, 5).map((i) => (
                  <li key={i.id} className="flex justify-between">
                    <span>{i.name}:</span>
                    <span className="font-mono text-amber-800 font-bold">
                      {i.stock} / {i.reorder_level} {i.unit}
                    </span>
                  </li>
                ))}
                {lowStockItems.length === 0 && (
                  <li className="text-slate-500">All inventory items above reorder levels.</li>
                )}
              </ul>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-900 block mb-2">Pending / In-Transit Fleet ({pendingDispatches.length})</span>
              <ul className="space-y-1.5 font-medium text-slate-700">
                {pendingDispatches.slice(0, 5).map((d) => (
                  <li key={d.id} className="flex justify-between">
                    <span className="truncate max-w-[150px]">{d.camp_name}:</span>
                    <span className="font-mono text-blue-800">
                      {d.quantity} {d.item_unit} ({d.status})
                    </span>
                  </li>
                ))}
                {pendingDispatches.length === 0 && (
                  <li className="text-slate-500">No active convoy dispatches pending.</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Download CSV Report</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Close Report
          </button>
        </div>
      </div>
    </Modal>
  );
};
