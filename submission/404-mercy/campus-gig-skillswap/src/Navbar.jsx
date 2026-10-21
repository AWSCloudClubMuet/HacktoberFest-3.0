import { useState } from 'react'
import { useUser } from './UserContext'
import './Navbar.css'

const NAV_ITEMS = [
  { id: 'explore',  label: 'Explore Gigs',       icon: '🔍' },
  { id: 'post',     label: 'Post a Gig',         icon: '➕' },
  { id: 'my-gigs',  label: 'My Gigs',            icon: '📋' },
  { id: 'my-apps',  label: 'My Applications',    icon: '📨' },
  { id: 'profile',  label: 'Student Profile',    icon: '👤' },
]

export default function Navbar({ activePage, onNavigate }) {
  const { users, currentUser, switchUser } = useUser()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleNav = (pageId) => {
    onNavigate(pageId)
    setMobileMenuOpen(false)
  }

  return (
    <header className="navbar" role="banner">
      <div className="navbar-container">
        {/* Brand */}
        <a
          href="#"
          className="navbar-brand"
          onClick={(e) => {
            e.preventDefault()
            handleNav('explore')
          }}
          aria-label="Campus GigSwap Homepage"
        >
          <span className="brand-logo-mark" aria-hidden="true">🎓</span>
          <span className="brand-text-wrap">
            <span className="brand-title">Campus GigSwap</span>
            <span className="brand-badge">Demo Mode</span>
          </span>
        </a>

        {/* Mobile menu trigger */}
        <button
          className="navbar-mobile-toggle"
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          <span className="hamburger-line" />
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>

        {/* Main Nav Links */}
        <nav
          className={`navbar-navigation ${mobileMenuOpen ? 'is-open' : ''}`}
          aria-label="Primary"
        >
          <ul className="navbar-links" role="list">
            {NAV_ITEMS.map((item) => {
              const isActive = activePage === item.id
              return (
                <li key={item.id}>
                  <button
                    className={`nav-link ${isActive ? 'is-active' : ''}`}
                    onClick={() => handleNav(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className="nav-item-icon" aria-hidden="true">{item.icon}</span>
                    <span className="nav-item-label">{item.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Demo Student Selector */}
        <div className="navbar-demo-control">
          {currentUser && (
            <div className="demo-user-selector" title="Switch demo student to test different roles">
              <label htmlFor="demo-user-select" className="demo-user-label">
                Demo Student:
              </label>
              <div className="demo-user-box">
                <img
                  src={currentUser.avatar}
                  alt=""
                  className="demo-user-avatar"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
                <select
                  id="demo-user-select"
                  className="demo-user-dropdown"
                  value={currentUser.id}
                  onChange={(e) => switchUser(e.target.value)}
                  aria-label="Active Demo Student Persona"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.major})
                    </option>
                  ))}
                </select>
                <span className="demo-dropdown-arrow" aria-hidden="true">▾</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
