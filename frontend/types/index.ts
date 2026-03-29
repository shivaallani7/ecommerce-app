// ── Shared Types ────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ── User ────────────────────────────────────────────────────────────────
export type UserRole = 'customer' | 'admin';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ── Category ────────────────────────────────────────────────────────────
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  children?: Category[];
  sortOrder: number;
}

// ── Product ─────────────────────────────────────────────────────────────
export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  price: number;
  salePrice?: number;
  sku?: string;
  stockQuantity: number;
  isActive: boolean;
  isFeatured: boolean;
  images: string; // JSON string
  brand?: string;
  tags?: string;
  averageRating: number;
  reviewCount: number;
  salesCount: number;
  categoryId: string;
  category?: Category;
  reviews?: Review[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  featured?: boolean;
  sort?: 'price' | 'averageRating' | 'salesCount' | 'createdAt' | 'name';
  order?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

// ── Review ──────────────────────────────────────────────────────────────
export interface Review {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  title?: string;
  body?: string;
  isVerifiedPurchase: boolean;
  helpfulVotes: number;
  createdAt: string;
  user?: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatarUrl'>;
}

// ── Cart ────────────────────────────────────────────────────────────────
export interface CartItem {
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
  stockQuantity: number;
}

export interface Cart {
  userId: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  updatedAt: string;
}

// ── Order ───────────────────────────────────────────────────────────────
export type OrderStatus =
  | 'pending' | 'confirmed' | 'processing'
  | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImageUrl?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ShippingAddress {
  street: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  totalAmount: number;
  shippingAddress: string;
  notes?: string;
  trackingNumber?: string;
  stripePaymentIntentId?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

// ── Dashboard ───────────────────────────────────────────────────────────
export interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  pendingOrders: number;
  totalProducts: number;
  lowStockProducts: number;
  revenue: {
    last30Days: number;
    last7Days: number;
  };
}
