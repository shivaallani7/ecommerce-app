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
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
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
      // Optimistic local add for guests
      addItem({
        productId: product.id,
        name: product.name,
        price: product.salePrice ?? product.price,
        imageUrl,
        quantity: 1,
        stockQuantity: product.stockQuantity,
      });
      openCart();
      toast.success('Added to cart');
      return;
    }

    setLoading(true);
    try {
      await cartService.addItem(product.id, 1);
      addItem({
        productId: product.id,
        name: product.name,
        price: product.salePrice ?? product.price,
        imageUrl,
        quantity: 1,
        stockQuantity: product.stockQuantity,
      });
      openCart();
      toast.success('Added to cart');
    } catch {
      toast.error('Failed to add item to cart');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link href={`/products/${product.slug}`} className={clsx('group block', className)}>
      <div className="card hover:shadow-md transition-shadow duration-300">
        {/* Image */}
        <div className="relative overflow-hidden bg-gray-100 aspect-square">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
          {hasDiscount && (
            <span className="absolute top-3 left-3 badge bg-red-500 text-white text-xs">
              -{discountPct}%
            </span>
          )}
          {product.stockQuantity === 0 && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <span className="badge bg-gray-800 text-white">Out of Stock</span>
            </div>
          )}
          <button
            className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-sm
                       opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
            aria-label="Add to wishlist"
            onClick={(e) => e.preventDefault()}
          >
            <HeartIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Info */}
        <div className="p-4">
          {product.brand && (
            <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">{product.brand}</p>
          )}
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2 group-hover:text-primary-600">
            {product.name}
          </h3>

          {/* Rating */}
          {product.reviewCount > 0 && (
            <div className="flex items-center space-x-1 mb-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon
                    key={star}
                    className={clsx('w-3.5 h-3.5', {
                      'text-yellow-400': star <= Math.round(product.averageRating),
                      'text-gray-300': star > Math.round(product.averageRating),
                    })}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500">({product.reviewCount})</span>
            </div>
          )}

          {/* Price + Cart */}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline space-x-2">
              <span className="text-lg font-bold text-gray-900">
                ${(product.salePrice ?? product.price).toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-gray-400 line-through">${product.price.toFixed(2)}</span>
              )}
            </div>
            <button
              onClick={handleAddToCart}
              disabled={loading || product.stockQuantity === 0}
              className={clsx(
                'p-2 rounded-lg transition-colors',
                product.stockQuantity > 0
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed',
              )}
              aria-label="Add to cart"
            >
              <ShoppingCartIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
