import { useState } from 'react';
import { Bell, User, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Header = ({ onMenuClick, sidebarOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-brand">
          <button
            className="lg:hidden header-icon-btn"
            onClick={onMenuClick}
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={sidebarOpen}
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="header-logo">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="header-title">ReliefHub</h1>
            <p className="header-subtitle">Flood Relief Coordination</p>
          </div>
        </div>

        <div className="header-actions">
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="header-icon-btn"
              aria-label="Notifications"
              aria-expanded={notificationsOpen}
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-surface-200 py-2 z-50">
                <p className="px-4 py-2 text-sm font-medium text-surface-900 border-b border-surface-200">Notifications</p>
                <p className="px-4 py-6 text-sm text-surface-500 text-center">No new notifications</p>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="header-avatar"
              aria-label="User menu"
              aria-expanded={profileOpen}
            >
              <div className="header-avatar-img">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="header-avatar-name">{user?.name}</p>
                <p className="header-avatar-role">Relief Coordinator</p>
              </div>
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-surface-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-surface-200">
                  <p className="text-sm font-medium text-surface-900">{user?.name}</p>
                  <p className="text-xs text-surface-500 capitalize">Relief Coordinator</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;