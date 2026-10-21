import React, { useState, useRef, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useCurrentUser } from '../context/UserContext'
import { useAlertStatus } from '../api/hooks'
import { useCulture } from '../context/CultureContext'
import { useTranslation, LanguageSwitcher } from '../i18n'
import { useToast } from './Toast'
import { Badge, Spinner } from './index'
import { AjrakStrip } from './AjrakPattern'
import { Footer } from './Footer'
import {
  TrendingUp,
  Store,
  Bell,
  Package,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Calculator,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react'

export const Layout: React.FC = () => {
  const { currentUser, isFarmer, isBuyer, logout, loading } = useCurrentUser()
  const { cultureEnabled, toggleCulture, theme, toggleTheme } = useCulture()
  const { t, isRTL } = useTranslation()
  const { triggeredCount } = useAlertStatus()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  // Track previous triggered count to show toast on increase
  const prevCountRef = useRef<number | null>(null)
  useEffect(() => {
    if (prevCountRef.current !== null && triggeredCount > prevCountRef.current) {
      const diff = triggeredCount - prevCountRef.current
      toast.info(`🔔 ${diff} ${t('common.triggered')}`)
    }
    prevCountRef.current = triggeredCount
  }, [triggeredCount, toast, t])

  // 1. Loading state during initial session check
  if (loading) {
    return (
      <div className="min-h-screen bg-background dark:bg-background-dark flex flex-col items-center justify-center p-4">
        <div className="text-4xl mb-3 animate-bounce">🌾</div>
        <Spinner size="md" label={t('common.loading')} />
      </div>
    )
  }

  // 2. Auth guard: if not logged in, redirect to onboarding
  if (!currentUser && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  // 3. Buyer route guard: buyers cannot access farmer-only routes
  const farmerOnlyPaths = [
    '/alerts',
    '/my-listings',
    '/listings/new',
    '/calculator',
  ]
  const isVisitingFarmerRoute = farmerOnlyPaths.some(
    (prefix) => location.pathname === prefix || location.pathname.startsWith(`${prefix}/`),
  )
  if (isBuyer && isVisitingFarmerRoute) {
    return <Navigate to="/prices" replace />
  }

  const handleLogout = () => {
    logout()
    setUserMenuOpen(false)
    navigate('/onboarding', { replace: true })
  }

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark flex flex-col text-gray-900 dark:text-gray-100 transition-colors duration-200">
      {/* Sticky Header with translucent blur and thin Ajrak strip at bottom edge */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-forest-950/90 backdrop-blur-md shadow-2xs border-b border-gray-100 dark:border-forest-800/80">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between">
          {/* Logo */}
          <div
            onClick={() => navigate('/prices')}
            className="flex items-center space-x-2.5 rtl:space-x-reverse cursor-pointer select-none group"
          >
            <div className="w-9 h-9 rounded-xl bg-forest-50 dark:bg-forest-900 border border-forest-200/60 dark:border-forest-700/60 flex items-center justify-center text-xl shadow-2xs group-hover:scale-105 transition-transform">
              🌾
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-forest dark:text-white">
                {t('app.name')}
              </span>
              <span className="hidden sm:inline-block ml-2 rtl:ml-0 rtl:mr-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {t('app.regionTag')}
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          {currentUser && (
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5 rtl:space-x-reverse">
              <NavLink
                to="/prices"
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-xl text-xs lg:text-sm font-semibold transition flex items-center space-x-1.5 rtl:space-x-reverse ${
                    isActive
                      ? 'bg-forest dark:bg-forest-800 text-neon font-bold shadow-2xs'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-forest-900 hover:text-gray-900 dark:hover:text-white'
                  }`
                }
              >
                <TrendingUp className="w-4 h-4 rtl-flip" />
                <span>{t('nav.prices')}</span>
              </NavLink>

              <NavLink
                to="/marketplace"
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-xl text-xs lg:text-sm font-semibold transition flex items-center space-x-1.5 rtl:space-x-reverse ${
                    isActive
                      ? 'bg-forest dark:bg-forest-800 text-neon font-bold shadow-2xs'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-forest-900 hover:text-gray-900 dark:hover:text-white'
                  }`
                }
              >
                <Store className="w-4 h-4" />
                <span>{t('nav.marketplace')}</span>
              </NavLink>

              {isFarmer && (
                <>
                  <NavLink
                    to="/alerts"
                    className={({ isActive }) =>
                      `px-3 py-1.5 rounded-xl text-xs lg:text-sm font-semibold transition flex items-center space-x-1.5 rtl:space-x-reverse relative ${
                        isActive
                          ? 'bg-forest dark:bg-forest-800 text-neon font-bold shadow-2xs'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-forest-900 hover:text-gray-900 dark:hover:text-white'
                      }`
                    }
                  >
                    <Bell className="w-4 h-4" />
                    <span>{t('nav.alerts')}</span>
                    {triggeredCount > 0 && (
                      <span className="ml-1 rtl:ml-0 rtl:mr-1 px-1.5 py-0.2 bg-[var(--ajrak-crimson)] text-white text-[10px] font-bold rounded-full">
                        {triggeredCount}
                      </span>
                    )}
                  </NavLink>

                  <NavLink
                    to="/my-listings"
                    className={({ isActive }) =>
                      `px-3 py-1.5 rounded-xl text-xs lg:text-sm font-semibold transition flex items-center space-x-1.5 rtl:space-x-reverse ${
                        isActive
                          ? 'bg-forest dark:bg-forest-800 text-neon font-bold shadow-2xs'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-forest-900 hover:text-gray-900 dark:hover:text-white'
                      }`
                    }
                  >
                    <Package className="w-4 h-4" />
                    <span>{t('nav.myListings')}</span>
                  </NavLink>

                  <NavLink
                    to="/calculator"
                    className={({ isActive }) =>
                      `px-3 py-1.5 rounded-xl text-xs lg:text-sm font-semibold transition flex items-center space-x-1.5 rtl:space-x-reverse ${
                        isActive
                          ? 'bg-forest dark:bg-forest-800 text-neon font-bold shadow-2xs'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-forest-900 hover:text-gray-900 dark:hover:text-white'
                      }`
                    }
                  >
                    <Calculator className="w-4 h-4" />
                    <span>{t('nav.calculator')}</span>
                  </NavLink>
                </>
              )}
            </nav>
          )}

          {/* Right Controls: Language Switcher, Theme Toggle, User Profile */}
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            {/* Header Language Switcher */}
            <LanguageSwitcher variant="compact" />

            {/* User Profile / Menu */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-1.5 rtl:space-x-reverse p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-forest-900 border border-gray-200 dark:border-forest-700/60 transition"
                  aria-label="User menu"
                  aria-expanded={userMenuOpen}
                >
                  <div className="w-7 h-7 rounded-lg bg-forest dark:bg-forest-800 text-neon flex items-center justify-center text-xs font-bold shadow-2xs">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="hidden sm:block text-left rtl:text-right text-xs">
                    <div className="font-bold text-gray-900 dark:text-white truncate max-w-[100px]">
                      {currentUser.name}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>

                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-64 bg-white dark:bg-forest-950 rounded-2xl shadow-xl border border-gray-100 dark:border-forest-800 py-2 z-40 text-left rtl:text-right`}>
                      <div className="px-4 py-2 border-b border-gray-100 dark:border-forest-800">
                        <p className="text-xs font-bold text-gray-900 dark:text-white">{currentUser.name}</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400" dir="ltr">{currentUser.phone}</p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest-100 dark:bg-forest-800 text-forest dark:text-mint">
                            {currentUser.role === 'Farmer' ? t('nav.farmerBadge') : t('nav.buyerBadge')} • {currentUser.district}
                          </span>
                        </div>
                      </div>

                      {/* Cultural Patterns Toggle */}
                      <div className="px-4 py-2.5 border-b border-gray-100 dark:border-forest-800 flex items-center justify-between">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <Sparkles className="w-4 h-4 text-[var(--ajrak-crimson)]" />
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                            {t('nav.culturalPatterns')}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={toggleCulture}
                          aria-pressed={cultureEnabled}
                          className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${
                            cultureEnabled ? 'bg-forest dark:bg-neon' : 'bg-gray-300 dark:bg-gray-700'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-white dark:bg-forest-950 transition-transform ${
                              cultureEnabled ? (isRTL ? '-translate-x-4' : 'translate-x-4') : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Dark/Light Mode Toggle */}
                      <button
                        type="button"
                        onClick={toggleTheme}
                        className="w-full px-4 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-forest-900/60 flex items-center justify-between transition"
                      >
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          {theme === 'dark' ? (
                            <Sun className="w-4 h-4 text-amber-400" />
                          ) : (
                            <Moon className="w-4 h-4 text-gray-500" />
                          )}
                          <span>{t('nav.theme')}: {theme === 'dark' ? t('nav.dark') : t('nav.light')}</span>
                        </div>
                        <span className="text-[10px] text-gray-400">⌘T</span>
                      </button>

                      {/* Switch Profile CTA */}
                      <button
                        onClick={() => {
                          setUserMenuOpen(false)
                          navigate('/onboarding')
                        }}
                        className="w-full px-4 py-2.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-forest-900/60 flex items-center space-x-2 rtl:space-x-reverse transition"
                      >
                        <UserIcon className="w-4 h-4 text-gray-500" />
                        <span>{t('nav.switchUser')}</span>
                      </button>

                      {/* Log Out */}
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center space-x-2 rtl:space-x-reverse transition border-t border-gray-100 dark:border-forest-800"
                      >
                        <LogOut className="w-4 h-4 text-red-500 rtl-flip" />
                        <span>{t('nav.logout')}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => navigate('/onboarding')}
                className="px-3.5 py-1.5 rounded-xl bg-neon text-neon-dark text-xs font-bold shadow-2xs hover:brightness-105 active:scale-95 transition"
              >
                {t('common.view')}
              </button>
            )}
          </div>
        </div>

        {/* Thin Ajrak Strip running along the bottom edge of the header (Requirement 2.3 #1) */}
        <AjrakStrip height={6} variant="sm" />
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6">
        <Outlet />
      </main>

      {/* Slim Culture Footer (Requirement 2.3 #8) */}
      <Footer />

      {/* Mobile Bottom Tab Bar */}
      {currentUser && (
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-forest-950/95 backdrop-blur-md border-t border-gray-200 dark:border-forest-800 px-2 py-2 flex items-center justify-around shadow-lg"
          role="navigation"
        >
          {/* Prices Tab */}
          <NavLink
            to="/prices"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition ${
                isActive ? 'text-forest dark:text-neon font-bold' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 font-medium'
              }`
            }
          >
            <TrendingUp className="w-5 h-5 rtl-flip" />
            <span className="text-[10px] mt-0.5">{t('nav.prices')}</span>
          </NavLink>

          {/* Marketplace Tab */}
          <NavLink
            to="/marketplace"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition ${
                isActive ? 'text-forest dark:text-neon font-bold' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 font-medium'
              }`
            }
          >
            <Store className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{t('nav.marketplace')}</span>
          </NavLink>

          {/* Farmer-only tabs */}
          {isFarmer && (
            <>
              {/* Alerts Tab with Dynamic Badge */}
              <NavLink
                to="/alerts"
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition relative ${
                    isActive ? 'text-forest dark:text-neon font-bold' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 font-medium'
                  }`
                }
              >
                <div className="relative">
                  <Bell className="w-5 h-5" />
                  {triggeredCount > 0 && (
                    <span className="absolute -top-1 -right-2 px-1.5 py-0.2 bg-[var(--ajrak-crimson)] text-white text-[9px] font-bold rounded-full min-w-[16px] text-center shadow-xs">
                      {triggeredCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-0.5">{t('nav.alerts')}</span>
              </NavLink>

              {/* My Listings Tab */}
              <NavLink
                to="/my-listings"
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition ${
                    isActive ? 'text-forest dark:text-neon font-bold' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 font-medium'
                  }`
                }
              >
                <Package className="w-5 h-5" />
                <span className="text-[10px] mt-0.5">{t('nav.myListings')}</span>
              </NavLink>
            </>
          )}
        </nav>
      )}
    </div>
  )
}

export default Layout
