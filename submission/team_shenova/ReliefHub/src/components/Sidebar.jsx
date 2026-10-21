import React from 'react';
import { 
  LayoutDashboard, 
  Tent, 
  Package, 
  ClipboardList, 
  Truck, 
  HeartHandshake, 
  Users, 
  ChevronLeft, 
  ChevronRight,
  Shield,
  LifeBuoy
} from 'lucide-react';

export default function Sidebar({ 
  currentPage, 
  onSelectPage, 
  isCollapsed, 
  onToggleCollapse,
  userRole,
  onToggleRole
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'camps', label: 'Camps', icon: Tent },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'needs', label: 'Camp Needs', icon: ClipboardList },
    { id: 'dispatches', label: 'Dispatches', icon: Truck },
    { id: 'donations', label: 'Donations', icon: HeartHandshake },
    { id: 'volunteers', label: 'Volunteers', icon: Users },
  ];

  return (
    <aside className={`app-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-logo-icon">
          <LifeBuoy size={20} className="brand-icon" />
        </div>
        {!isCollapsed && (
          <div className="brand-text-block">
            <span className="brand-name">ReliefHub</span>
            <span className="brand-subtext">Sindh Flood Relief</span>
          </div>
        )}
      </div>

      {/* Navigation List */}
      <nav className="sidebar-nav" aria-label="Main Navigation">
        <ul className="nav-list">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <li key={item.id} className="nav-item">
                <button
                  type="button"
                  className={`nav-button ${isActive ? 'active' : ''}`}
                  onClick={() => onSelectPage(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon size={18} className="nav-icon" />
                  {!isCollapsed && <span className="nav-label">{item.label}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Role Demonstration Switcher */}
      <div className="sidebar-footer">
        {!isCollapsed && (
          <div className="role-switcher-card">
            <div className="role-header">
              <Shield size={14} className="text-teal" />
              <span className="role-title">Active Role</span>
            </div>
            <select
              value={userRole}
              onChange={(e) => onToggleRole(e.target.value)}
              className="role-dropdown"
              aria-label="Select demo role"
            >
              <option value="Admin">Relief Coordinator (Admin)</option>
              <option value="Volunteer">Field Volunteer (Read-Only)</option>
            </select>
            <span className="role-hint">
              {userRole === 'Admin' ? 'Full operational CRUD enabled' : 'Read-only access mode'}
            </span>
          </div>
        )}

        {/* Collapse Toggle */}
        <button
          type="button"
          className="sidebar-collapse-toggle"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!isCollapsed && <span>Collapse Sidebar</span>}
        </button>
      </div>
    </aside>
  );
}
