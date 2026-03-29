import React, { useState } from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import Image from 'next/image';
import { StarIcon, ShieldCheckIcon, TruckIcon } from '@heroicons/react/24/solid';
import { MinusIcon, PlusIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import Layout from '../../components/layout/Layout';
import type { Product } from '../../types';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { cartService } from '../../services/cartService';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface ProductDetailProps {
  product: Product | null;
}

export const getServerSideProps: GetServerSideProps<ProductDetailProps> = async ({ params }) => {
  const slug = params?.slug as string;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
  try {
    const res = await fetch(`${baseUrl}/products/slug/${slug}`);
    if (!res.ok) return { notFound: true };
    const data = await res.json();
    return { props: { product: data.data } };
  } catch {
    return { notFound: true };
  }
};

const ProductDetail: NextPage<ProductDetailProps> = ({ product }) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const { addItem, openCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  if (!product) return null;

  const images: string[] = (() => {
    try { return JSON.parse(product.images); } catch { return []; }
  })();

  const displayImages = images.length > 0 ? images : ['/placeholder-product.png'];

  const handleAddToCart = async () => {
    if (product.stockQuantity === 0) return;
    setAddingToCart(true);
    try {
      if (isAuthenticated) {
        await cartService.addItem(product.id, quantity);
      }
      addItem({
        productId: product.id,
        name: product.name,
        price: product.salePrice ?? product.price,
        imageUrl: displayImages[0],
        quantity,
        stockQuantity: product.stockQuantity,
      });
      openCart();
      toast.success('Added to cart!');
    } catch {
      toast.error('Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const discountPct = product.salePrice
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;

  return (
    <Layout title={`${product.name} – ShopAzure`} description={product.shortDescription}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100">
              <Image
                src={displayImages[selectedImage]}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
              {discountPct > 0 && (
                <span className="absolute top-4 left-4 badge bg-red-500 text-white text-sm px-3 py-1">
                  -{discountPct}%
                </span>
              )}
            </div>
            {displayImages.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {displayImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={clsx(
                      'relative aspect-square rounded-lg overflow-hidden border-2 transition-colors',
                      i === selectedImage ? 'border-primary-500' : 'border-gray-200 hover:border-gray-400',
                    )}
                  >
                    <Image src={img} alt={`View ${i + 1}`} fill className="object-cover" sizes="80px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-6">
            {product.brand && (
              <p className="text-sm font-medium text-primary-600 uppercase tracking-wide">{product.brand}</p>
            )}
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>

            {product.reviewCount > 0 && (
              <div className="flex items-center space-x-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon
                      key={star}
                      className={clsx('w-5 h-5', {
                        'text-yellow-400': star <= Math.round(product.averageRating),
                        'text-gray-200': star > Math.round(product.averageRating),
                      })}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  {product.averageRating.toFixed(1)} ({product.reviewCount} reviews)
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline space-x-3">
              <span className="text-4xl font-extrabold text-gray-900">
                ${(product.salePrice ?? product.price).toFixed(2)}
              </span>
              {product.salePrice && (
                <span className="text-xl text-gray-400 line-through">${product.price.toFixed(2)}</span>
              )}
            </div>

            {product.shortDescription && (
              <p className="text-gray-600 leading-relaxed">{product.shortDescription}</p>
            )}

            {/* Stock */}
            <div>
              {product.stockQuantity > 10 ? (
                <span className="badge-green">In Stock</span>
              ) : product.stockQuantity > 0 ? (
                <span className="badge-yellow">Only {product.stockQuantity} left</span>
              ) : (
                <span className="badge-red">Out of Stock</span>
              )}
            </div>

            {/* Quantity + Cart */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <MinusIcon className="w-4 h-4" />
                </button>
                <span className="px-6 py-3 font-medium text-lg min-w-[60px] text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                  className="px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={addingToCart || product.stockQuantity === 0}
                className="btn-primary flex-1 flex items-center justify-center space-x-2 py-3"
              >
                <ShoppingCartIcon className="w-5 h-5" />
                <span>{addingToCart ? 'Adding...' : 'Add to Cart'}</span>
              </button>
            </div>

            {/* Trust */}
            <div className="border-t pt-6 space-y-3">
              {[
                { icon: TruckIcon, text: 'Free shipping on orders over $50' },
                { icon: ShieldCheckIcon, text: '30-day hassle-free returns' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center space-x-3 text-sm text-gray-600">
                  <Icon className="w-5 h-5 text-primary-600 flex-shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Description + Reviews */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Description</h2>
            <div className="prose max-w-none text-gray-600 leading-relaxed">
              {product.description || 'No description available.'}
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Details</h2>
            <dl className="space-y-3 text-sm">
              {product.sku && (
                <div className="flex justify-between"><dt className="text-gray-500">SKU</dt><dd className="font-medium">{product.sku}</dd></div>
              )}
              {product.brand && (
                <div className="flex justify-between"><dt className="text-gray-500">Brand</dt><dd className="font-medium">{product.brand}</dd></div>
              )}
              {product.category && (
                <div className="flex justify-between"><dt className="text-gray-500">Category</dt><dd className="font-medium">{product.category.name}</dd></div>
              )}
            </dl>
          </div>
        </div>

        {/* Reviews Section */}
        {product.reviews && product.reviews.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
            <div className="space-y-6">
              {product.reviews.map((review) => (
                <div key={review.id} className="card p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <StarIcon
                              key={s}
                              className={clsx('w-4 h-4', s <= review.rating ? 'text-yellow-400' : 'text-gray-200')}
                            />
                          ))}
                        </div>
                        {review.isVerifiedPurchase && (
                          <span className="badge-green text-xs">Verified Purchase</span>
                        )}
                      </div>
                      {review.title && <p className="font-semibold text-gray-900">{review.title}</p>}
                    </div>
                    <span className="text-sm text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {review.body && <p className="mt-2 text-gray-600 text-sm">{review.body}</p>}
                  {review.user && (
                    <p className="mt-2 text-xs text-gray-400">
                      — {review.user.firstName} {review.user.lastName}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProductDetail;
