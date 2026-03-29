import React, { useEffect } from 'react';
import type { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import Layout from '../../components/layout/Layout';
import { useAuthStore } from '../../store/authStore';
import { orderService } from '../../services/orderService';
import type { OrderStatus } from '../../types';
import clsx from 'clsx';

const STATUS_BADGE: Record<OrderStatus, string> = {
  pending: 'badge-yellow',
  confirmed: 'badge-blue',
  processing: 'badge-blue',
  shipped: 'badge-blue',
  delivered: 'badge-green',
  cancelled: 'badge-red',
  refunded: 'badge-gray',
};

const OrderHistory: NextPage = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) router.push('/auth/login');
  }, [isAuthenticated, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => orderService.getMyOrders().then((r) => r.data),
    enabled: isAuthenticated,
  });

  return (
    <Layout title="Order History – ShopAzure">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Order History</h1>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : data?.data.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-gray-400 text-lg">No orders yet</p>
            <Link href="/products" className="btn-primary mt-4 inline-block">Start Shopping</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {data?.data.map((order) => (
              <Link key={order.id} href={`/account/orders/${order.id}`}>
                <div className="card p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-3">
                        <span className="font-semibold text-gray-900">#{order.orderNumber}</span>
                        <span className={clsx(STATUS_BADGE[order.status])}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'long', day: 'numeric',
                        })}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {order.items?.length ?? 0} item(s)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">${order.totalAmount.toFixed(2)}</p>
                      <p className="text-xs text-gray-400 mt-1 capitalize">{order.paymentStatus}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default OrderHistory;
