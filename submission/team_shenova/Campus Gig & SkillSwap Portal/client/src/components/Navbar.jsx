// client/src/components/Navbar.jsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { 
  PlusCircle, 
  LayoutDashboard, 
  Users, 
  ShoppingBag, 
  RotateCcw, 
  Menu, 
  X, 
  ChevronDown, 
  Check, 
  GraduationCap, 
  ArrowRightLeft,
  UserPlus
} from 'lucide-react';
import api from '../services/api';
import CreateProfileModal from './CreateProfileModal';

export default function Navbar({ onShowToast }) {
  const { users, currentUser, switchUser, reloadUsers } = useUser();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [resettingSeed, setResettingSeed] = useState(false);
  const location = useLocation();

  const handleResetSeed = async () => {
    if (!window.confirm("Restore demo database to initial sample data? This will reset all gigs, applications, and reviews.")) {
      return;
    }
    try {
      setResettingSeed(true);
      await api.resetSeedData();
      await reloadUsers();
      if (onShowToast) onShowToast("Demo database successfully restored.", "success");
      window.location.reload();
    } catch (err) {
      if (onShowToast) onShowToast(`Reset failed: ${err.message}`, "error");
    } finally {
      setResettingSeed(false);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E3E9E4]">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Navigation */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#176B52] flex items-center justify-center text-white font-bold">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-semibold text-base tracking-tight text-[#202923]">
                Campus<span className="text-[#176B52]">Gig</span>
              </span>
              <span className="block text-[10px] uppercase font-medium tracking-wider text-[#68746D] -mt-1">
                Student Marketplace
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            <Link 
              to="/" 
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-standard ${
                isActive('/') 
                  ? 'bg-[#DCEBE3]/50 text-[#176B52] font-semibold' 
                  : 'text-[#68746D] hover:text-[#202923] hover:bg-[#F2F6F3]'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-[#176B52]" />
              Marketplace
            </Link>

            <Link 
              to="/gigs/create" 
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-standard ${
                isActive('/gigs/create') 
                  ? 'bg-[#DCEBE3]/50 text-[#176B52] font-semibold' 
                  : 'text-[#68746D] hover:text-[#202923] hover:bg-[#F2F6F3]'
              }`}
            >
              <PlusCircle className="w-4 h-4 text-[#176B52]" />
              Post Opportunity
            </Link>

            <Link 
              to="/dashboard" 
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-standard ${
                isActive('/dashboard') 
                  ? 'bg-[#DCEBE3]/50 text-[#176B52] font-semibold' 
                  : 'text-[#68746D] hover:text-[#202923] hover:bg-[#F2F6F3]'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-[#176B52]" />
              My Dashboard
            </Link>

            <Link 
              to="/profiles" 
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-standard ${
                isActive('/profiles') 
                  ? 'bg-[#DCEBE3]/50 text-[#176B52] font-semibold' 
                  : 'text-[#68746D] hover:text-[#202923] hover:bg-[#F2F6F3]'
              }`}
            >
              <Users className="w-4 h-4 text-[#176B52]" />
              Student Directory
            </Link>
          </div>
        </div>

        {/* Right Section: Demo Student Switcher & Profile */}
        <div className="flex items-center gap-3">
          {/* Demo User Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg border border-[#E3E9E4] bg-white hover:bg-[#F8FAF8] hover:border-[#DCEBE3] text-left transition-standard focus:outline-hidden"
              title="Switch demo student to view permissions, apply, or manage postings"
            >
              <div className="w-7 h-7 rounded-md bg-[#DCEBE3] text-[#176B52] font-semibold text-xs flex items-center justify-center">
                {currentUser?.name ? currentUser.name.split(' ').map(n=>n[0]).join('') : 'U'}
              </div>
              <div className="hidden sm:block text-left pr-1">
                <span className="block text-xs font-semibold text-[#202923] leading-tight">
                  {currentUser?.name || "Student"}
                </span>
                <span className="block text-[10px] text-[#68746D] leading-none truncate max-w-[120px]">
                  {currentUser?.department || currentUser?.major || "Undergraduate"}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#68746D]" />
            </button>

            {/* Dropdown Menu */}
            {userDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setUserDropdownOpen(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-card border border-[#E3E9E4] z-40 py-2 max-h-[85vh] overflow-y-auto">
                  <div className="px-3 pb-2 border-b border-[#E3E9E4] flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold text-[#202923]">Active Student Persona</p>
                      <p className="text-[10px] text-[#68746D]">Select a profile to test roles</p>
                    </div>
                    {currentUser && (
                      <Link
                        to={`/users/${currentUser.id}`}
                        onClick={() => setUserDropdownOpen(false)}
                        className="text-[11px] font-semibold text-[#176B52] hover:text-[#10513F]"
                      >
                        My Profile
                      </Link>
                    )}
                  </div>

                  <div className="p-2 border-b border-[#E3E9E4] bg-[#F8FAF8]">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setCreateModalOpen(true);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold text-white bg-[#176B52] hover:bg-[#10513F] transition-colors shadow-xs"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Create New Profile
                    </button>
                  </div>

                  <div className="py-1">
                    {users.map(u => {
                      const isSelected = u.id === currentUser?.id;
                      return (
                        <button
                          key={u.id}
                          onClick={() => {
                            switchUser(u.id);
                            setUserDropdownOpen(false);
                            if (onShowToast) onShowToast(`Switched persona to ${u.name}`, "info");
                          }}
                          className={`w-full text-left px-3 py-2 flex items-center justify-between transition-standard ${
                            isSelected ? 'bg-[#EEF5F1] text-[#176B52]' : 'hover:bg-[#F8FAF8] text-[#202923]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <div className={`w-7 h-7 rounded-md font-medium text-xs flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-[#176B52] text-white' : 'bg-[#E3E9E4] text-[#202923]'
                            }`}>
                              {u.name.split(' ').map(n=>n[0]).join('')}
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-medium leading-tight truncate">{u.name}</p>
                              <p className="text-[10px] text-[#68746D] truncate">{u.department || u.major}</p>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[#176B52] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2 px-3 border-t border-[#E3E9E4] mt-1">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        handleResetSeed();
                      }}
                      disabled={resettingSeed}
                      className="w-full text-left text-[11px] text-[#68746D] hover:text-[#202923] flex items-center gap-1.5 py-1"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${resettingSeed ? 'animate-spin' : ''}`} />
                      <span>{resettingSeed ? 'Resetting...' : 'Reset Demo Database'}</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-[#68746D] hover:text-[#202923] hover:bg-[#F2F6F3]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E3E9E4] bg-white px-4 py-3 space-y-1">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium ${
              isActive('/') ? 'bg-[#DCEBE3]/60 text-[#176B52]' : 'text-[#68746D]'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-[#176B52]" />
            Marketplace
          </Link>
          <Link
            to="/gigs/create"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium ${
              isActive('/gigs/create') ? 'bg-[#DCEBE3]/60 text-[#176B52]' : 'text-[#68746D]'
            }`}
          >
            <PlusCircle className="w-4 h-4 text-[#176B52]" />
            Post Opportunity
          </Link>
          <Link
            to="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium ${
              isActive('/dashboard') ? 'bg-[#DCEBE3]/60 text-[#176B52]' : 'text-[#68746D]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-[#176B52]" />
            My Dashboard
          </Link>
          <Link
            to="/profiles"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium ${
              isActive('/profiles') ? 'bg-[#DCEBE3]/60 text-[#176B52]' : 'text-[#68746D]'
            }`}
          >
            <Users className="w-4 h-4 text-[#176B52]" />
            Student Directory
          </Link>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              setCreateModalOpen(true);
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium text-[#176B52] bg-[#EEF5F1] w-full text-left"
          >
            <UserPlus className="w-4 h-4 text-[#176B52]" />
            Create Student Profile
          </button>
        </div>
      )}

      {/* Create Profile Modal */}
      <CreateProfileModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onShowToast={onShowToast}
      />
    </header>
  );
}
