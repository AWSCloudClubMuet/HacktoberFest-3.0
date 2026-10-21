import React from 'react';

export default function ProgressBar({ 
  value = 0, 
  max = 100, 
  showLabel = true, 
  variant = 'default', // 'default' | 'occupancy' | 'fulfilment'
  size = 'md' 
}) {
  const percentage = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const rounded = Math.round(percentage);

  let barColor = 'var(--color-teal)';
  if (variant === 'occupancy') {
    if (percentage >= 95) barColor = 'var(--color-red)';
    else if (percentage >= 80) barColor = 'var(--color-amber)';
    else barColor = 'var(--color-teal)';
  } else if (variant === 'fulfilment') {
    if (percentage < 40) barColor = 'var(--color-red)';
    else if (percentage < 80) barColor = 'var(--color-amber)';
    else barColor = 'var(--color-green)';
  }

  return (
    <div className={`progress-bar-container size-${size}`}>
      <div className="progress-bar-track">
        <div 
          className="progress-bar-fill" 
          style={{ width: `${percentage}%`, backgroundColor: barColor }}
        />
      </div>
      {showLabel && (
        <span className="progress-bar-label">
          {rounded}%
        </span>
      )}
    </div>
  );
}
