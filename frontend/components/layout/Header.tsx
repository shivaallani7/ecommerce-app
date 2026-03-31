import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  ShoppingCartIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';

export default function Header() {
  const router = useRouter();
  const { user, isAuthenticated, isAdmin, logout } = useAuthStore();
  const { itemCount, openCart } = useCartStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
        setSearchQuery('');
        setMobileMenuOpen(false);
      }
    },
    [searchQuery, router],
  );

  const handleLogout = async () => {
    try {
      await authService.logout();
    } finally {
      logout();
      router.push('/');
      toast.success('Signed out');
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass border-b border-neutral-200/80 shadow-soft' : 'bg-white border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-lg font-bold text-neutral-900 hidden sm:block">ShopAzure</span>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/products"
              className="btn-ghost text-sm"
            >
              All Products
            </Link>
            <Link
              href="/products?featured=true"
              className="btn-ghost text-sm"
            >
              Featured
            </Link>
            <Link
              href="/products?sort=salesCount&order=DESC"
              className="btn-ghost text-sm"
            >
              Best Sellers
            </Link>
          </nav>

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-sm">
            <div className="relative w-full">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products…"
                className="w-full pl-9 pr-4 py-2 bg-neutral-100 border border-transparent rounded-xl text-sm
                           text-neutral-900 placeholder-neutral-400
                           focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-100 focus:outline-none
                           transition-all duration-150"
              />
            </div>
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            {/* Cart */}
            <button
              onClick={openCart}
              className="relative p-2 rounded-xl text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
              aria-label="Open cart"
            >
              <ShoppingCartIcon className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center
                                 rounded-full bg-primary-600 text-white text-[10px] font-bold ring-2 ring-white">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </button>

            {/* User */}
            {isAuthenticated ? (
              <div className="relative group">
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-neutral-600
                                   hover:bg-neutral-100 hover:text-neutral-900 transition-colors">
                  <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-700 text-xs font-semibold">
                      {user?.firstName?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden sm:block text-sm font-medium">{user?.firstName}</span>
                  <ChevronDownIcon className="hidden sm:block w-3.5 h-3.5 text-neutral-400" />
                </button>

                <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-neutral-200
                                rounded-2xl shadow-soft opacity-0 invisible group-hover:opacity-100
                                group-hover:visible transition-all duration-200 z-50 py-1.5 animate-fade-in">
                  <div className="px-3 py-2 border-b border-neutral-100 mb-1">
                    <p className="text-xs text-neutral-400">Signed in as</p>
                    <p className="text-sm font-medium text-neutral-900 truncate">{user?.email}</p>
                  </div>
                  <Link href="/account" className="flex items-center px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg mx-1">
                    My Account
                  </Link>
                  <Link href="/account/orders" className="flex items-center px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg mx-1">
                    Order History
                  </Link>
                  {isAdmin && (
                    <Link href="/admin" className="flex items-center px-3 py-2 text-sm text-primary-600 font-medium hover:bg-primary-50 rounded-lg mx-1">
                      Admin Panel
                    </Link>
                  )}
                  <div className="border-t border-neutral-100 my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg mx-1 flex items-center"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2 ml-1">
                <Link href="/auth/login" className="btn-ghost text-sm">
                  Sign In
                </Link>
                <Link href="/auth/register" className="btn-primary text-sm">
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-neutral-600 hover:bg-neutral-100 transition-colors"
            >
              {mobileMenuOpen ? <XMarkIcon className="w-5 h-5" /> : <Bars3Icon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-100 bg-white animate-slide-up">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-3">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products…"
                  className="input-field pl-9"
                />
              </div>
            </form>
            <nav className="space-y-1">
              {[
                { href: '/products', label: 'All Products' },
                { href: '/products?featured=true', label: 'Featured' },
                { href: '/products?sort=salesCount&order=DESC', label: 'Best Sellers' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg"
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-neutral-100 pt-2">
                {isAuthenticated ? (
                  <>
                    <Link href="/account" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg">
                      My Account
                    </Link>
                    <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">
                      Sign Out
                    </button>
                  </>
                ) : (
                  <div className="flex gap-2 pt-1">
                    <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)} className="btn-secondary flex-1 justify-center text-sm">
                      Sign In
                    </Link>
                    <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)} className="btn-primary flex-1 justify-center text-sm">
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
