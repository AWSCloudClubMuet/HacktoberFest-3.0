import React from 'react';

export function ProgressBar({ current = 0, total = 0, showLabel = true }) {
  const percentage = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  
  let colorClass = 'green';
  if (percentage < 40) {
    colorClass = 'red';
  } else if (percentage < 75) {
    colorClass = 'amber';
  }

  return (
    <div className="progress-container">
      <div className="progress-track" title={`${current} / ${total} (${percentage}%)`}>
        <div
          className={`progress-fill ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="progress-label">{percentage}%</span>
      )}
    </div>
  );
}
