import React, { useState, useCallback } from 'react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import Layout from '../../components/layout/Layout';
import ProductCard from '../../components/product/ProductCard';
import { productService } from '../../services/productService';
import type { ProductFilters } from '../../types';
import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

const SORT_OPTIONS = [
  { label: 'Newest', value: 'createdAt-DESC' },
  { label: 'Price: Low to High', value: 'price-ASC' },
  { label: 'Price: High to Low', value: 'price-DESC' },
  { label: 'Best Rated', value: 'averageRating-DESC' },
  { label: 'Best Selling', value: 'salesCount-DESC' },
];

const Products: NextPage = () => {
  const router = useRouter();
  const {
    search, categoryId, minPrice, maxPrice, sort = 'createdAt-DESC', page = '1',
  } = router.query as Record<string, string>;

  const [priceMin, setPriceMin] = useState(minPrice || '');
  const [priceMax, setPriceMax] = useState(maxPrice || '');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const currentPage = parseInt(page) || 1;
  const [sortField, sortOrder] = (sort as string).split('-') as [string, 'ASC' | 'DESC'];

  const filters: ProductFilters = {
    search: search as string,
    categoryId: categoryId as string,
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    sort: sortField as ProductFilters['sort'],
    order: sortOrder,
    page: currentPage,
    limit: 20,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => productService.getAll(filters).then((r) => r.data),
  });

  const updateQuery = useCallback(
    (updates: Record<string, string>) => {
      router.push({
        pathname: '/products',
        query: { ...router.query, ...updates, page: '1' },
      });
    },
    [router],
  );

  const applyPriceFilter = () => {
    updateQuery({ minPrice: priceMin, maxPrice: priceMax });
  };

  return (
    <Layout title="Products – ShopAzure">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {search ? `Results for "${search}"` : 'All Products'}
            </h1>
            {data && (
              <p className="text-sm text-gray-500 mt-1">
                {data.pagination.total} products found
              </p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={sort}
              onChange={(e) => updateQuery({ sort: e.target.value })}
              className="input-field py-2 text-sm w-48"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="flex items-center space-x-1 btn-secondary py-2 px-4 text-sm"
            >
              <AdjustmentsHorizontalIcon className="w-4 h-4" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {filtersOpen && (
          <div className="mb-6 p-4 bg-white rounded-xl border border-gray-200 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Price</label>
                <input
                  type="number"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  placeholder="$0"
                  className="input-field py-2"
                  min={0}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Price</label>
                <input
                  type="number"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  placeholder="No limit"
                  className="input-field py-2"
                  min={0}
                />
              </div>
              <div className="flex items-end space-x-2">
                <button onClick={applyPriceFilter} className="btn-primary py-2 flex-1">
                  Apply
                </button>
                <button
                  onClick={() => {
                    setPriceMin(''); setPriceMax('');
                    router.push('/products');
                  }}
                  className="btn-secondary py-2 flex-1"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="aspect-square bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : data?.data.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-xl">No products found</p>
            <button onClick={() => router.push('/products')} className="mt-4 text-primary-600 hover:underline">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {data?.data.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && data.pagination.totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-10">
            <button
              disabled={!data.pagination.hasPrev}
              onClick={() => updateQuery({ page: String(currentPage - 1) })}
              className="btn-secondary py-2 px-4 text-sm disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {data.pagination.page} of {data.pagination.totalPages}
            </span>
            <button
              disabled={!data.pagination.hasNext}
              onClick={() => updateQuery({ page: String(currentPage + 1) })}
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

export default Products;
