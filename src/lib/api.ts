import { Product, Category, Review, Coupon, Order, WebsiteConfig } from '../types';
import { initialProducts } from '../data/initialProducts';
import { initialCategories } from '../data/initialCategories';

// Initialize full local state for static environments (GitHub Pages, Static hosting, or ZIP exports)
const isBrowser = typeof window !== 'undefined';

function getLocalData<T>(key: string, defaultValue: T): T {
  if (!isBrowser) return defaultValue;
  const val = localStorage.getItem(key);
  if (!val) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(val);
  } catch {
    return defaultValue;
  }
}

function setLocalData<T>(key: string, data: T) {
  if (!isBrowser) return;
  localStorage.setItem(key, JSON.stringify(data));
}

// Ensure local seed is active
const localProducts = () => getLocalData<Product[]>('yummy_local_products', initialProducts);
const localCategories = () => getLocalData<Category[]>('yummy_local_categories', initialCategories);
const localReviews = () => getLocalData<Review[]>('yummy_local_reviews', []);
const localCoupons = () => getLocalData<Coupon[]>('yummy_local_coupons', [
  { id: 'c-1', code: 'YUMMY2026', type: 'percentage', value: 10, expirationDate: '2026-12-31', usageLimit: 100, usageCount: 0, isActive: true },
  { id: 'c-2', code: 'WISH5', type: 'fixed', value: 5, expirationDate: '2026-08-31', usageLimit: 50, usageCount: 0, isActive: true }
]);
const localOrders = () => getLocalData<Order[]>('yummy_local_orders', []);

export async function fetchConfig(): Promise<WebsiteConfig> {
  try {
    const res = await fetch('/api/config');
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Server API not available. Running in static mode.", e);
  }
  return getLocalData<WebsiteConfig>('yummy_local_config', {
    freeDeliveryThreshold: 100,
    deliveryFee: 4,
    bannerText: "✨ FREE DELIVERY ON ORDERS OVER $100 — FRESH BEAUTY IN LEBANON! ✨",
    facebookUrl: "https://www.facebook.com/yummmy.lb",
    instagramUrl: "https://www.instagram.com/yummyproducts.lb/?fbclid=IwAR1MwdGFACVRrhwS-zxASmR7I1y7qW8NQfHwhftUPPxemU7odkOmAvn6Rps",
    tiktokUrl: "https://www.tiktok.com/@yummylb?_t=8kru9j0QYRW&_r=1",
    whatsappNumber: "+96176477025",
    email: "yummyproductslb@gmail.com"
  });
}

export async function updateConfig(data: Partial<WebsiteConfig>): Promise<WebsiteConfig> {
  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) return await res.json();
  } catch {}
  
  const current = await fetchConfig();
  const updated = { ...current, ...data };
  setLocalData('yummy_local_config', updated);
  return updated;
}

export async function fetchCategories(): Promise<Category[]> {
  try {
    const res = await fetch('/api/categories');
    if (res.ok) return await res.json();
  } catch {}
  return localCategories();
}

export async function createCategory(cat: Omit<Category, 'id'>): Promise<Category> {
  try {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cat)
    });
    if (res.ok) return await res.json();
  } catch {}

  const list = localCategories();
  const created: Category = { ...cat, id: 'cat-' + Date.now() };
  setLocalData('yummy_local_categories', [...list, created]);
  return created;
}

export async function updateCategory(id: string, cat: Partial<Category>): Promise<Category> {
  try {
    const res = await fetch(`/api/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cat)
    });
    if (res.ok) return await res.json();
  } catch {}

  const list = localCategories();
  const updatedIdx = list.findIndex(c => c.id === id);
  if (updatedIdx === -1) throw new Error("Category not found");
  const updatedCat = { ...list[updatedIdx], ...cat };
  const updatedList = [...list];
  updatedList[updatedIdx] = updatedCat;
  setLocalData('yummy_local_categories', updatedList);
  return updatedCat;
}

export async function deleteCategory(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    if (res.ok) return true;
  } catch {}

  const list = localCategories();
  setLocalData('yummy_local_categories', list.filter(c => c.id !== id));
  return true;
}

export async function fetchProducts(): Promise<Product[]> {
  try {
    const res = await fetch('/api/products');
    if (res.ok) return await res.json();
  } catch {}
  return localProducts();
}

export async function createProduct(prod: Omit<Product, 'id' | 'ratingAverage' | 'reviewsCount'>): Promise<Product> {
  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prod)
    });
    if (res.ok) return await res.json();
  } catch {}

  const list = localProducts();
  const created: Product = {
    ...prod,
    id: 'p-' + (list.length + 1) + '-' + Math.floor(Math.random() * 1000),
    ratingAverage: 5.0,
    reviewsCount: 0
  };
  setLocalData('yummy_local_products', [...list, created]);
  return created;
}

export async function updateProduct(id: string, prod: Partial<Product>): Promise<Product> {
  try {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prod)
    });
    if (res.ok) return await res.json();
  } catch {}

  const list = localProducts();
  const idx = list.findIndex(p => p.id === id);
  if (idx === -1) throw new Error("Product not found");
  const updatedProd = { ...list[idx], ...prod };
  const updatedList = [...list];
  updatedList[idx] = updatedProd;
  setLocalData('yummy_local_products', updatedList);
  return updatedProd;
}

export async function duplicateProduct(id: string): Promise<Product> {
  try {
    const res = await fetch(`/api/products/duplicate/${id}`, { method: 'POST' });
    if (res.ok) return await res.json();
  } catch {}

  const list = localProducts();
  const target = list.find(p => p.id === id);
  if (!target) throw new Error("Product not found");
  const duplicated: Product = {
    ...target,
    id: 'p-' + Date.now(),
    name: target.name + ' (Copy)',
    sku: target.sku + '-COPY'
  };
  setLocalData('yummy_local_products', [...list, duplicated]);
  return duplicated;
}

export async function deleteProduct(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (res.ok) return true;
  } catch {}

  const list = localProducts();
  setLocalData('yummy_local_products', list.filter(p => p.id !== id));
  return true;
}

export async function submitImportProducts(importedProducts: any[]): Promise<any> {
  try {
    const res = await fetch('/api/products/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products: importedProducts })
    });
    if (res.ok) return await res.json();
  } catch {}

  const list = localProducts();
  const formatted = importedProducts.map((p, idx) => ({
    id: 'p-imp-' + Date.now() + '-' + idx,
    name: p.name || 'Imported Product',
    sku: p.sku || 'SKU-' + Date.now() + '-' + idx,
    barcode: p.barcode || '',
    price: Number(p.price) || 0,
    salePrice: p.salePrice ? Number(p.salePrice) : undefined,
    description: p.description || '',
    category: p.category || 'Accessories',
    subcategory: p.subcategory || 'Accessories',
    stockQuantity: Number(p.stockQuantity) || 10,
    imageUrl: p.imageUrl || 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400',
    galleryImages: p.galleryImages || [],
    brand: p.brand || 'Yummy Products',
    isArchived: false,
    ratingAverage: 5.0,
    reviewsCount: 0
  }));
  const newList = [...list, ...formatted];
  setLocalData('yummy_local_products', newList);
  return { status: 'success', count: formatted.length };
}

export async function fetchImportLogs(): Promise<any[]> {
  try {
    const res = await fetch('/api/import-logs');
    if (res.ok) return await res.json();
  } catch {}
  return getLocalData<any[]>('yummy_local_import_logs', []);
}

export async function fetchCoupons(): Promise<Coupon[]> {
  try {
    const res = await fetch('/api/coupons');
    if (res.ok) return await res.json();
  } catch {}
  return localCoupons();
}

export async function createCoupon(coupon: Omit<Coupon, 'id' | 'usageCount' | 'isActive'>): Promise<Coupon> {
  try {
    const res = await fetch('/api/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(coupon)
    });
    if (res.ok) return await res.json();
  } catch {}

  const list = localCoupons();
  const created: Coupon = { ...coupon, id: 'c-' + Date.now(), usageCount: 0, isActive: true };
  setLocalData('yummy_local_coupons', [...list, created]);
  return created;
}

export async function deleteCoupon(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/coupons/${id}`, { method: 'DELETE' });
    if (res.ok) return true;
  } catch {}

  const list = localCoupons();
  setLocalData('yummy_local_coupons', list.filter(c => c.id !== id));
  return true;
}

export async function fetchReviews(): Promise<Review[]> {
  try {
    const res = await fetch('/api/reviews');
    if (res.ok) return await res.json();
  } catch {}
  return localReviews();
}

export async function submitReview(review: Omit<Review, 'id' | 'isApproved' | 'createdAt'>): Promise<Review> {
  try {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(review)
    });
    if (res.ok) return await res.json();
  } catch {}

  const list = localReviews();
  const created: Review = {
    ...review,
    id: 'r-' + Date.now(),
    isApproved: true,
    createdAt: new Date().toISOString()
  };
  setLocalData('yummy_local_reviews', [...list, created]);
  return created;
}

export async function updateReview(id: string, data: Partial<Review>): Promise<Review> {
  try {
    const res = await fetch(`/api/reviews/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) return await res.json();
  } catch {}

  const list = localReviews();
  const idx = list.findIndex(r => r.id === id);
  if (idx === -1) throw new Error("Review not found");
  const updatedRev = { ...list[idx], ...data };
  const updatedList = [...list];
  updatedList[idx] = updatedRev;
  setLocalData('yummy_local_reviews', updatedList);
  return updatedRev;
}

export async function deleteReview(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/reviews/${id}`, { method: 'DELETE' });
    if (res.ok) return true;
  } catch {}

  const list = localReviews();
  setLocalData('yummy_local_reviews', list.filter(r => r.id !== id));
  return true;
}

export async function fetchOrders(): Promise<Order[]> {
  try {
    const res = await fetch('/api/orders');
    if (res.ok) return await res.json();
  } catch {}
  return localOrders();
}

export async function createOrder(order: Omit<Order, 'id' | 'status' | 'createdAt'>): Promise<Order> {
  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
    if (res.ok) return await res.json();
  } catch {}

  const list = localOrders();
  const created: Order = {
    ...order,
    id: 'ord-' + Date.now(),
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  setLocalData('yummy_local_orders', [...list, created]);
  return created;
}

export async function updateOrderStatus(id: string, status: 'pending' | 'completed' | 'cancelled'): Promise<Order> {
  try {
    const res = await fetch(`/api/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) return await res.json();
  } catch {}

  const list = localOrders();
  const idx = list.findIndex(o => o.id === id);
  if (idx === -1) throw new Error("Order not found");
  const updatedOrder = { ...list[idx], status };
  const updatedList = [...list];
  updatedList[idx] = updatedOrder;
  setLocalData('yummy_local_orders', updatedList);
  return updatedOrder;
}

export async function uploadImage(image: string, name?: string): Promise<{ imageUrl: string }> {
  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image, name })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("Server upload not available. Running in static mode.", e);
  }
  // Fall back to returning base64 directly so it still saves and loads perfectly offline!
  return { imageUrl: image };
}
