import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { AlertTriangle, Home, Users, CheckCircle2, PackageX, ExternalLink } from 'lucide-react';

export default function Dashboard({ camps, inventory, needs, volunteers, setActiveTab, setSelectedCampFilter }) {
  // 1. KPI Computations
  const activeCamps = camps.filter(c => c.status === 'Active' || c.status === 'Full');
  const familiesSheltered = camps.reduce((sum, c) => sum + (Number(c.currentfamilies) || 0), 0);
  
  const totalRequired = needs.reduce((sum, n) => sum + (Number(n.requiredquantity) || 0), 0);
  const totalFulfilled = needs.reduce((sum, n) => sum + (Number(n.fulfilledquantity) || 0), 0);
  const overallFulfillment = totalRequired > 0 ? Math.round((totalFulfilled / totalRequired) * 100) : 0;

  const lowStockCount = inventory.filter(i => Number(i.stock) <= Number(i.reorderlevel)).length;
  const deployedVolunteers = volunteers.filter(v => v.camp_id !== null && v.camp_id !== "").length;

  // 2. Bar Chart Data by Inventory Category
  const categoryDataMap = {};
  needs.forEach(n => {
    const item = inventory.find(i => i.id === n.inventoryitemid);
    const cat = item ? item.category : 'General';
    if (!categoryDataMap[cat]) categoryDataMap[cat] = { req: 0, ful: 0 };
    categoryDataMap[cat].req += Number(n.requiredquantity) || 0;
    categoryDataMap[cat].ful += Number(n.fulfilledquantity) || 0;
  });

  const chartData = Object.keys(categoryDataMap).map(cat => ({
    category: cat,
    fulfillment: categoryDataMap[cat].req > 0 
      ? Math.round((categoryDataMap[cat].ful / categoryDataMap[cat].req) * 100)
      : 0
  }));

  // 3. Critical Gaps Table Logic: High Priority & < 40% Fulfillment, ordered worst gap first
  const criticalGaps = needs
    .map(n => {
      const camp = camps.find(c => c.id === n.campid);
      const item = inventory.find(i => i.id === n.inventoryitemid);
      const req = Number(n.requiredquantity) || 1;
      const ful = Number(n.fulfilledquantity) || 0;
      const pct = Math.round((ful / req) * 100);
      return { ...n, campName: camp?.name || 'Unknown', district: camp?.district, itemName: item?.name || 'Unknown', unit: item?.unit, pct };
    })
    .filter(n => n.priority === 'High' && n.pct < 40)
    .sort((a, b) => a.pct - b.pct);

  const navigateToCamp = (campId) => {
    if (setSelectedCampFilter) setSelectedCampFilter(campId);
    setActiveTab('camps');
  };

  return (
    <div className="space-y-6">
      
      {/* Top KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-xs font-medium">Active Camps</span>
            <Home className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100">{activeCamps.length}</p>
          <span className="text-[10px] text-slate-500">Out of {camps.length} total registered</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-xs font-medium">Families Sheltered</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100">{familiesSheltered.toLocaleString()}</p>
          <span className="text-[10px] text-slate-500">Across all operational districts</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-xs font-medium">Overall Fulfillment</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">{overallFulfillment}%</p>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-emerald-400 h-full transition-all duration-500" style={{ width: `${overallFulfillment}%` }}></div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-xs font-medium">Low Stock Alerts</span>
            <PackageX className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400">{lowStockCount}</p>
          <span className="text-[10px] text-slate-500">Items at/below reorder limit</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-xs font-medium">Volunteers Deployed</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100">{deployedVolunteers}</p>
          <span className="text-[10px] text-slate-500">Active in the field</span>
        </div>

      </div>

      {/* Middle Grid: Category Bar Chart + Summary Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 p-5 rounded-xl">
          <h2 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
            Need Fulfillment % by Category
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="category" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} unit="%" domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                  formatter={(val) => [`${val}%`, 'Fulfillment']}
                />
                <Bar dataKey="fulfillment" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fulfillment < 40 ? '#f43f5e' : entry.fulfillment < 70 ? '#f59e0b' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Status Callout */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-rose-400 mb-3">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
              <h3 className="text-sm font-bold">Critical Action Summary</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              There are currently <strong className="text-rose-400 font-semibold">{criticalGaps.length} critical gaps</strong> across registered camps requiring immediate dispatch intervention. Priority items include water purification and emergency shelter.
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2 mt-4">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">High Priority Gaps:</span>
              <span className="text-rose-400 font-bold">{criticalGaps.length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Low Stock Inventory:</span>
              <span className="text-amber-400 font-bold">{lowStockCount} items</span>
            </div>
          </div>
        </div>

      </div>

      {/* Critical Gaps Table (Drill-Down) */}
      <div className="bg-slate-900/80 border border-rose-500/20 p-5 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-rose-500/10 border border-rose-500/30 rounded text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-100">Critical Gaps (High Priority &lt; 40% Fulfilled)</h2>
          </div>
          <span className="text-xs text-slate-400">Sorted by Worst Fulfillment First</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3">Camp Name</th>
                <th className="p-3">District</th>
                <th className="p-3">Item Needed</th>
                <th className="p-3">Fulfilled / Required</th>
                <th className="p-3">Fulfillment</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {criticalGaps.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-4 text-center text-slate-500">No critical gaps detected! All high priority needs are above 40%.</td>
                </tr>
              ) : (
                criticalGaps.map((gap) => (
                  <tr key={gap.id} className="hover:bg-slate-800/30">
                    <td className="p-3 font-medium text-slate-100">{gap.campName}</td>
                    <td className="p-3 text-slate-400">{gap.district}</td>
                    <td className="p-3 text-cyan-400 font-medium">{gap.itemName}</td>
                    <td className="p-3 text-slate-300">{gap.fulfilledquantity} / {gap.requiredquantity} {gap.unit}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-rose-500 h-full" style={{ width: `${gap.pct}%` }}></div>
                        </div>
                        <span className="font-bold text-rose-400">{gap.pct}%</span>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => navigateToCamp(gap.campid)}
                        className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium text-[11px] hover:underline"
                      >
                        Drill Down <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}