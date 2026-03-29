import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  ShoppingCartIcon,
  UserIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
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

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
        setSearchQuery('');
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
      toast.success('Logged out successfully');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary-600">ShopAzure</span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-full text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-600"
              >
                <MagnifyingGlassIcon className="w-5 h-5" />
              </button>
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            <button
              onClick={openCart}
              className="relative p-2 text-gray-600 hover:text-primary-600 transition-colors"
              aria-label="Open cart"
            >
              <ShoppingCartIcon className="w-6 h-6" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center
                                 rounded-full bg-primary-600 text-white text-xs font-bold">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </button>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 p-2 text-gray-600 hover:text-primary-600">
                  <UserIcon className="w-6 h-6" />
                  <span className="hidden sm:block text-sm font-medium">{user?.firstName}</span>
                </button>
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200
                                rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100
                                group-hover:visible transition-all duration-200 z-50">
                  <div className="py-1">
                    <Link href="/account" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      My Account
                    </Link>
                    <Link href="/account/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      Order History
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" className="block px-4 py-2 text-sm text-primary-600 hover:bg-gray-50">
                        Admin Panel
                      </Link>
                    )}
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Link href="/auth/login" className="text-sm font-medium text-gray-600 hover:text-primary-600">
                  Sign In
                </Link>
                <Link href="/auth/register" className="btn-primary text-sm py-2 px-4">
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600"
            >
              {mobileMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 space-y-3 animate-fade-in">
            <form onSubmit={handleSearch}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="input-field"
              />
            </form>
            <nav className="space-y-1">
              <Link href="/products" className="block px-2 py-2 text-sm text-gray-700 hover:text-primary-600">
                All Products
              </Link>
              {isAuthenticated ? (
                <>
                  <Link href="/account" className="block px-2 py-2 text-sm text-gray-700">My Account</Link>
                  <button onClick={handleLogout} className="block w-full text-left px-2 py-2 text-sm text-red-600">
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="block px-2 py-2 text-sm text-gray-700">Sign In</Link>
                  <Link href="/auth/register" className="block px-2 py-2 text-sm text-primary-600">Sign Up</Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
