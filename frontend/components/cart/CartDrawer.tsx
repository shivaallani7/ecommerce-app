import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { XMarkIcon, TrashIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { cartService } from '../../services/cartService';
import toast from 'react-hot-toast';

export default function CartDrawer() {
  const { items, isOpen, closeCart, updateItem, removeItem, itemCount } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.08;
  const shipping = subtotal >= 50 ? 0 : 9.99;
  const total = subtotal + tax + shipping;

  const handleQuantityChange = async (productId: string, newQty: number) => {
    if (newQty < 1) {
      handleRemove(productId);
      return;
    }
    updateItem(productId, newQty);
    if (isAuthenticated) {
      try {
        await cartService.updateItem(productId, newQty);
      } catch {
        toast.error('Failed to update cart');
      }
    }
  };

  const handleRemove = async (productId: string) => {
    removeItem(productId);
    if (isAuthenticated) {
      try {
        await cartService.removeItem(productId);
      } catch {
        toast.error('Failed to remove item');
      }
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 transition-opacity"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white z-50 shadow-2xl
                    transform transition-transform duration-300
                    ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            Shopping Cart {itemCount > 0 && <span className="text-gray-500 text-base">({itemCount})</span>}
          </h2>
          <button onClick={closeCart} className="p-2 hover:bg-gray-100 rounded-lg">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(100vh - 260px)' }}>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <p className="text-lg">Your cart is empty</p>
              <button onClick={closeCart} className="mt-3 text-primary-600 hover:underline text-sm">
                Continue Shopping
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.productId} className="flex gap-3">
                <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  <Image
                    src={item.imageUrl || '/placeholder-product.png'}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 line-clamp-2">{item.name}</p>
                  <p className="text-sm font-bold text-primary-600 mt-1">${item.price.toFixed(2)}</p>
                  <div className="flex items-center mt-2 space-x-2">
                    <button
                      onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                      className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center
                                 hover:bg-gray-100 transition-colors"
                    >
                      <MinusIcon className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                      disabled={item.quantity >= item.stockQuantity}
                      className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center
                                 hover:bg-gray-100 transition-colors disabled:opacity-40"
                    >
                      <PlusIcon className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleRemove(item.productId)}
                      className="ml-auto text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary */}
        {items.length > 0 && (
          <div className="border-t p-4 space-y-3">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax (8%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{shipping === 0 ? <span className="text-green-600">Free</span> : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {subtotal < 50 && (
              <p className="text-xs text-gray-500 text-center">
                Add ${(50 - subtotal).toFixed(2)} more for free shipping
              </p>
            )}

            <Link
              href={isAuthenticated ? '/checkout' : '/auth/login?redirect=/checkout'}
              onClick={closeCart}
              className="btn-primary w-full text-center"
            >
              Checkout
            </Link>
            <button onClick={closeCart} className="btn-secondary w-full text-sm py-2">
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}
