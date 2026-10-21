import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Tent, 
  Package, 
  ClipboardList, 
  Truck, 
  HandCoins, 
  Users, 
  Heart,
  X 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navigation = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard.view', roles: ['admin', 'volunteer'] },
  { path: '/camps', label: 'Camps', icon: Tent, permission: 'camps.view', roles: ['admin', 'volunteer'] },
  { path: '/inventory', label: 'Inventory', icon: Package, permission: 'inventory.view', roles: ['admin'] },
  { path: '/needs', label: 'Needs', icon: ClipboardList, permission: 'needs.view', roles: ['admin', 'volunteer'] },
  { path: '/dispatches', label: 'Dispatches', icon: Truck, permission: 'dispatches.view', roles: ['admin', 'volunteer'] },
  { path: '/donations', label: 'Donations', icon: HandCoins, permission: 'donations.view', roles: ['admin'] },
  { path: '/volunteers', label: 'Volunteers', icon: Users, permission: 'volunteers.view', roles: ['admin'] },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user, hasPermission } = useAuth();
  const location = useLocation();

  const filteredNav = navigation.filter(item => 
    hasPermission(item.permission) && item.roles.includes(user?.role)
  );

  return (
    <>
      <button
        className="sidebar-toggle"
        onClick={onClose}
        aria-label="Close sidebar"
      >
        <X className="w-6 h-6 text-surface-700" />
      </button>
      
      <aside 
        className="sidebar"
        aria-label="Main navigation"
      >
        <div className="sidebar-inner">
          <div className="sidebar-brand">
            <h1 className="text-white font-bold text-xl flex items-center gap-3">
              <div className="sidebar-logo">
                <Heart className="w-5 h-5 text-white" />
              </div>
              ReliefHub
            </h1>
            <p className="sidebar-subtitle">Flood Relief Coordination</p>
          </div>
          
          <nav className="sidebar-nav" role="navigation" aria-label="Main">
            {filteredNav.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
          
          <div className="sidebar-footer">
            <p className="sidebar-footer-text">
              Together for a safer tomorrow
              <Heart className="sidebar-footer-heart" aria-hidden="true" />
              Together for a safer tomorrow
            </p>
          </div>
        </div>
      </aside>
      
      {isOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={onClose}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default Sidebar;