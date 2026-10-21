import React from 'react';

export default function StatusBadge({ status, type = 'status' }) {
  if (!status) return null;

  let badgeClass = 'badge-neutral';
  const val = String(status).trim();

  // Camp status
  if (val === 'Active') badgeClass = 'badge-success';
  else if (val === 'Full') badgeClass = 'badge-warning';
  else if (val === 'Closed') badgeClass = 'badge-neutral';

  // Priority
  else if (val === 'High') badgeClass = 'badge-danger';
  else if (val === 'Medium') badgeClass = 'badge-warning';
  else if (val === 'Low') badgeClass = 'badge-info';

  // Dispatch Status
  else if (val === 'Pending') badgeClass = 'badge-warning';
  else if (val === 'In Transit') badgeClass = 'badge-info';
  else if (val === 'Delivered') badgeClass = 'badge-success';
  else if (val === 'Cancelled') badgeClass = 'badge-neutral';

  // Stock Status
  else if (val === 'Low Stock' || val === 'Critical') badgeClass = 'badge-danger';
  else if (val === 'Adequate' || val === 'In Stock') badgeClass = 'badge-success';

  // Donation Type
  else if (val === 'Cash') badgeClass = 'badge-teal';
  else if (val === 'In-Kind') badgeClass = 'badge-purple';

  return (
    <span className={`status-badge ${badgeClass}`}>
      {val}
    </span>
  );
}
