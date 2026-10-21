import React from 'react';

export function StatusBadge({ status }) {
  const s = String(status || '').toLowerCase();
  
  if (s === 'open') {
    return <span className="badge badge-open">🟢 Open</span>;
  }
  if (s === 'full') {
    return <span className="badge badge-full">🔴 Full</span>;
  }
  if (s === 'closed') {
    return <span className="badge badge-closed">⚪ Closed</span>;
  }
  
  if (s === 'pending') {
    return <span className="badge badge-pending">⏳ Pending</span>;
  }
  if (s === 'in transit') {
    return <span className="badge badge-transit">🚚 In Transit</span>;
  }
  if (s === 'delivered') {
    return <span className="badge badge-delivered">✅ Delivered</span>;
  }
  if (s === 'cancelled') {
    return <span className="badge badge-cancelled">❌ Cancelled</span>;
  }

  return <span className="badge">{status}</span>;
}

export function PriorityBadge({ priority }) {
  const p = String(priority || '').toLowerCase();
  if (p === 'high') {
    return <span className="badge badge-high">▲ High</span>;
  }
  if (p === 'medium') {
    return <span className="badge badge-medium">■ Medium</span>;
  }
  if (p === 'low') {
    return <span className="badge badge-low">▼ Low</span>;
  }
  return <span className="badge">{priority}</span>;
}

export function LowStockBadge() {
  return <span className="badge badge-lowstock">⚠️ Low Stock</span>;
}
