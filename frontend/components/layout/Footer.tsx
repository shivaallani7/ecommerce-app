import Link from 'next/link';

const footerLinks = {
  Shop: [
    { label: 'All Products',  href: '/products' },
    { label: 'Featured',      href: '/products?featured=true' },
    { label: 'Best Sellers',  href: '/products?sort=salesCount&order=DESC' },
    { label: 'New Arrivals',  href: '/products?sort=createdAt&order=DESC' },
  ],
  Account: [
    { label: 'My Account',    href: '/account' },
    { label: 'Order History', href: '/account/orders' },
    { label: 'Sign In',       href: '/auth/login' },
    { label: 'Sign Up',       href: '/auth/register' },
  ],
  Support: [
    { label: 'Help Center',      href: '/help' },
    { label: 'Contact Us',       href: '/contact' },
    { label: 'Privacy Policy',   href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-neutral-950 text-neutral-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 py-16">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-white font-bold text-lg">ShopAzure</span>
            </div>
            <p className="text-sm leading-relaxed text-neutral-500 max-w-xs">
              Premium e-commerce experience built on Microsoft Azure. Fast, secure, and always reliable.
            </p>
            <div className="flex gap-3 mt-6">
              {/* Social placeholders */}
              {['Twitter', 'Instagram', 'GitHub'].map((s) => (
                <a
                  key={s}
                  href="#"
                  aria-label={s}
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center
                             text-neutral-500 hover:bg-white/10 hover:text-white transition-colors text-[10px] font-semibold"
                >
                  {s[0]}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h4 className="text-white text-sm font-semibold mb-4">{group}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-neutral-500 hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-neutral-600">
          <p>&copy; {new Date().getFullYear()} ShopAzure. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Powered by{' '}
            <span className="text-primary-400 font-medium">Microsoft Azure</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
