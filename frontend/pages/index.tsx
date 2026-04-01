import type { GetStaticProps, NextPage } from 'next';
import Link from 'next/link';
import Layout from '../components/layout/Layout';
import ProductCard from '../components/product/ProductCard';
import type { Product, Category } from '../types';

interface HomeProps {
  featuredProducts: Product[];
  categories: Category[];
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';
  try {
    const [productsRes, categoriesRes] = await Promise.all([
      fetch(`${baseUrl}/products/featured`, { signal: AbortSignal.timeout(5000) }),
      fetch(`${baseUrl}/categories`, { signal: AbortSignal.timeout(5000) }),
    ]);
    const productsData = await productsRes.json();
    const categoriesData = await categoriesRes.json();
    return {
      props: {
        featuredProducts: productsData.data || [],
        categories: categoriesData.data || [],
      },
      revalidate: 300,
    };
  } catch {
    return { props: { featuredProducts: [], categories: [] }, revalidate: 60 };
  }
};

const trustItems = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
    title: 'Free Shipping',
    desc: 'On all orders over $50',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: 'Secure Payments',
    desc: 'Protected by Stripe',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
      </svg>
    ),
    title: '30-Day Returns',
    desc: 'Hassle-free refunds',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
    ),
    title: '24/7 Support',
    desc: 'We\'re always here',
  },
];

const Home: NextPage<HomeProps> = ({ featuredProducts, categories }) => {
  return (
    <Layout>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-neutral-950 text-white">
        {/* Mesh gradient blobs */}
        <div className="absolute inset-0 pointer-events-none select-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary-600/30 rounded-full blur-3xl" />
          <div className="absolute top-10 right-0 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-36">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs font-medium border border-white/10 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-slow" />
              New Collection 2026
            </span>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6 text-balance">
              Premium products,{' '}
              <span className="bg-gradient-to-r from-primary-400 to-violet-400 bg-clip-text text-transparent">
                delivered fast.
              </span>
            </h1>
            <p className="text-lg text-neutral-400 mb-10 max-w-xl leading-relaxed">
              Shop the latest trends with secure payments and unbeatable quality — right to your door.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-neutral-900 text-sm font-semibold rounded-xl hover:bg-neutral-100 transition-colors shadow-soft"
              >
                Shop Now
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <Link
                href="/products?featured=true"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white text-sm font-semibold rounded-xl hover:bg-white/15 border border-white/10 transition-colors"
              >
                View Featured
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white pointer-events-none" />
      </section>

      {/* ── Trust bar ────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-neutral-100">
            {trustItems.map((item) => (
              <div key={item.title} className="flex items-center gap-3 px-6 py-5">
                <div className="shrink-0 p-2 bg-primary-50 text-primary-600 rounded-xl">
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">{item.title}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="py-20 bg-neutral-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="section-title">Shop by Category</h2>
                <p className="section-sub">Find exactly what you&apos;re looking for</p>
              </div>
              <Link href="/products" className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
                Browse all →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {categories.slice(0, 6).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/products?categoryId=${cat.id}`}
                  className="group flex flex-col items-center gap-3 p-5 rounded-2xl bg-white border border-neutral-200
                             hover:border-primary-300 hover:shadow-card-hover transition-all duration-200"
                >
                  {cat.imageUrl ? (
                    <img
                      src={cat.imageUrl}
                      alt={cat.name}
                      className="w-14 h-14 object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-primary-50 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                      <span className="text-2xl">🛍️</span>
                    </div>
                  )}
                  <span className="text-xs font-medium text-neutral-700 group-hover:text-primary-600 text-center transition-colors">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Featured Products ─────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="section-title">Featured Products</h2>
              <p className="section-sub">Hand-picked just for you</p>
            </div>
            <Link href="/products?featured=true" className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
              View all →
            </Link>
          </div>

          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featuredProducts.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 rounded-2xl bg-neutral-50 border border-neutral-100">
              <p className="text-neutral-400 text-sm">No featured products yet.</p>
              <Link href="/products" className="mt-4 inline-block text-sm text-primary-600 hover:underline">
                Browse all products →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────────── */}
      <section className="py-20 bg-neutral-50 border-t border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden bg-primary-600 px-8 py-16 text-center">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-primary-500/50 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-violet-500/30 rounded-full blur-3xl" />
            </div>
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 text-balance">
                Ready to start shopping?
              </h2>
              <p className="text-primary-200 mb-8 text-lg">
                Create a free account and get 10% off your first order.
              </p>
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-primary-700 text-sm font-semibold rounded-xl hover:bg-primary-50 transition-colors shadow-soft"
              >
                Get Started — It&apos;s Free
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Home;
