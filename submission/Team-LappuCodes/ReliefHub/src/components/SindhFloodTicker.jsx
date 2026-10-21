import React, { useState, useEffect } from 'react';
import { Waves, AlertCircle, CloudRain, Radio, ShieldCheck } from 'lucide-react';

export default function SindhFloodTicker() {
  const [tickerIndex, setTickerIndex] = useState(0);

  const updates = [
    { location: 'Guddu Barrage', flow: '782,000 cusecs', status: 'High Flood Alert', level: 'Red' },
    { location: 'Sukkur Barrage', flow: '520,000 cusecs', status: 'Medium Flood', level: 'Amber' },
    { location: 'Kotri Barrage', flow: '290,000 cusecs', status: 'Normal Inflow', level: 'Green' },
    { location: 'Dadu District (Johi Ring)', flow: 'Water level +0.4ft', status: 'Embankment Watched', level: 'Amber' },
    { location: 'PDMA Sindh Command', flow: 'Telemetry Active', status: 'Emergency Protocol Active', level: 'Green' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % updates.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [updates.length]);

  const current = updates[tickerIndex];

  return (
    <div className="bg-gradient-to-r from-sky-900 via-slate-900 to-blue-950 text-white px-4 py-2 rounded-2xl border border-sky-400/30 shadow-md flex flex-wrap items-center justify-between gap-3 mb-6 text-xs font-semibold">
      {/* Live Badge */}
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
        </span>
        <span className="text-sky-300 font-black tracking-wider uppercase flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
          Sindh Hydro Telemetry
        </span>
      </div>

      {/* Dynamic Animated Ticker Message */}
      <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-3.5 py-1 rounded-xl border border-white/15 transition-all duration-500">
        <Waves className="w-4 h-4 text-sky-300 animate-bounce" />
        <span className="text-slate-200 font-bold">{current.location}:</span>
        <span className="text-sky-200 font-mono">{current.flow}</span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
            current.level === 'Red'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
              : current.level === 'Amber'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
          }`}
        >
          {current.status}
        </span>
      </div>

      {/* Quick Status Pill */}
      <div className="hidden lg:flex items-center gap-2 text-slate-300">
        <ShieldCheck className="w-4 h-4 text-teal-400" />
        <span>PDMA Emergency Operations Center Active</span>
      </div>
    </div>
  );
}