import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export default function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  onClick, 
  accent = 'teal', // 'teal' | 'amber' | 'blue' | 'purple' | 'red'
  badgeText 
}) {
  const isClickable = typeof onClick === 'function';

  return (
    <div 
      className={`stat-card accent-${accent} ${isClickable ? 'clickable' : ''}`}
      onClick={isClickable ? onClick : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>
        {Icon && (
          <div className="stat-card-icon-wrap">
            <Icon size={18} />
          </div>
        )}
      </div>

      <div className="stat-card-main">
        <div className="stat-card-value-row">
          <span className="stat-card-value">{value}</span>
          {badgeText && <span className="stat-card-badge">{badgeText}</span>}
        </div>
        {subtitle && <p className="stat-card-subtitle">{subtitle}</p>}
      </div>

      {isClickable && (
        <div className="stat-card-footer">
          <span className="stat-card-link-text">View details</span>
          <ArrowUpRight size={14} />
        </div>
      )}
    </div>
  );
}
