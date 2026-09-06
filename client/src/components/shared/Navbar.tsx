import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext';
import { useCart } from '../../features/cart/context/CartContext';
import { LanguageSwitcher } from './LanguageSwitcher';

export function Navbar() {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout, hasRole } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const canUseCart = user?.role === 'consumer';

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = isMobileDrawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileDrawerOpen]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileDrawerOpen(false);
    setIsUserMenuOpen(false);
  };

  const getDashboardLink = () => {
    if (hasRole(['admin'])) return '/admin';
    if (hasRole(['farmer'])) return '/farmer';
    return '/profile';
  };

  const closeMobileDrawer = () => setIsMobileDrawerOpen(false);

  const navClasses = `sticky top-0 z-40 transition-all duration-500 ${
    isScrolled
      ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg shadow-green-900/5 border-b border-green-100/50'
      : 'bg-transparent'
  }`;

  return (
    <>
      <nav className={navClasses}>
        {/* Decorative top gradient line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-600 via-emerald-500 to-amber-500" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg shadow-green-600/30 group-hover:shadow-xl group-hover:shadow-green-600/40 transition-all duration-300 group-hover:scale-105">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent">
                  GreenCart
                </span>
                <span className="text-xs text-green-600/70 font-medium -mt-1 hidden sm:block">
                  Farm to Home
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-6 xl:gap-8">
              <div className="flex items-center gap-4 xl:gap-6">
                <Link
                  to="/products"
                  className="relative text-gray-700 dark:text-gray-200 hover:text-green-700 dark:hover:text-green-400 font-medium transition-colors group text-sm xl:text-base"
                >
                  {t('nav.products')}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-green-600 to-emerald-500 group-hover:w-full transition-all duration-300" />
                </Link>
                {user?.role === 'consumer' && (
                  <Link
                    to="/orders"
                    className="relative text-gray-700 dark:text-gray-200 hover:text-green-700 dark:hover:text-green-400 font-medium transition-colors group text-sm xl:text-base"
                  >
                    📦 My Orders
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-green-600 to-emerald-500 group-hover:w-full transition-all duration-300" />
                  </Link>
                )}
                <LanguageSwitcher />
              </div>

              <div className="h-6 w-px bg-green-200/50" />

              {/* Cart icon — desktop */}
              {canUseCart && (
                <Link
                  to="/cart"
                  className="relative p-2.5 text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl transition-all duration-300"
                  aria-label="Shopping cart"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-gradient-to-br from-green-500 to-emerald-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
                      {totalItems}
                    </span>
                  )}
                </Link>
              )}

              {isAuthenticated ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-3 p-2 pr-4 text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-800/60 rounded-2xl transition-all duration-300 border border-transparent hover:border-green-200/50"
                  >
                    <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md text-sm">
                      {user?.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium hidden xl:block max-w-[100px] truncate text-sm">{user?.name}</span>
                    <svg className={`w-4 h-4 text-green-600 transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-3 w-56 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl shadow-green-900/10 border border-green-100/50 dark:border-gray-700/50 py-2 animate-fade-in-up z-50">
                      <div className="px-4 py-3 border-b border-green-100/50 dark:border-gray-700/50">
                        <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{user?.name}</p>
                        <p className="text-xs text-green-600 dark:text-green-400 truncate">{user?.email}</p>
                      </div>
                      <Link
                        to={getDashboardLink()}
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                        {t('nav.dashboard')}
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        {t('nav.logout')}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    to="/login"
                    className="text-gray-700 dark:text-gray-200 hover:text-green-700 dark:hover:text-green-400 font-medium transition-colors text-sm xl:text-base relative group"
                  >
                    {t('nav.login')}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-green-600 to-emerald-500 group-hover:w-full transition-all duration-300" />
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 xl:px-6 py-2 xl:py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium shadow-lg shadow-green-600/30 hover:shadow-xl hover:shadow-green-600/40 hover:-translate-y-0.5 transition-all duration-300 text-sm xl:text-base"
                  >
                    {t('nav.register')}
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile right side — cart + hamburger */}
            <div className="flex items-center gap-2 lg:hidden">
              {/* Cart icon always visible on mobile for consumers */}
              {canUseCart && (
                <Link
                  to="/cart"
                  className="relative p-2.5 min-h-[40px] min-w-[40px] flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl transition-all duration-300"
                  aria-label="Shopping cart"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-gradient-to-br from-green-500 to-emerald-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
                      {totalItems}
                    </span>
                  )}
                </Link>
              )}

              {/* Hamburger */}
              <button
                onClick={() => setIsMobileDrawerOpen(true)}
                className="p-2.5 min-h-[40px] min-w-[40px] flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-green-700 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl transition-all duration-300"
                aria-label="Open menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* ── Mobile Slide-in Drawer ─────────────────────────────────────────────── */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
          isMobileDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      >
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={closeMobileDrawer}
        />

        {/* Drawer panel */}
        <div
          className={`absolute top-0 right-0 h-full w-72 sm:w-80 bg-white dark:bg-gray-900 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
            isMobileDrawerOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Drawer header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="font-bold text-gray-900 dark:text-white text-lg">GreenCart</span>
            </div>
            <button
              onClick={closeMobileDrawer}
              className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User info (if logged in) */}
          {isAuthenticated && (
            <div className="px-5 py-4 bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-800/50">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {user?.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{user?.name}</p>
                  <p className="text-xs text-green-600 dark:text-green-400 truncate">{user?.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Drawer nav links */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            <Link
              to="/products"
              onClick={closeMobileDrawer}
              className="flex items-center gap-3 px-4 py-3 min-h-[48px] text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-400 rounded-xl font-medium transition-colors"
            >
              <svg className="w-5 h-5 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {t('nav.products')}
            </Link>

            {canUseCart && (
              <Link
                to="/cart"
                onClick={closeMobileDrawer}
                className="flex items-center justify-between gap-3 px-4 py-3 min-h-[48px] text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-400 rounded-xl font-medium transition-colors"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {t('nav.cart')}
                </div>
                {totalItems > 0 && (
                  <span className="bg-gradient-to-br from-green-500 to-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    {totalItems}
                  </span>
                )}
              </Link>
            )}

            {user?.role === 'consumer' && (
              <Link
                to="/orders"
                onClick={closeMobileDrawer}
                className="flex items-center gap-3 px-4 py-3 min-h-[48px] text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-400 rounded-xl font-medium transition-colors"
              >
                <span className="text-xl">📦</span>
                My Orders
              </Link>
            )}

            {isAuthenticated ? (
              <>
                <Link
                  to={getDashboardLink()}
                  onClick={closeMobileDrawer}
                  className="flex items-center gap-3 px-4 py-3 min-h-[48px] text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-400 rounded-xl font-medium transition-colors"
                >
                  <svg className="w-5 h-5 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  {t('nav.dashboard')}
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={closeMobileDrawer}
                  className="flex items-center gap-3 px-4 py-3 min-h-[48px] text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-400 rounded-xl font-medium transition-colors"
                >
                  <svg className="w-5 h-5 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  {t('nav.login')}
                </Link>
              </>
            )}

            {/* Language Switcher in drawer */}
            <div className="px-4 py-3">
              <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mb-2 uppercase tracking-wide">Language</p>
              <LanguageSwitcher />
            </div>
          </nav>

          {/* Drawer footer actions */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 min-h-[48px] text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-medium transition-colors"
              >
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                {t('nav.logout')}
              </button>
            ) : (
              <Link
                to="/register"
                onClick={closeMobileDrawer}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 min-h-[48px] bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-green-600/30 transition-all duration-300 hover:-translate-y-0.5"
              >
                {t('nav.register')}
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
