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
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
  try {
    const [productsRes, categoriesRes] = await Promise.all([
      fetch(`${baseUrl}/products/featured`),
      fetch(`${baseUrl}/categories`),
    ]);
    const productsData = await productsRes.json();
    const categoriesData = await categoriesRes.json();
    return {
      props: {
        featuredProducts: productsData.data || [],
        categories: categoriesData.data || [],
      },
      revalidate: 300, // ISR – revalidate every 5 minutes
    };
  } catch {
    return { props: { featuredProducts: [], categories: [] }, revalidate: 60 };
  }
};

const Home: NextPage<HomeProps> = ({ featuredProducts, categories }) => {
  return (
    <Layout>
      {/* Hero Banner */}
      <section className="relative bg-gradient-to-br from-primary-900 via-primary-700 to-primary-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-2xl">
            <span className="inline-block badge bg-white/20 text-white mb-4 text-sm">
              New Collection 2026
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              Discover Premium Products
            </h1>
            <p className="text-lg sm:text-xl text-primary-100 mb-8">
              Shop the latest trends with fast delivery, secure payments, and unbeatable quality.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/products" className="btn-primary bg-white text-primary-700 hover:bg-primary-50 text-base px-8 py-3">
                Shop Now
              </Link>
              <Link href="/products?featured=true" className="btn-secondary border-white text-white hover:bg-white/10 text-base px-8 py-3">
                View Featured
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Category Grid */}
      {categories.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900">Shop by Category</h2>
              <p className="mt-2 text-gray-500">Find exactly what you are looking for</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.slice(0, 6).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/products?categoryId=${cat.id}`}
                  className="group flex flex-col items-center p-4 rounded-xl bg-gray-50 hover:bg-primary-50
                             border border-gray-100 hover:border-primary-200 transition-all duration-200"
                >
                  {cat.imageUrl && (
                    <img
                      src={cat.imageUrl}
                      alt={cat.name}
                      className="w-16 h-16 object-cover rounded-lg mb-3 group-hover:scale-105 transition-transform"
                    />
                  )}
                  <span className="text-sm font-medium text-gray-700 group-hover:text-primary-600 text-center">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
              <p className="mt-2 text-gray-500">Hand-picked for you</p>
            </div>
            <Link href="/products?featured=true" className="text-primary-600 hover:text-primary-700 font-medium text-sm">
              View all →
            </Link>
          </div>

          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-400 py-12">No featured products yet.</p>
          )}
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { icon: '🚚', title: 'Free Shipping', desc: 'On orders over $50' },
              { icon: '🔒', title: 'Secure Payments', desc: 'Powered by Stripe' },
              { icon: '↩️', title: '30-Day Returns', desc: 'Hassle-free returns' },
              { icon: '💬', title: '24/7 Support', desc: 'Always here to help' },
            ].map((badge) => (
              <div key={badge.title} className="flex flex-col items-center">
                <span className="text-3xl mb-2">{badge.icon}</span>
                <h3 className="font-semibold text-gray-900">{badge.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{badge.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Home;
