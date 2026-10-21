import React from 'react';

export const CardSkeleton = () => (
  <div className="bg-white rounded-xl p-4 border border-earth-300 shadow-card animate-pulse space-y-3">
    <div className="flex justify-between items-start">
      <div className="space-y-2">
        <div className="h-4 w-28 bg-slate-200 rounded"></div>
        <div className="h-3 w-20 bg-slate-100 rounded"></div>
      </div>
      <div className="h-5 w-16 bg-slate-200 rounded-full"></div>
    </div>
    <div className="h-7 w-36 bg-slate-200 rounded"></div>
    <div className="flex justify-between pt-2 border-t border-slate-100">
      <div className="h-3 w-16 bg-slate-100 rounded"></div>
      <div className="h-3 w-16 bg-slate-100 rounded"></div>
    </div>
  </div>
);

export const ChartSkeleton = () => (
  <div className="bg-white rounded-xl p-6 border border-earth-300 shadow-card animate-pulse space-y-4">
    <div className="flex justify-between items-center">
      <div className="h-5 w-48 bg-slate-200 rounded"></div>
      <div className="h-8 w-24 bg-slate-200 rounded"></div>
    </div>
    <div className="h-64 w-full bg-slate-100 rounded-lg"></div>
  </div>
);

export const TableSkeleton = () => (
  <div className="bg-white rounded-xl border border-earth-300 shadow-card p-4 animate-pulse space-y-3">
    <div className="h-5 w-40 bg-slate-200 rounded"></div>
    <div className="space-y-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-10 w-full bg-slate-100 rounded"></div>
      ))}
    </div>
  </div>
);
