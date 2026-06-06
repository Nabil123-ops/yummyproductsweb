export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  price: number;
  salePrice?: number;
  description: string;
  category: string;
  subcategory: string;
  stockQuantity: number;
  imageUrl: string;
  galleryImages: string[];
  videoUrl?: string;
  brand: string;
  weight?: string;
  isArchived: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  ratingAverage: number;
  reviewsCount: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  banner?: string;
  icon?: string;
  order: number;
  isHidden: boolean;
  subcategories: string[];
}

export interface Review {
  id: string;
  productId: string;
  productName: string;
  customerName: string;
  rating: number;
  text: string;
  imageUrls?: string[];
  isApproved: boolean;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  expirationDate: string;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
}

export interface OrderItem {
  productId: string;
  productName: string;
  imageUrl: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  notes?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  couponDiscount?: number;
  total: number;
  paymentMethod: 'COD' | 'WishMoney';
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface WebsiteConfig {
  freeDeliveryThreshold: number;
  deliveryFee: number;
  bannerText: string;
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  whatsappNumber: string;
  email: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'admin';
  text: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  customerName: string;
  messages: ChatMessage[];
  lastUpdated: string;
  isUnreadForAdmin: boolean;
  isUnreadForUser: boolean;
}
