import React, { useState } from 'react';
import type { NextPage } from 'next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../../components/layout/Layout';
import { useAuthStore } from '../../store/authStore';
import { productService } from '../../services/productService';
import api from '../../services/api';
import type { Product } from '../../types';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const AdminProducts: NextPage = () => {
  const { isAdmin } = useAuthStore();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', page],
    queryFn: () => productService.getAll({ page, limit: 20 }).then((r) => r.data),
    enabled: isAdmin,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product deleted');
    },
    onError: () => toast.error('Failed to delete product'),
  });

  const handleDelete = (product: Product) => {
    if (!confirm(`Delete "${product.name}"? This action cannot be undone.`)) return;
    deleteMutation.mutate(product.id);
  };

  const handleImageUpload = async (productId: string, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await api.post<{ success: boolean; data: { url: string } }>(
        '/admin/upload/image',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      toast.success('Image uploaded');
      return res.data.data.url;
    } catch {
      toast.error('Image upload failed');
    }
  };

  if (!isAdmin) return null;

  return (
    <Layout title="Manage Products – Admin">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <button className="btn-primary flex items-center space-x-2">
            <PlusIcon className="w-5 h-5" />
            <span>Add Product</span>
          </button>
        </div>

        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Product', 'SKU', 'Price', 'Stock', 'Status', 'Rating', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-12" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-12" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16" /></td>
                    </tr>
                  ))
                : data?.data.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div>
                            <p className="text-sm font-medium text-gray-900 max-w-[200px] truncate">
                              {product.name}
                            </p>
                            {product.brand && (
                              <p className="text-xs text-gray-500">{product.brand}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{product.sku || '—'}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        ${(product.salePrice ?? product.price).toFixed(2)}
                        {product.salePrice && (
                          <span className="ml-1 text-xs text-gray-400 line-through">
                            ${product.price.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-medium ${product.stockQuantity < 10 ? 'text-red-600' : 'text-gray-900'}`}>
                          {product.stockQuantity}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={product.isActive ? 'badge-green' : 'badge-gray'}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {product.averageRating.toFixed(1)} ({product.reviewCount})
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.pagination.totalPages > 1 && (
          <div className="flex justify-center items-center space-x-3 mt-6">
            <button
              disabled={!data.pagination.hasPrev}
              onClick={() => setPage((p) => p - 1)}
              className="btn-secondary py-2 px-4 text-sm disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              {page} / {data.pagination.totalPages}
            </span>
            <button
              disabled={!data.pagination.hasNext}
              onClick={() => setPage((p) => p + 1)}
              className="btn-secondary py-2 px-4 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminProducts;
