import React, { useState, useEffect, useRef } from 'react';
import {
  X, BarChart2, Package, Layers, ShoppingCart, Star, Tag, Settings,
  Upload, Sparkles, Check, Trash2, Edit3, Copy, Eye, EyeOff, Plus, FileText,
  AlertTriangle, RefreshCw, RefreshCcw, Landmark, Users, ArrowUpRight, TrendingUp,
  MessageSquare, MessageCircle, Send
} from 'lucide-react';
import { Product, Category, Review, Coupon, Order, WebsiteConfig } from '../types';
import {
  updateConfig, createCategory, updateCategory, deleteCategory,
  createProduct, updateProduct, deleteProduct, duplicateProduct,
  submitImportProducts, fetchImportLogs, createCoupon, deleteCoupon,
  updateReview, deleteReview, updateOrderStatus, uploadImage
} from '../lib/api';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  categories: Category[];
  reviews: Review[];
  coupons: Coupon[];
  orders: Order[];
  config: WebsiteConfig;
  onRefreshData: () => void;
  onProductClick: (product: Product) => void;
}

export default function AdminPanel({
  isOpen,
  onClose,
  products,
  categories,
  reviews,
  coupons,
  orders,
  config,
  onRefreshData,
  onProductClick,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'products' | 'categories' | 'orders' | 'reviews' | 'coupons' | 'import' | 'settings' | 'chats'>('analytics');
  
  // States for products edit/delete Actions
  const [isEditingProduct, setIsEditingProduct] = useState<Product | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [prodForm, setProdForm] = useState<Partial<Product>>({});

  // States for categories edits
  const [isEditingCategory, setIsEditingCategory] = useState<Category | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [catForm, setCatForm] = useState<Partial<Category>>({});
  const [isUploadingCircle, setIsUploadingCircle] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingProductImg, setIsUploadingProductImg] = useState(false);

  // Coupon creator
  const [isCreatingCoupon, setIsCreatingCoupon] = useState(false);
  const [couponForm, setCouponForm] = useState<Partial<Coupon>>({
    code: '',
    type: 'percentage',
    value: 10,
    expirationDate: '2026-12-31'
  });

  // Settings State
  const [settingsForm, setSettingsForm] = useState<WebsiteConfig>(config);

  // Excel/CSV import Sync Engine States
  const [csvText, setCsvText] = useState('');
  const [importedPreview, setImportedPreview] = useState<any[]>([]);
  const [importLogHistory, setImportLogHistory] = useState<any[]>([]);
  const [importReport, setImportReport] = useState<{ created: number; updated: number; errors: string[] } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Support Live Chat States
  const [chatSessions, setChatSessions] = useState<any[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const chatPollRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchChatSessions = async () => {
    try {
      const res = await fetch('/api/chats');
      if (res.ok) {
        const data = await res.json();
        data.sort((a: any, b: any) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
        setChatSessions(data);
      }
    } catch (err) {
      console.error("Error loading support chats", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchChatSessions();
      chatPollRef.current = setInterval(fetchChatSessions, 4000);
    }
    return () => {
      if (chatPollRef.current) clearInterval(chatPollRef.current);
    };
  }, [isOpen, activeTab]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatSessions, selectedChatId]);

  useEffect(() => {
    setSettingsForm(config);
  }, [config]);

  useEffect(() => {
    if (activeTab === 'import') {
      fetchImportLogs().then(setImportLogHistory).catch(console.error);
    }
  }, [activeTab]);

  if (!isOpen) return null;

  // Calculators for Analytics Dashboard
  const totalRevenue = orders.filter(o => o.status === 'completed').reduce((acc, o) => acc + o.total, 0);
  const pendingRevenue = orders.filter(o => o.status === 'pending').reduce((acc, o) => acc + o.total, 0);
  const totalOrdersCount = orders.length;
  const completedOrdersCount = orders.filter(o => o.status === 'completed').length;
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;

  const lowStockProducts = products.filter(p => p.stockQuantity <= 5 && !p.isArchived);

  // Top Products calculations
  const productSalesMap: { [name: string]: { qty: number; rev: number } } = {};
  orders.filter(o => o.status === 'completed').forEach(order => {
    order.items.forEach(item => {
      if (!productSalesMap[item.productName]) {
        productSalesMap[item.productName] = { qty: 0, rev: 0 };
      }
      productSalesMap[item.productName].qty += item.quantity;
      productSalesMap[item.productName].rev += item.price * item.quantity;
    });
  });

  const topProducts = Object.entries(productSalesMap)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // CSV Parsing Engine
  const parseCSV = (text: string) => {
    if (!text.trim()) return;
    const lines = text.split('\n');
    if (lines.length < 2) return;

    // Detect header mapping
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    
    const parsedData: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle simple comma separation (and optionally handle quotes briefly)
      let values: string[] = [];
      let inQuote = false;
      let currentVal = '';
      
      for (let charIdx = 0; charIdx < line.length; charIdx++) {
        const char = line[charIdx];
        if (char === '"' || char === '“' || char === '”') {
          inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
          values.push(currentVal.trim());
          currentVal = '';
        } else {
          currentVal += char;
        }
      }
      values.push(currentVal.trim());

      const rowObj: any = {};
      headers.forEach((header, colIdx) => {
        let val = values[colIdx] || '';
        // remove quote surrounds
        val = val.replace(/^"|"$/g, '').trim();
        rowObj[header] = val;
      });

      if (rowObj.product_name) {
        parsedData.push(rowObj);
      }
    }

    setImportedPreview(parsedData);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const executeCsvImportSubmit = async () => {
    if (importedPreview.length === 0) return;
    try {
      const report = await submitImportProducts(importedPreview);
      setImportReport({
        created: report.createdCount,
        updated: report.updatedCount,
        errors: report.errors
      });
      setImportedPreview([]);
      setCsvText('');
      onRefreshData();
      // update logs
      const updatedLogs = await fetchImportLogs();
      setImportLogHistory(updatedLogs);
    } catch (err) {
      console.error(err);
    }
  };

  // Product submission forms
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditingProduct) {
        await updateProduct(isEditingProduct.id, prodForm);
        setIsEditingProduct(null);
      } else {
        await createProduct(prodForm as any);
        setIsCreatingProduct(false);
      }
      setProdForm({});
      onRefreshData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingProductImg(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const uploadRes = await uploadImage(base64String, prodForm.name || 'product-main');
        setProdForm(prev => ({ ...prev, imageUrl: uploadRes.imageUrl }));
        setIsUploadingProductImg(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Product photo upload failed", err);
      setIsUploadingProductImg(false);
    }
  };

  // Category submission
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditingCategory) {
        await updateCategory(isEditingCategory.id, catForm);
        setIsEditingCategory(null);
      } else {
        await createCategory(catForm as any);
        setIsCreatingCategory(false);
      }
      setCatForm({});
      onRefreshData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCategoryCircleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingCircle(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const uploadRes = await uploadImage(base64String, catForm.name || 'category-circle');
        setCatForm(prev => ({ ...prev, image: uploadRes.imageUrl }));
        setIsUploadingCircle(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Circle photo upload failed", err);
      setIsUploadingCircle(false);
    }
  };

  const handleCategoryBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingBanner(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const uploadRes = await uploadImage(base64String, (catForm.name || 'category-banner') + '-banner');
        setCatForm(prev => ({ ...prev, banner: uploadRes.imageUrl }));
        setIsUploadingBanner(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Banner photo upload failed", err);
      setIsUploadingBanner(false);
    }
  };

  // Coupon build
  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCoupon(couponForm as any);
      setIsCreatingCoupon(false);
      setCouponForm({
        code: '',
        type: 'percentage',
        value: 10,
        expirationDate: '2026-12-31'
      });
      onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  // Settings update
  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateConfig(settingsForm);
      onRefreshData();
      alert('Global configuration saved successfully!');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6 bg-gray-950/70 backdrop-blur-xs">
      <div className="relative w-full h-full bg-slate-50 md:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-w-7xl animate-scale-in">
        
        {/* Top bar header dashboard */}
        <div className="bg-slate-900 text-white p-5 flex justify-between items-center select-none shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl animate-spin-slow">🌸</span>
            <div>
              <h2 className="font-serif font-black tracking-wide text-lg sm:text-xl">YummyProducts Central Moderator</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Yummybody Lebanon Admin Dashboard • yummy2023</p>
            </div>
          </div>

          <button
            id="btn-admin-close"
            onClick={onClose}
            className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors focus:outline-hidden"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Inner modular tabs workspace */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Navigation Sidebar Panel */}
          <div className="w-full md:w-60 bg-slate-900 border-r border-slate-800 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible md:overflow-y-auto shrink-0 select-none scrollbar-none gap-0.5 p-2">
            {[
              { id: 'analytics', label: 'Dashboard', icon: BarChart2 },
              { id: 'products', label: 'Products Catalogs', icon: Package },
              { id: 'categories', label: 'Categories Organizer', icon: Layers },
              { id: 'orders', label: 'Order Deliveries', icon: ShoppingCart },
              { id: 'reviews', label: 'Moderation Appraisals', icon: Star },
              { id: 'coupons', label: 'Promotional Coupons', icon: Tag },
              { id: 'chats', label: 'Live Support Chat', icon: MessageSquare, hasBadge: chatSessions.some(c => c.isUnreadForAdmin) },
              { id: 'import', label: 'Excel & CSV Sync', icon: Upload },
              { id: 'settings', label: 'Core Settings', icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  id={`tab-btn-${tab.id}`}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center justify-between px-4 py-3 text-xs md:text-sm font-semibold rounded-xl transition-all cursor-pointer truncate shrink-0 ${
                    activeTab === tab.id
                      ? 'bg-pink-650 text-white shadow-xs font-bold leading-none'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4.5 w-4.5" />
                    <span>{tab.label}</span>
                  </span>
                  {tab.hasBadge && (
                    <span className="h-2 w-2 rounded-full bg-rose-550 animate-ping absolute right-3" style={{ backgroundColor: '#ff0055' }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Core active workspace space container */}
          <div className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
            
            {/* ANALYTICS DASHBOARD VIEW */}
            {activeTab === 'analytics' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center flex-wrap gap-2 pb-2">
                  <div>
                    <h3 className="text-xl font-serif font-black text-gray-950">Analytics Overview</h3>
                    <p className="text-xs text-gray-500">Real-time e-commerce operational intelligence inside Lebanon.</p>
                  </div>
                  <button
                    onClick={onRefreshData}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-xs font-bold border border-slate-200 rounded-lg hover:bg-slate-50 focus:outline-hidden"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Refresh Analytics
                  </button>
                </div>

                {/* KPI scorecards grid widgets */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">DELIVERED REVENUE</span>
                    <strong className="text-2xl font-black text-gray-900 block mt-1.5 font-mono">${totalRevenue.toFixed(2)}</strong>
                    <span className="text-[10px] text-green-600 font-extrabold flex items-center gap-0.5 mt-2">
                      <TrendingUp className="h-3 w-3" /> Approved COD Payments
                    </span>
                  </div>

                  <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">PENDING REVENUE</span>
                    <strong className="text-2xl font-black text-pink-650 block mt-1.5 font-mono">${pendingRevenue.toFixed(2)}</strong>
                    <span className="text-[10px] text-pink-500 font-extrabold flex items-center gap-0.5 mt-2">
                      💸 In Process / Wish Money
                    </span>
                  </div>

                  <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">COMPLETED ORDERS</span>
                    <strong className="text-2xl font-black text-gray-900 block mt-1.5 font-mono">{completedOrdersCount}</strong>
                    <p className="text-[11px] text-slate-400 mt-2 font-medium">Out of {totalOrdersCount} orders placed</p>
                  </div>

                  <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">PENDING DISPATCH</span>
                    <strong className="text-2xl font-black text-amber-600 block mt-1.5 font-mono">{pendingOrdersCount}</strong>
                    <p className="text-[11px] text-amber-500 mt-2 font-semibold">Immediate WhatsApp outreach needed</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  
                  {/* Top-Selling products list */}
                  <div className="bg-white p-5 border border-slate-100 rounded-2xl lg:col-span-3">
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Sparkles className="h-4.5 w-4.5 text-pink-500" /> Best-Selling Cosmetics
                    </h4>
                    {topProducts.length > 0 ? (
                      <div className="divide-y divide-slate-100">
                        {topProducts.map((p, idx) => (
                          <div key={idx} className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                            <div className="min-w-0 flex items-center gap-3">
                              <span className="text-xs font-black text-slate-400 font-mono w-4">#{idx+1}</span>
                              <strong className="text-sm text-gray-900 truncate font-semibold block">{p.name}</strong>
                            </div>
                            <div className="text-right">
                              <strong className="text-sm font-bold text-slate-900">{p.qty} items</strong>
                              <span className="text-[10px] text-gray-400 block font-mono font-medium">${p.rev.toFixed(2)} rev</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <p className="text-xs text-gray-450">No completed sales recorded yet.</p>
                      </div>
                    )}
                  </div>

                  {/* Operational Warnings / Low stock parameters */}
                  <div className="bg-white p-5 border border-slate-100 rounded-2xl lg:col-span-2">
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <AlertTriangle className="h-4.5 w-4.5 text-amber-500" /> Low Stock Alerts
                    </h4>
                    {lowStockProducts.length > 0 ? (
                      <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                        {lowStockProducts.map((prod) => (
                          <div key={prod.id} className="bg-red-50/50 border border-red-100/50 p-3 rounded-xl flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                              <strong className="text-xs font-bold text-red-950 truncate block">{prod.name}</strong>
                              <span className="text-[9px] uppercase tracking-wide text-red-500 block font-semibold mt-0.5">{prod.sku} • {prod.category}</span>
                            </div>
                            <span className="px-2.5 py-1 text-xs font-black text-red-700 bg-white border border-red-200 rounded-lg">
                              {prod.stockQuantity} Left
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 py-10 text-center font-medium">💚 All premium products are fully stocked!</p>
                    )}
                  </div>

                </div>
              </div>
            )}

            {/* PRODUCTS DIRECTORY VIEW */}
            {activeTab === 'products' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center flex-wrap gap-3">
                  <div>
                    <h3 className="text-xl font-serif font-black text-gray-900">Products Catalog Directory</h3>
                    <p className="text-xs text-gray-500">Edit, duplicate, archive or restore any skincare product on the fly.</p>
                  </div>
                  <button
                    onClick={() => {
                      setProdForm({});
                      setIsEditingProduct(null);
                      setIsCreatingProduct(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-pink-650 hover:bg-pink-700 text-white font-bold text-xs rounded-xl shadow-xs transition-transform hover:scale-101 outline-hidden"
                  >
                    <Plus className="h-4 w-4" /> Add Premium Product
                  </button>
                </div>

                {/* Creator / Editor Dialog */}
                {(isCreatingProduct || isEditingProduct) && (
                  <div className="bg-white p-5 border border-pink-100 rounded-2xl shadow-md">
                    <h4 className="font-serif font-semibold text-base text-gray-900 mb-4 pb-2 border-b border-pink-50">
                      {isEditingProduct ? `Edit Listing "${isEditingProduct.name}"` : 'Create New Luxury Listing'}
                    </h4>
                    <form onSubmit={handleProductSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Product Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Lavender Body Oil"
                            value={prodForm.name || ''}
                            onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                            className="w-full text-xs border border-pink-100 rounded-xl px-3.5 py-2.5 outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">SKU Unique ID</label>
                          <input
                            type="text"
                            placeholder="e.g. BODY-OIL-LAV"
                            value={prodForm.sku || ''}
                            onChange={(e) => setProdForm({ ...prodForm, sku: e.target.value })}
                            className="w-full text-xs border border-pink-100 rounded-xl px-3.5 py-2.5 outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Weight / Volume</label>
                          <input
                            type="text"
                            placeholder="e.g. 120ml"
                            value={prodForm.weight || ''}
                            onChange={(e) => setProdForm({ ...prodForm, weight: e.target.value })}
                            className="w-full text-xs border border-pink-100 rounded-xl px-3.5 py-2.5 outline-hidden"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Base Price ($)</label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={prodForm.price || ''}
                            onChange={(e) => setProdForm({ ...prodForm, price: parseFloat(e.target.value) })}
                            className="w-full text-xs border border-pink-100 rounded-xl px-3.5 py-2.5 outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Sale Price ($ - Optional)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={prodForm.salePrice || ''}
                            onChange={(e) => setProdForm({ ...prodForm, salePrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                            className="w-full text-xs border border-pink-100 rounded-xl px-3.5 py-2.5 outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Current Stock Level</label>
                          <input
                            type="number"
                            required
                            value={prodForm.stockQuantity || ''}
                            onChange={(e) => setProdForm({ ...prodForm, stockQuantity: parseInt(e.target.value) })}
                            className="w-full text-xs border border-pink-100 rounded-xl px-3.5 py-2.5 outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Beauty Brand</label>
                          <input
                            type="text"
                            value={prodForm.brand || ''}
                            placeholder="Yummy Products"
                            onChange={(e) => setProdForm({ ...prodForm, brand: e.target.value })}
                            className="w-full text-xs border border-pink-100 rounded-xl px-3.5 py-2.5 outline-hidden"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Category assignment</label>
                          <select
                            value={prodForm.category || ''}
                            required
                            onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}
                            className="w-full text-xs border border-pink-100 rounded-xl px-3.5 py-2.5 outline-hidden"
                          >
                            <option value="">-- Choose Category --</option>
                            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Subcategory Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Makhmaria"
                            value={prodForm.subcategory || ''}
                            onChange={(e) => setProdForm({ ...prodForm, subcategory: e.target.value })}
                            className="w-full text-xs border border-pink-100 rounded-xl px-3.5 py-2.5 outline-hidden"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Product Main Image</label>
                          
                          {/* Visual Tap to Select / Drag Upload Card */}
                          <div className="group relative border-2 border-dashed border-pink-100/85 hover:border-pink-450 rounded-2xl p-4 bg-pink-50/5 hover:bg-pink-50/10 transition-all duration-300 flex flex-col items-center justify-center text-center gap-2.5 cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleProductImageUpload}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                            />
                            {isUploadingProductImg ? (
                              <div className="flex flex-col items-center py-2.5">
                                <RefreshCw className="h-6 w-6 animate-spin text-pink-600 mb-1.5" />
                                <span className="text-[10px] text-pink-650 font-extrabold animate-pulse uppercase tracking-widest">Uploading...</span>
                              </div>
                            ) : prodForm.imageUrl ? (
                              <div className="flex items-center gap-3 w-full">
                                <img src={prodForm.imageUrl} className="w-14 h-14 rounded-xl object-cover shrink-0 border border-pink-300" alt="" referrerPolicy="no-referrer" />
                                <div className="text-left min-w-0 flex-1">
                                  <span className="text-xs font-black text-gray-800 block truncate font-sans">Product Image Ready</span>
                                  <span className="text-[9px] text-slate-400 font-medium block overflow-hidden text-ellipsis">Click or drag over to replace</span>
                                </div>
                              </div>
                            ) : (
                              <div className="py-2.5 flex flex-col items-center">
                                <Upload className="h-6 w-6 text-slate-400 group-hover:text-pink-600 mb-1.5 transition-colors" />
                                <span className="text-xs text-slate-800 font-extrabold">Tap to Upload Product Photo</span>
                                <span className="text-[9px] text-slate-400 block mt-0.5">Supports PNG, JPG, GIF, WEBP</span>
                              </div>
                            )}
                          </div>

                          {/* Fallback Direct URL Box */}
                          <div className="pt-1">
                            <span className="text-[9px] text-slate-400 font-bold block mb-1">OR ENTER DIRECT URL</span>
                            <input
                              type="text"
                              required
                              placeholder="https://images.unsplash.com/..."
                              value={prodForm.imageUrl || ''}
                              onChange={(e) => setProdForm({ ...prodForm, imageUrl: e.target.value })}
                              className="w-full text-xs border border-pink-100 rounded-xl px-3.5 py-2.5 outline-hidden"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Full Description (English & Arabic)</label>
                        <textarea
                          rows={3}
                          value={prodForm.description || ''}
                          onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                          className="w-full text-xs border border-pink-100 rounded-xl px-3.5 py-2.5 outline-hidden"
                        />
                      </div>

                      {/* Toggles */}
                      <div className="flex gap-4 text-xs font-semibold text-gray-700 bg-pink-50/10 p-3.5 rounded-xl border border-pink-100/30">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" checked={!!prodForm.isFeatured} onChange={(e) => setProdForm({ ...prodForm, isFeatured: e.target.checked })} />
                          <span>Feature on Main landing</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" checked={!!prodForm.isNewArrival} onChange={(e) => setProdForm({ ...prodForm, isNewArrival: e.target.checked })} />
                          <span>New Arrival Badge</span>
                        </label>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreatingProduct(false);
                            setIsEditingProduct(null);
                          }}
                          className="px-4 py-2 bg-slate-100 text-slate-650 hover:bg-slate-200 transition-colors text-xs font-bold rounded-xl"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-pink-600 text-white font-bold hover:bg-pink-700 transition-colors text-xs rounded-xl"
                        >
                          {isEditingProduct ? 'Save Modifications' : 'Create Listing'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Directory Table listing */}
                <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs text-gray-600">
                      <thead className="bg-slate-900 text-white font-semibold">
                        <tr>
                          <th className="p-3.5">Product info</th>
                          <th className="p-3.5">Categories/Spec</th>
                          <th className="p-3.5">Pricing ($)</th>
                          <th className="p-3.5">Stock Quantity</th>
                          <th className="p-3.5 text-right">Actions Panel</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-105">
                        {products.map((p) => (
                          <tr key={p.id} className="hover:bg-pink-50/20">
                            <td className="p-3.5 flex items-center gap-3">
                              <img src={p.imageUrl} className="w-10 h-10 rounded-lg object-cover border border-slate-200" alt="" referrerPolicy="no-referrer" />
                              <div className="min-w-0">
                                <strong className="text-gray-900 block font-semibold truncate max-w-sm">{p.name}</strong>
                                <span className="text-[10px] text-slate-400 block font-mono font-medium">SKU: {p.sku} | Barcode: {p.barcode}</span>
                              </div>
                            </td>
                            <td className="p-3.5">
                              <span className="text-gray-900 block font-bold">{p.category}</span>
                              <span className="text-[10px] text-pink-500 block font-bold uppercase tracking-wider">{p.subcategory}</span>
                            </td>
                            <td className="p-3.5">
                              {p.salePrice ? (
                                <span className="text-sm font-black text-rose-500 block">${p.salePrice} <span className="text-xs text-gray-400 line-through font-normal">${p.price}</span></span>
                              ) : (
                                <span className="text-sm font-semibold text-gray-950 block">${p.price}</span>
                              )}
                            </td>
                            <td className="p-3.5">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                p.stockQuantity <= 5 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                              }`}>
                                {p.stockQuantity} Items
                              </span>
                            </td>
                            <td className="p-3.5 text-right space-x-1.5 space-y-1 md:space-y-0">
                              <button
                                onClick={() => {
                                  setProdForm(p);
                                  setIsEditingProduct(p);
                                  setIsCreatingProduct(false);
                                }}
                                className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[10px] uppercase rounded-lg transition-colors inline-flex items-center gap-1"
                              >
                                <Edit3 className="h-3 w-3" /> Edit
                              </button>
                              <button
                                onClick={async () => {
                                  const c = await duplicateProduct(p.id);
                                  if (c) onRefreshData();
                                }}
                                className="p-1 px-2.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-extrabold text-[10px] uppercase rounded-lg transition-colors inline-flex items-center gap-1"
                              >
                                <Copy className="h-3 w-3" /> Copy
                              </button>
                              <button
                                onClick={async () => {
                                  if (confirm(`Do you really want to remove product "${p.name}"?`)) {
                                    await deleteProduct(p.id);
                                    onRefreshData();
                                  }
                                }}
                                className="p-1 px-2.5 bg-red-50 hover:bg-red-100 text-red-650 font-extrabold text-[10px] uppercase rounded-lg transition-colors inline-flex items-center gap-1"
                              >
                                <Trash2 className="h-3 w-3" /> Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* CATEGORIES ORGANIZER TAB */}
            {activeTab === 'categories' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-serif font-black text-gray-900">Categories Organizer</h3>
                    <p className="text-xs text-gray-500">Add, edit, change images or hide entire directories in seconds.</p>
                  </div>
                  <button
                    onClick={() => {
                      setCatForm({ subcategories: [] });
                      setIsEditingCategory(null);
                      setIsCreatingCategory(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-pink-650 hover:bg-pink-700 text-white font-bold text-xs rounded-xl"
                  >
                    <Plus className="h-4 w-4" /> Add Category
                  </button>
                </div>

                {/* Editor Box */}
                {(isCreatingCategory || isEditingCategory) && (
                  <form onSubmit={handleCategorySubmit} className="bg-white p-5 border border-pink-100 rounded-2xl space-y-4">
                    <h4 className="font-serif font-bold text-base text-gray-900 border-b border-pink-50 pb-2">
                      {isEditingCategory ? `Edit Category ${isEditingCategory.name}` : 'Create Category Circle'}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold text-gray-500">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Category Name</label>
                        <input
                          type="text"
                          required
                          value={catForm.name || ''}
                          onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                          className="w-full border border-pink-100 rounded-xl px-3.5 py-2.5 outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Display Sort Order</label>
                        <input
                          type="number"
                          value={catForm.order || ''}
                          onChange={(e) => setCatForm({ ...catForm, order: parseInt(e.target.value) })}
                          className="w-full border border-pink-100 rounded-xl px-3.5 py-2.5 outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Lucide Icon Name</label>
                        <input
                          type="text"
                          value={catForm.icon || ''}
                          placeholder="Sparkles, Flower, Heart..."
                          onChange={(e) => setCatForm({ ...catForm, icon: e.target.value })}
                          className="w-full border border-pink-100 rounded-xl px-3.5 py-2.5 outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs mt-2">
                      <div className="space-y-2">
                        <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">Round Circle Image</label>
                        
                        {/* Interactive Drag & Drop / Tap to Upload Card */}
                        <div className="group relative border-2 border-dashed border-pink-100/85 hover:border-pink-450 rounded-2xl p-4.5 bg-pink-50/5 hover:bg-pink-50/10 transition-all duration-300 flex flex-col items-center justify-center text-center gap-2.5 cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleCategoryCircleUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                          />
                          {isUploadingCircle ? (
                            <div className="flex flex-col items-center py-2.5">
                              <RefreshCw className="h-6 w-6 animate-spin text-pink-600 mb-1.5" />
                              <span className="text-[10px] text-pink-650 font-extrabold animate-pulse uppercase tracking-widest">Uploading...</span>
                            </div>
                          ) : catForm.image ? (
                            <div className="flex items-center gap-3 w-full">
                              <img src={catForm.image} className="w-14 h-14 rounded-full object-cover shrink-0 border border-pink-300" alt="" referrerPolicy="no-referrer" />
                              <div className="text-left min-w-0 flex-1">
                                <span className="text-xs font-black text-gray-800 block truncate">Image Selected</span>
                                <span className="text-[9px] text-slate-400 font-medium block overflow-hidden text-ellipsis">Click or drag over to replace</span>
                              </div>
                            </div>
                          ) : (
                            <div className="py-2.5 flex flex-col items-center">
                              <Upload className="h-6 w-6 text-slate-400 group-hover:text-pink-600 mb-1.5 transition-colors" />
                              <span className="text-xs text-slate-800 font-extrabold">Tap to Upload Circle Photo</span>
                              <span className="text-[9px] text-slate-400 block mt-0.5">Supports PNG, JPG, GIF, WEBP</span>
                            </div>
                          )}
                        </div>

                        {/* Traditional Input URL Box */}
                        <div className="pt-1">
                          <span className="text-[9px] text-slate-400 font-bold block mb-1">OR ENTER DIRECT URL</span>
                          <input
                            type="text"
                            required
                            placeholder="https://images.unsplash.com/..."
                            value={catForm.image || ''}
                            onChange={(e) => setCatForm({ ...catForm, image: e.target.value })}
                            className="w-full border border-pink-100 rounded-xl px-3.5 py-2.5 outline-hidden"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">Display Banner (Optional)</label>
                        
                        {/* Interactive Banner Upload Card */}
                        <div className="group relative border-2 border-dashed border-pink-100/85 hover:border-pink-450 rounded-2xl p-4.5 bg-pink-50/5 hover:bg-pink-50/10 transition-all duration-300 flex flex-col items-center justify-center text-center gap-2.5 cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleCategoryBannerUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                          />
                          {isUploadingBanner ? (
                            <div className="flex flex-col items-center py-2.5">
                              <RefreshCw className="h-6 w-6 animate-spin text-pink-600 mb-1.5" />
                              <span className="text-[10px] text-pink-650 font-extrabold animate-pulse uppercase tracking-widest">Uploading...</span>
                            </div>
                          ) : catForm.banner ? (
                            <div className="flex items-center gap-3 w-full">
                              <img src={catForm.banner} className="w-18 h-10 rounded-lg object-cover shrink-0 border border-pink-300" alt="" referrerPolicy="no-referrer" />
                              <div className="text-left min-w-0 flex-1">
                                <span className="text-xs font-black text-gray-800 block truncate">Banner Selected</span>
                                <span className="text-[9px] text-slate-400 font-medium block overflow-hidden text-ellipsis">Click or drag over to replace</span>
                              </div>
                            </div>
                          ) : (
                            <div className="py-2.5 flex flex-col items-center">
                              <Upload className="h-6 w-6 text-slate-400 group-hover:text-pink-600 mb-1.5 transition-colors" />
                              <span className="text-xs text-slate-800 font-extrabold">Tap to Upload Banner Photo</span>
                              <span className="text-[9px] text-slate-400 block mt-0.5">Supports PNG, JPG, GIF, WEBP</span>
                            </div>
                          )}
                        </div>

                        {/* Traditional Input URL Box */}
                        <div className="pt-1">
                          <span className="text-[9px] text-slate-400 font-bold block mb-1">OR ENTER DIRECT URL</span>
                          <input
                            type="text"
                            placeholder="https://images.unsplash.com/..."
                            value={catForm.banner || ''}
                            onChange={(e) => setCatForm({ ...catForm, banner: e.target.value })}
                            className="w-full border border-pink-100 rounded-xl px-3.5 py-2.5 outline-hidden"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4 text-xs font-semibold text-gray-650 bg-pink-50/10 p-3 rounded-xl border border-pink-100/35">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={!!catForm.isHidden} onChange={(e) => setCatForm({ ...catForm, isHidden: e.target.checked })} />
                        <span>Hide Category from Nav bar</span>
                      </label>
                    </div>

                    <div className="flex justify-end gap-2 text-xs font-bold pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingCategory(false);
                          setIsEditingCategory(null);
                        }}
                        className="px-4 py-2 bg-slate-100 rounded-xl"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="px-5 py-2 bg-pink-650 hover:bg-pink-700 text-white rounded-xl">
                        Save Category Circle
                      </button>
                    </div>
                  </form>
                )}

                {/* Categories circle database list grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((c) => (
                    <div key={c.id} className="bg-white p-4 border border-pink-100/40 rounded-2xl flex gap-4 select-none relative shadow-xs">
                      <img src={c.image} className="w-16 h-16 rounded-full object-cover shrink-0 border border-pink-300" alt="" referrerPolicy="no-referrer" />
                      <div className="min-w-0 flex-1 flex flex-col justify-between">
                        <div>
                          <strong className="text-gray-900 block font-bold leading-tight">{c.name}</strong>
                          <span className="text-[10px] text-slate-400 block font-semibold uppercase mt-0.5">Order No. {c.order}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setCatForm(c);
                              setIsEditingCategory(c);
                              setIsCreatingCategory(false);
                            }}
                            className="p-1 px-2.5 bg-slate-100 text-slate-700 font-extrabold text-[9px] uppercase tracking-wide rounded-md hover:bg-slate-200 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(`Do you really want to delete category "${c.name}"?`)) {
                                await deleteCategory(c.id);
                                onRefreshData();
                              }
                            }}
                            className="p-1 px-2 bg-red-50 text-red-650 font-extrabold text-[9px] uppercase tracking-wide rounded-md hover:bg-red-100 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      {c.isHidden && (
                        <span className="absolute top-3 right-3 bg-gray-100 border border-gray-200 text-gray-500 text-[8px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <EyeOff className="h-2.5 w-2.5" /> Hidden
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ORDERS LOG TAB */}
            {activeTab === 'orders' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-xl font-serif font-black text-gray-900">COD Order Logs</h3>
                  <p className="text-xs text-gray-500">Track and dispatch Lebanese transactions instantly.</p>
                </div>

                <div className="space-y-4">
                  {orders.length > 0 ? (
                    orders.map((ord) => (
                      <div key={ord.id} className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xs">
                        <div className="bg-slate-900 text-white p-4.5 flex flex-wrap justify-between items-center gap-3">
                          <div>
                            <strong className="text-sm font-bold block">{ord.customerName}</strong>
                            <span className="text-[10px] text-slate-300 block font-mono font-medium">Order ID: {ord.id} • Placed {new Date(ord.createdAt).toLocaleString()}</span>
                          </div>

                          {/* Status and Action Buttons */}
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 text-[10px] font-extrabold uppercase rounded-full ${
                              ord.status === 'completed' ? 'bg-green-550 border border-green-600 text-white' :
                              ord.status === 'cancelled' ? 'bg-red-50 text-red-700' : 'bg-amber-500 text-slate-900'
                            }`}>
                              {ord.status}
                            </span>
                            
                            {ord.status === 'pending' && (
                              <button
                                onClick={async () => {
                                  await updateOrderStatus(ord.id, 'completed');
                                  onRefreshData();
                                }}
                                className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-[10px] font-extrabold uppercase rounded-lg transition-colors inline-block"
                              >
                                Mark Completed
                              </button>
                            )}

                            {ord.status === 'pending' && (
                              <button
                                onClick={async () => {
                                  await updateOrderStatus(ord.id, 'cancelled');
                                  onRefreshData();
                                }}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-red-400 text-[10px] font-extrabold uppercase rounded-lg transition-colors inline-block"
                              >
                                Cancel Order
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold text-gray-600">
                          {/* Client Contact Info */}
                          <div className="space-y-1.5">
                            <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Delivery Details</h4>
                            <p className="text-gray-900">📞 Phone: <span className="font-mono font-bold">{ord.phone}</span></p>
                            <p className="text-gray-900">📍 City / Town: <strong>{ord.city}</strong></p>
                            <p className="text-gray-750">🏡 Address: <span>{ord.address}</span></p>
                            {ord.notes && <p className="text-pink-650 bg-pink-100/30 p-2 border border-pink-100 rounded-lg italic">💬 Notes: {ord.notes}</p>}
                            <p className="text-gray-700 font-bold uppercase tracking-wider text-[10px]">Payment Method: <span className="text-slate-900 font-extrabold">{ord.paymentMethod === 'COD' ? '💵 Cash On Delivery' : '💳 Wish Money Transfer'}</span></p>
                          </div>

                          {/* Ordered products list */}
                          <div>
                            <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Shopping items</h4>
                            <div className="space-y-2 border border-pink-50 p-3 rounded-2xl bg-slate-50/50">
                              {ord.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-xs">
                                  <span>{item.productName} <strong className="text-pink-600 font-bold">x{item.quantity}</strong></span>
                                  <span className="font-mono font-bold text-gray-800">${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                              ))}
                              
                              <div className="border-t border-pink-100/60 pt-2 mt-2 space-y-1 text-slate-500 font-medium">
                                <div className="flex justify-between">
                                  <span>Subtotal</span>
                                  <span className="font-mono">${ord.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Delivery Fee</span>
                                  <span className="font-mono">{ord.deliveryFee === 0 ? 'FREE' : `$${ord.deliveryFee}`}</span>
                                </div>
                                {ord.couponDiscount ? (
                                  <div className="flex justify-between text-pink-600">
                                    <span>Discount</span>
                                    <span className="font-mono">-${ord.couponDiscount}</span>
                                  </div>
                                ) : null}
                                <div className="flex justify-between text-sm font-serif font-black text-slate-900 border-t border-slate-200/50 pt-2 mt-1">
                                  <span>Order Total</span>
                                  <span className="font-mono text-pink-600">${ord.total.toFixed(2)} USD</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-20 bg-white border border-slate-100 rounded-3xl">
                      <ShoppingCart className="h-12 w-12 text-slate-200 mx-auto mb-2" />
                      <p className="text-xs text-gray-550">No orders recorded yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* REVIEW MODERATION TAB */}
            {activeTab === 'reviews' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-xl font-serif font-black text-gray-900">Appraisals Moderation</h3>
                  <p className="text-xs text-gray-500">Approve or reject customer reviews to enrich the cosmetics store catalog trust.</p>
                </div>

                <div className="space-y-4">
                  {reviews.length > 0 ? (
                    reviews.map((rev) => (
                      <div key={rev.id} className="bg-white p-4 border border-pink-50 rounded-2xl flex flex-wrap justify-between items-start gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <strong className="text-sm text-gray-900">{rev.customerName}</strong>
                            <span className="text-[10px] text-gray-400">{new Date(rev.createdAt).toLocaleString()}</span>
                            <span className="text-xs font-bold text-pink-500">on &ldquo;{rev.productName}&rdquo;</span>
                          </div>

                          <div className="flex text-amber-500 mb-2">
                            {[1,2,3,4,5].map((star) => (
                              <Star key={star} className={`h-3.5 w-3.5 ${star <= rev.rating ? 'fill-amber-500 text-amber-500' : 'text-gray-200'}`} />
                            ))}
                          </div>
                          
                          <p className="text-xs text-gray-650 bg-slate-50 p-2.5 rounded-xl border border-slate-100/50 leading-relaxed italic">
                            &ldquo;{rev.text}&rdquo;
                          </p>
                        </div>

                        <div className="flex items-center gap-2 select-none shrink-0 self-center">
                          {rev.isApproved ? (
                            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border border-emerald-250 flex items-center gap-0.5">
                              Approved
                            </span>
                          ) : (
                            <button
                              onClick={async () => {
                                await updateReview(rev.id, { isApproved: true });
                                onRefreshData();
                              }}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold uppercase rounded-lg"
                            >
                              Approve
                            </button>
                          )}
                          <button
                            onClick={async () => {
                              if (confirm('Delete review permanently?')) {
                                await deleteReview(rev.id);
                                onRefreshData();
                              }
                            }}
                            className="p-1 px-2.5 bg-red-50 hover:bg-red-100 text-red-650 font-bold text-[10px] uppercase rounded-lg"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-20 bg-white border border-pink-50 rounded-2xl">
                      <Star className="h-12 w-12 text-pink-200 mx-auto mb-2" />
                      <p className="text-xs text-gray-500 font-medium tracking-wide">No customer reviews submitted yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* COUPONS TAB */}
            {activeTab === 'coupons' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-serif font-black text-gray-900">Promotional Coupons</h3>
                    <p className="text-xs text-gray-500">Create percentage discounts or fixed dollar price deduction codes.</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsCreatingCoupon(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-pink-650 hover:bg-pink-700 text-white font-bold text-xs rounded-xl"
                  >
                    <Plus className="h-4 w-4" /> Create Coupon
                  </button>
                </div>

                {isCreatingCoupon && (
                  <form onSubmit={handleCouponSubmit} className="bg-white p-5 border border-pink-100 rounded-2xl space-y-4">
                    <h4 className="font-serif font-bold text-gray-900">New Coupon Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-semibold text-gray-550">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider mb-1 text-gray-400">Promotional Code</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. SUMMER26"
                          value={couponForm.code || ''}
                          onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                          className="w-full border border-pink-150 rounded-xl px-3.5 py-2.5 uppercase outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider mb-1 text-gray-400">Discount Type</label>
                        <select
                          value={couponForm.type || 'percentage'}
                          onChange={(e) => setCouponForm({ ...couponForm, type: e.target.value as any })}
                          className="w-full border border-pink-150 rounded-xl px-3.5 py-2.5 outline-hidden"
                        >
                          <option value="percentage">Percentage (%)</option>
                          <option value="fixed">Fixed Sum ($ USD)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider mb-1 text-gray-400">Discount Weight</label>
                        <input
                          type="number"
                          required
                          value={couponForm.value || ''}
                          onChange={(e) => setCouponForm({ ...couponForm, value: parseFloat(e.target.value) })}
                          className="w-full border border-pink-150 rounded-xl px-3.5 py-2.5 outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider mb-1 text-gray-400">Expiration date</label>
                        <input
                          type="date"
                          required
                          value={couponForm.expirationDate || ''}
                          onChange={(e) => setCouponForm({ ...couponForm, expirationDate: e.target.value })}
                          className="w-full border border-pink-150 rounded-xl px-3.5 py-2.5 outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setIsCreatingCoupon(false)}
                        className="px-4 py-2 bg-slate-100 rounded-xl"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="px-5 py-2 bg-pink-650 hover:bg-pink-700 text-white rounded-xl">
                        Publish Code
                      </button>
                    </div>
                  </form>
                )}

                {/* Coupons database listings grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {coupons.map((coupon) => (
                    <div key={coupon.id} className="bg-white p-4.5 border border-pink-100/40 rounded-2xl flex items-center justify-between shadow-xs">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1 bg-pink-100/40 border border-pink-200 px-3 py-1 rounded-lg">
                          <Tag className="h-4.5 w-4.5 text-pink-600" />
                          <strong className="text-gray-900 font-extrabold uppercase tracking-wider font-mono text-sm leading-none">{coupon.code}</strong>
                        </div>
                        <span className="text-[10px] text-gray-450 block font-bold uppercase tracking-wider mt-2">
                          Value: {coupon.type === 'percentage' ? `${coupon.value}% Off` : `$${coupon.value} USD Flat`}
                        </span>
                        <span className="text-[10px] text-gray-400 block font-semibold uppercase mt-0.5">Expires {coupon.expirationDate}</span>
                      </div>
                      <button
                        onClick={async () => {
                          if (confirm('Delete coupon code permanently?')) {
                            await deleteCoupon(coupon.id);
                            onRefreshData();
                          }
                        }}
                        className="p-1 px-2.5 bg-red-50 hover:bg-red-105 text-red-650 font-bold text-[10px] uppercase rounded-lg transition-colors inline-flex items-center gap-0.5"
                      >
                        <Trash2 className="h-3 w-3" /> Dismiss
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* EXCEL & CSV SYNC ENGINE */}
            {activeTab === 'import' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-xl font-serif font-black text-gray-900">Excel / CSV Sync Engine</h3>
                  <p className="text-xs text-gray-500">Provide direct text CSV sheets or drag-and-drop spreadsheet files to synchronize products.</p>
                </div>

                {importReport && (
                  <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-2 animate-fade-in relative">
                    <button onClick={() => setImportReport(null)} className="absolute top-3.5 right-3.5 p-1 text-slate-400 hover:text-white rounded-full">
                      <X className="h-5 w-5" />
                    </button>
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Check className="h-5.5 w-5.5" />
                      <strong className="font-serif font-black text-base">Bulk Synchronization Completed!</strong>
                    </div>
                    <ul className="text-xs font-semibold text-slate-350 list-disc pl-5 pt-1 space-y-1">
                      <li>New Products Created: <strong className="text-white font-mono">{importReport.created}</strong></li>
                      <li>Matching Products Updated: <strong className="text-white font-mono">{importReport.updated}</strong></li>
                      <li>Errors Recorded: <strong className="text-pink-400 font-mono">{importReport.errors.length}</strong></li>
                    </ul>
                    {importReport.errors.length > 0 && (
                      <div className="pt-2 border-t border-slate-800 mt-2 text-xs">
                        <span className="text-red-400 font-bold block mb-1">Recent Errors Logged:</span>
                        <ul className="list-disc pl-5 text-red-300 font-mono text-[10px] space-y-1">
                          {importReport.errors.map((err, i) => <li key={i}>{err}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Upload Box */}
                  <div className="space-y-4">
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={handleDrop}
                      className={`bg-white border-2 border-dashed rounded-3xl p-8 text-center flex flex-col items-center justify-center transition-all min-h-[220px] ${
                        isDragOver ? 'border-pink-500 bg-pink-50/20' : 'border-pink-200'
                      }`}
                    >
                      <Upload className="h-10 w-10 text-pink-400 mb-3" />
                      <strong className="text-slate-800 text-sm block font-semibold mb-1">Drag & Drop Excel / CSV Sheet</strong>
                      <p className="text-xs text-slate-400 mb-4 max-w-sm">Automatically maps product_name, sku, price, category, subcategory and image_url</p>
                      
                      <label className="px-5 py-2.5 bg-gray-950 text-white text-xs font-bold hover:bg-pink-700 transition-colors rounded-xl cursor-pointer">
                        Select File
                        <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
                      </label>
                    </div>

                    <div className="bg-white p-4.5 border border-pink-100/40 rounded-2xl space-y-3">
                      <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">Paste raw Comma-Separated CSV contents directly</label>
                      <textarea
                        rows={6}
                        placeholder="product_name,price_before,price_after,category,subcategory,description,image_url&#10;Lavender Body Oil,12,9,Body Care,Makhmaria,Hydrating lavender body oil,https://i.ibb.co/..."
                        value={csvText}
                        onChange={(e) => {
                          setCsvText(e.target.value);
                          parseCSV(e.target.value);
                        }}
                        className="w-full text-xs font-mono border border-pink-100 rounded-xl px-3.5 py-2.5 outline-hidden bg-slate-50 resize-y"
                      />
                    </div>
                  </div>

                  {/* Synchronizer preview BEFORE submission */}
                  <div className="bg-white p-5 border border-pink-100/40 rounded-3xl flex flex-col justify-between min-h-[300px]">
                    <div>
                      <h4 className="font-serif font-semibold text-slate-800 mb-3 flex items-center gap-1.5">
                        <FileText className="h-4.5 w-4.5 text-pink-500" /> Synchronization Table Preview ({importedPreview.length} items parsed)
                      </h4>
                      {importedPreview.length > 0 ? (
                        <div className="overflow-x-auto max-h-96 border border-slate-100 rounded-xl">
                          <table className="w-full border-collapse text-left text-[11px] text-gray-500">
                            <thead className="bg-[#FFF0F2] text-pink-700 font-semibold border-b border-pink-100">
                              <tr>
                                <th className="p-2.5">Parsed Product Information</th>
                                <th className="p-2.5">Category assignments</th>
                                <th className="p-2.5">Calculated Price ($)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                              {importedPreview.slice(0, 10).map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                  <td className="p-2.5 font-bold text-gray-900 truncate max-w-[150px]">{item.product_name}</td>
                                  <td className="p-2.5 text-slate-450">{item.category} • {item.subcategory}</td>
                                  <td className="p-2.5 font-mono text-gray-800">${item.price_after || item.price || 0}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {importedPreview.length > 10 && (
                            <p className="p-2 text-[10px] text-slate-400 text-center font-semibold italic bg-slate-50/45">And {importedPreview.length - 10} more rows parsed successfully.</p>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-20 text-xs text-gray-400">
                          <p className="font-medium">No CSV product rows parsed yet.</p>
                          <p className="text-[10px] mt-1 font-semibold text-pink-400">Paste some CSV rows or select a file to preview mappings</p>
                        </div>
                      )}
                    </div>

                    {importedPreview.length > 0 && (
                      <button
                        onClick={executeCsvImportSubmit}
                        className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl text-xs uppercase tracking-widest shadow-md transition-transform hover:scale-101 outline-hidden"
                      >
                        Authorize & Execute Sync Engine
                      </button>
                    )}
                  </div>
                </div>

                {/* Import History logs */}
                <div className="bg-white p-5 border border-slate-100 rounded-3xl space-y-3">
                  <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Sync Log History</h4>
                  {importLogHistory.length > 0 ? (
                    <div className="divide-y divide-slate-50 text-xs max-h-56 overflow-y-auto">
                      {importLogHistory.map((log) => (
                        <div key={log.id} className="py-2.5 flex justify-between items-center">
                          <div>
                            <strong className="text-slate-800 block">{new Date(log.timestamp).toLocaleString()}</strong>
                            <span className="text-[10px] text-slate-400">Bulk created: <strong className="text-slate-800">{log.createdCount}</strong> | Bulk updated: <strong className="text-slate-800">{log.updatedCount}</strong></span>
                          </div>
                          {log.errorsCount > 0 ? (
                            <span className="text-[10px] px-2 py-0.5 bg-rose-50 text-rose-600 font-semibold rounded-md border border-rose-200">
                              {log.errorsCount} Errors
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-600 font-semibold rounded-md border border-emerald-200">
                              Success
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">No past sync history logged.</p>
                  )}
                </div>
              </div>
            )}

            {/* SETTINGS VIEW */}
            {activeTab === 'settings' && (
              <form onSubmit={handleSettingsSubmit} className="space-y-6 animate-fade-in text-xs font-semibold text-gray-550 max-w-2xl">
                <div>
                  <h3 className="text-xl font-serif font-black text-gray-900">Website Configuration Settings</h3>
                  <p className="text-xs text-gray-500">Configure global delivery rules, WhatsApp phone numbers and social links.</p>
                </div>

                <div className="bg-white p-5 border border-pink-100/40 rounded-3xl space-y-4">
                  <h4 className="font-serif font-bold text-gray-900 text-sm">Delivery Rules</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Free Delivery Target Threshold ($)</label>
                      <input
                        type="number"
                        required
                        value={settingsForm.freeDeliveryThreshold || 100}
                        onChange={(e) => setSettingsForm({ ...settingsForm, freeDeliveryThreshold: parseFloat(e.target.value) })}
                        className="w-full border border-pink-100 rounded-xl px-3.5 py-2.5 outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Standard Delivery Fee ($)</label>
                      <input
                        type="number"
                        required
                        value={settingsForm.deliveryFee || 4}
                        onChange={(e) => setSettingsForm({ ...settingsForm, deliveryFee: parseFloat(e.target.value) })}
                        className="w-full border border-pink-100 rounded-xl px-3.5 py-2.5 outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Welcome Banner Header Text</label>
                    <input
                      type="text"
                      required
                      value={settingsForm.bannerText || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, bannerText: e.target.value })}
                      className="w-full border border-pink-100 rounded-xl px-3.5 py-2.5 outline-hidden"
                    />
                  </div>
                </div>

                <div className="bg-white p-5 border border-pink-100/40 rounded-3xl space-y-4">
                  <h4 className="font-serif font-bold text-gray-900 text-sm">Integration Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Outreach WhatsApp Phone Target</label>
                      <input
                        type="text"
                        required
                        value={settingsForm.whatsappNumber || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })}
                        className="w-full border border-pink-100 rounded-xl px-3.5 py-2.5 outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Support Email</label>
                      <input
                        type="email"
                        required
                        value={settingsForm.email || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                        className="w-full border border-pink-100 rounded-xl px-3.5 py-2.5 outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-0.5">Facebook URL</label>
                      <input
                        type="url"
                        value={settingsForm.facebookUrl || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, facebookUrl: e.target.value })}
                        className="w-full border border-pink-100 rounded-xl px-3.5 py-2.5 outline-hidden text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-0.5">Instagram URL</label>
                      <input
                        type="url"
                        value={settingsForm.instagramUrl || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, instagramUrl: e.target.value })}
                        className="w-full border border-pink-100 rounded-xl px-3.5 py-2.5 outline-hidden text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-0.5">TikTok URL</label>
                      <input
                        type="url"
                        value={settingsForm.tiktokUrl || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, tiktokUrl: e.target.value })}
                        className="w-full border border-pink-100 rounded-xl px-3.5 py-2.5 outline-hidden text-[11px]"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-6 h-11 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl transition-all shadow-md text-xs uppercase"
                  >
                    Save Config Rules
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'chats' && (
              <div className="h-full flex flex-col md:flex-row bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden animate-fade-in animate-duration-300" style={{ height: 'calc(100vh - 120px)' }}>
                {/* List Panel */}
                <div className="w-full md:w-80 border-r border-slate-200 flex flex-col h-1/3 md:h-full bg-slate-50">
                  <div className="p-4 border-b border-slate-200 bg-white">
                    <h3 className="font-serif font-bold text-gray-950 text-base flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-pink-600" /> Active Support Chats
                    </h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Bilingual Live Assistance</p>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-150">
                    {chatSessions.length === 0 ? (
                      <div className="p-8 text-center text-xs text-gray-400 italic">No customer chat sessions have been started.</div>
                    ) : (
                      chatSessions.map((c) => {
                        const isSelected = selectedChatId === c.id;
                        const lastMsg = c.messages && c.messages.length > 0 ? c.messages[c.messages.length - 1] : null;
                        return (
                          <div
                            key={c.id}
                            onClick={() => {
                              setSelectedChatId(c.id);
                              // Mark as read for admin
                              fetch(`/api/chats/${c.id}/read`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ role: 'admin' })
                              }).then(() => fetchChatSessions()).catch(err => {});
                            }}
                            className={`p-4 cursor-pointer transition-colors relative flex flex-col gap-1 ${
                              isSelected ? 'bg-pink-50/60 border-l-4 border-pink-600' : 'bg-white hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex justify-between items-baseline">
                              <span className="font-bold text-xs text-gray-900 truncate pr-6">{c.customerName || 'Customer'}</span>
                              <span className="text-[9px] text-gray-400 shrink-0 font-mono">
                                {new Date(c.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            
                            {lastMsg ? (
                              <p className="text-xs text-gray-500 truncate" dir="auto">{lastMsg.text}</p>
                            ) : (
                              <p className="text-xs text-gray-400 italic">No messages yet</p>
                            )}

                            {/* Unread indicator */}
                            {c.isUnreadForAdmin && (
                              <span className="absolute right-4 bottom-4 h-2 w-2 rounded-full bg-rose-650" style={{ backgroundColor: '#ff0055' }} />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Main conversation box */}
                <div className="flex-1 flex flex-col h-2/3 md:h-full bg-white relative">
                  {selectedChatId ? (() => {
                    const activeSession = chatSessions.find(s => s.id === selectedChatId);
                    if (!activeSession) return null;

                    const handleAdminSend = async (e: React.FormEvent) => {
                      e.preventDefault();
                      if (!adminReplyText.trim()) return;

                      try {
                        const res = await fetch('/api/chats/messages', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            sessionId: selectedChatId,
                            customerName: activeSession.customerName,
                            sender: 'admin',
                            text: adminReplyText
                          })
                        });
                        if (res.ok) {
                          setAdminReplyText('');
                          fetchChatSessions();
                        }
                      } catch (err) {
                        console.error('Failed to send admin reaction', err);
                      }
                    };

                    const triggerQuickReply = async (quickText: string) => {
                      try {
                        const res = await fetch('/api/chats/messages', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            sessionId: selectedChatId,
                            customerName: activeSession.customerName,
                            sender: 'admin',
                            text: quickText
                          })
                        });
                        if (res.ok) {
                          fetchChatSessions();
                        }
                      } catch (err) {
                        console.error(err);
                      }
                    };

                    return (
                      <>
                        {/* Conversation Header */}
                        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center shrink-0">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-pink-600 block">Assisting Customer</span>
                            <h4 className="font-bold text-gray-900 text-sm">{activeSession.customerName}</h4>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono font-bold">ID: {activeSession.id}</span>
                        </div>

                        {/* Message list scrolling area */}
                        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/30 flex flex-col gap-3">
                          {activeSession.messages && activeSession.messages.map((m: any) => {
                            const isMe = m.sender === 'admin';
                            const isAr = /[\u0600-\u06FF]/.test(m.text || '');
                            return (
                              <div
                                key={m.id}
                                dir={isAr ? 'rtl' : 'ltr'}
                                className={`flex flex-col max-w-[80%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
                              >
                                <div
                                  className={`px-3.5 py-2.5 rounded-2xl text-xs font-semibold leading-relaxed shadow-xs whitespace-pre-line ${
                                    isMe ? 'bg-pink-650 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                                  }`}
                                >
                                  {m.text}
                                </div>
                                <span className="text-[9px] text-slate-405 mt-1 font-mono px-1">
                                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            );
                          })}
                          <div ref={chatEndRef} />
                        </div>

                        {/* Quick preset answers helpers */}
                        <div className="p-3 border-t border-slate-200 bg-white shrink-0">
                          <span className="text-[9px] uppercase font-bold text-gray-400 block mb-1.5 font-sans">🌸 Quick Cosmetic Replies / نصوص سريعة:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              "Hello! Welcome to YummyProducts. How can I help you today? 🌸",
                              "Yes, we support Cash on Delivery all across Lebanon! 🛵",
                              "Your order has been confirmed successfully! ✨",
                              "We are checking with our delivery team and will update you shortly. 📦"
                            ].map((answer, index) => (
                              <button
                                key={index}
                                onClick={() => triggerQuickReply(answer)}
                                className="px-2.5 py-1 text-[10px] bg-slate-105 hover:bg-pink-100/50 hover:text-pink-700 font-medium rounded-lg text-slate-700 transition-colors border border-slate-200 truncate max-w-full"
                              >
                                {answer}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Form controls input */}
                        <form onSubmit={handleAdminSend} className="p-3 border-t border-slate-200 bg-white flex gap-2 shrink-0">
                          <input
                            type="text"
                            value={adminReplyText}
                            onChange={(e) => setAdminReplyText(e.target.value)}
                            placeholder="Type a support reply to send to the client..."
                            className="flex-1 text-xs border border-slate-200 rounded-xl px-4 py-2.5 outline-hidden focus:border-pink-500 text-gray-800"
                          />
                          <button
                            type="submit"
                            disabled={!adminReplyText.trim()}
                            className="px-5 bg-pink-650 hover:bg-pink-700 disabled:bg-gray-150 disabled:text-gray-405 text-white font-bold rounded-xl transition-all text-xs uppercase"
                          >
                            Send
                          </button>
                        </form>
                      </>
                    );
                  })() : (
                    <div className="flex-1 flex flex-col justify-center items-center text-center p-8 opacity-75">
                      <div className="w-16 h-16 rounded-full bg-pink-50 flex items-center justify-center text-pink-600 border border-pink-100 mb-4 animate-bounce">
                        <MessageSquare className="h-8 w-8 text-pink-500" />
                      </div>
                      <h4 className="font-serif font-bold text-gray-900 text-base mb-1">Central Chat Support Desk</h4>
                      <p className="text-xs text-gray-500 max-w-[280px]">
                        Select a customer session from the left rail to view communication histories and send replies instantly.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
