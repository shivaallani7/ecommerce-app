import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-4">ShopAzure</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Premium e-commerce experience powered by Microsoft Azure.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/products" className="hover:text-white transition-colors">All Products</Link></li>
              <li><Link href="/products?featured=true" className="hover:text-white transition-colors">Featured</Link></li>
              <li><Link href="/products?sort=salesCount&order=DESC" className="hover:text-white transition-colors">Best Sellers</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Account</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/account" className="hover:text-white transition-colors">My Account</Link></li>
              <li><Link href="/account/orders" className="hover:text-white transition-colors">Order History</Link></li>
              <li><Link href="/auth/login" className="hover:text-white transition-colors">Sign In</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} ShopAzure. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Powered by Microsoft Azure</p>
        </div>
      </div>
    </footer>
  );
}
