import React, { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Layout from '../../components/layout/Layout';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { orderService } from '../../services/orderService';
import type { ShippingAddress } from '../../types';
import toast from 'react-hot-toast';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface CheckoutFormInputs {
  firstName: string;
  lastName: string;
  email: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  notes?: string;
}

function CheckoutForm() {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const { items, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [orderId, setOrderId] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormInputs>({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      country: 'US',
    },
  });

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = subtotal * 0.08;
  const shipping = subtotal >= 50 ? 0 : 9.99;
  const total = subtotal + tax + shipping;

  const onSubmit = async (formData: CheckoutFormInputs) => {
    if (!stripe || !elements) return;
    setProcessing(true);

    const shippingAddress: ShippingAddress = {
      street: formData.street,
      city: formData.city,
      state: formData.state,
      postalCode: formData.postalCode,
      country: formData.country,
    };

    try {
      // Step 1: Create order on backend
      const orderRes = await orderService.create({ shippingAddress, notes: formData.notes });
      const { order, clientSecret: secret } = orderRes.data.data;
      setClientSecret(secret);
      setOrderId(order.id);

      // Step 2: Confirm payment with Stripe
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card element not found');

      const { error, paymentIntent } = await stripe.confirmCardPayment(secret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
          },
        },
      });

      if (error) {
        toast.error(error.message || 'Payment failed');
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        // Step 3: Confirm order on backend
        await orderService.confirm(order.id);
        clearCart();
        toast.success('Order placed successfully!');
        router.push(`/account/orders/${order.id}?success=true`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Checkout failed';
      toast.error(msg);
    } finally {
      setProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 text-lg">Your cart is empty.</p>
        <button onClick={() => router.push('/products')} className="btn-primary mt-4">
          Shop Now
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left: Shipping + Payment */}
      <div className="lg:col-span-2 space-y-8">
        {/* Shipping */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Shipping Address</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input {...register('firstName', { required: 'Required' })} className="input-field" />
              {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input {...register('lastName', { required: 'Required' })} className="input-field" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" {...register('email', { required: 'Required' })} className="input-field" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
              <input {...register('street', { required: 'Required' })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input {...register('city', { required: 'Required' })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input {...register('state')} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
              <input {...register('postalCode')} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input {...register('country', { required: 'Required' })} className="input-field" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Order Notes (optional)</label>
              <textarea {...register('notes')} rows={2} className="input-field" />
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment</h2>
          <div className="p-4 border border-gray-300 rounded-lg">
            <CardElement
              options={{
                style: {
                  base: { fontSize: '16px', color: '#1f2937', '::placeholder': { color: '#9ca3af' } },
                  invalid: { color: '#ef4444' },
                },
              }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2 flex items-center space-x-1">
            <span>🔒</span>
            <span>Your payment info is encrypted and secure via Stripe</span>
          </p>
        </div>
      </div>

      {/* Right: Order Summary */}
      <div className="lg:col-span-1">
        <div className="card p-6 sticky top-24">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
          <div className="space-y-3 mb-4">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between text-sm">
                <span className="text-gray-600 truncate flex-1 mr-2">
                  {item.name} × {item.quantity}
                </span>
                <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-3 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax (8%)</span><span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span>{shipping === 0 ? <span className="text-green-600">Free</span> : `$${shipping.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-2 border-t">
              <span>Total</span><span>${total.toFixed(2)}</span>
            </div>
          </div>
          <button
            type="submit"
            disabled={!stripe || processing}
            className="btn-primary w-full mt-6 py-3"
          >
            {processing ? 'Processing...' : `Pay $${total.toFixed(2)}`}
          </button>
        </div>
      </div>
    </form>
  );
}

const Checkout: NextPage = () => {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/checkout');
    }
  }, [isAuthenticated, router]);

  return (
    <Layout title="Checkout – ShopAzure">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>
        <Elements stripe={stripePromise}>
          <CheckoutForm />
        </Elements>
      </div>
    </Layout>
  );
};

export default Checkout;
