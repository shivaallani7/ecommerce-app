import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCartIcon, StarIcon } from '@heroicons/react/24/solid';
import { HeartIcon } from '@heroicons/react/24/outline';
import type { Product } from '../../types';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { cartService } from '../../services/cartService';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface ProductCardProps {
  product: Product;
  className?: string;
}

function getImages(raw: string): string[] {
  try { return JSON.parse(raw) as string[]; }
  catch { return []; }
}

export default function ProductCard({ product, className }: ProductCardProps) {
  const { addItem, openCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = React.useState(false);

  const images = getImages(product.images);
  const imageUrl = images[0] || '/placeholder-product.png';
  const hasDiscount = product.salePrice != null && product.salePrice < product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.price - product.salePrice!) / product.price) * 100)
    : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.stockQuantity === 0) return;

    if (!isAuthenticated) {
      addItem({ productId: product.id, name: product.name, price: product.salePrice ?? product.price, imageUrl, quantity: 1, stockQuantity: product.stockQuantity });
      openCart();
      toast.success('Added to cart');
      return;
    }

    setLoading(true);
    try {
      await cartService.addItem(product.id, 1);
      addItem({ productId: product.id, name: product.name, price: product.salePrice ?? product.price, imageUrl, quantity: 1, stockQuantity: product.stockQuantity });
      openCart();
      toast.success('Added to cart');
    } catch {
      toast.error('Failed to add item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link href={`/products/${product.slug}`} className={clsx('group block', className)}>
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">

        {/* Image */}
        <div className="relative overflow-hidden bg-neutral-50 aspect-square">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {hasDiscount && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-red-500 text-white text-xs font-semibold shadow-sm">
                -{discountPct}%
              </span>
            )}
            {product.isFeatured && !hasDiscount && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-primary-600 text-white text-xs font-semibold shadow-sm">
                Featured
              </span>
            )}
          </div>

          {/* Out of stock overlay */}
          {product.stockQuantity === 0 && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center backdrop-blur-[2px]">
              <span className="px-3 py-1.5 bg-neutral-900 text-white text-xs font-semibold rounded-lg">
                Out of Stock
              </span>
            </div>
          )}

          {/* Wishlist button */}
          <button
            className="absolute top-3 right-3 p-1.5 bg-white/90 rounded-xl shadow-sm
                       opacity-0 group-hover:opacity-100 transition-all duration-200
                       hover:bg-red-50 hover:text-red-500 text-neutral-500"
            aria-label="Add to wishlist"
            onClick={(e) => e.preventDefault()}
          >
            <HeartIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Info */}
        <div className="p-4">
          {product.brand && (
            <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-1">
              {product.brand}
            </p>
          )}
          <h3 className="text-sm font-medium text-neutral-900 line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors leading-snug">
            {product.name}
          </h3>

          {/* Stars */}
          {product.reviewCount > 0 && (
            <div className="flex items-center gap-1 mb-3">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon
                    key={star}
                    className={clsx('w-3 h-3', {
                      'text-amber-400': star <= Math.round(product.averageRating),
                      'text-neutral-200': star > Math.round(product.averageRating),
                    })}
                  />
                ))}
              </div>
              <span className="text-[11px] text-neutral-400">({product.reviewCount})</span>
            </div>
          )}

          {/* Price + CTA */}
          <div className="flex items-center justify-between gap-2 mt-auto">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-neutral-900">
                ${(product.salePrice ?? product.price).toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-neutral-400 line-through">
                  ${product.price.toFixed(2)}
                </span>
              )}
            </div>

            <button
              onClick={handleAddToCart}
              disabled={loading || product.stockQuantity === 0}
              className={clsx(
                'shrink-0 p-2 rounded-xl transition-all duration-150',
                product.stockQuantity > 0
                  ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm active:scale-95'
                  : 'bg-neutral-100 text-neutral-300 cursor-not-allowed',
              )}
              aria-label="Add to cart"
            >
              <ShoppingCartIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
