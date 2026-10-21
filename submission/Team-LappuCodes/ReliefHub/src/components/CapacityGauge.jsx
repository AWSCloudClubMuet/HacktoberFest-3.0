import React from 'react';

export default function CapacityGauge({ current = 0, capacity = 100, size = 70 }) {
  const curr = Number(current) || 0;
  const cap = Number(capacity) || 1;
  const pct = Math.min(100, Math.round((curr / cap) * 100));

  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  let colorClass = 'stroke-emerald-500 text-emerald-600';
  let bgGlow = 'rgba(16, 185, 129, 0.15)';

  if (pct >= 100) {
    colorClass = 'stroke-rose-500 text-rose-600 animate-pulse';
    bgGlow = 'rgba(244, 63, 94, 0.2)';
  } else if (pct >= 70) {
    colorClass = 'stroke-amber-500 text-amber-600';
    bgGlow = 'rgba(245, 158, 11, 0.15)';
  }

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-slate-200"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Animated Progress Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={`${colorClass} transition-all duration-1000 ease-out`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          style={{ filter: `drop-shadow(0 0 6px ${bgGlow})` }}
        />
      </svg>

      {/* Percentage Center Text */}
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className={`text-xs font-black tracking-tighter ${colorClass}`}>
          {pct}%
        </span>
      </div>
    </div>
  );
}