import React from 'react';
import { AlertTriangle, Check, Circle, Clock3, Truck, X } from 'lucide-react';

export function StatusBadge({ status }) {
  const s = String(status || '').toLowerCase();
  
  if (s === 'open') {
    return <span className="badge badge-open"><Circle size={8} fill="currentColor" /> Open</span>;
  }
  if (s === 'full') {
    return <span className="badge badge-full"><Circle size={8} fill="currentColor" /> Full</span>;
  }
  if (s === 'closed') {
    return <span className="badge badge-closed"><Circle size={8} fill="currentColor" /> Closed</span>;
  }
  
  if (s === 'pending') {
    return <span className="badge badge-pending"><Clock3 size={12} /> Pending</span>;
  }
  if (s === 'in transit') {
    return <span className="badge badge-transit"><Truck size={12} /> In Transit</span>;
  }
  if (s === 'delivered') {
    return <span className="badge badge-delivered"><Check size={12} /> Delivered</span>;
  }
  if (s === 'cancelled') {
    return <span className="badge badge-cancelled"><X size={12} /> Cancelled</span>;
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
  return <span className="badge badge-lowstock"><AlertTriangle size={12} /> Low Stock</span>;
}
