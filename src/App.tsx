import React, { useState, useEffect } from 'react';
import {
  Heart, ShoppingBag, Search, User, Sparkles, MessageSquare, Instagram,
  Facebook, Mail, Phone, ExternalLink, Calendar, Users, AlertTriangle, ShieldCheck,
  CheckCircle, Loader, MessageCircle, Star, ArrowUpRight, X,
  Smartphone, Globe, Wifi, Signal, Battery, Home, Grid, Settings, Send
} from 'lucide-react';
import { Product, Category, Review, Coupon, Order, WebsiteConfig, OrderItem } from './types';
import {
  fetchConfig, fetchCategories, fetchProducts, fetchReviews,
  fetchCoupons, fetchOrders, createOrder, submitReview
} from './lib/api';
import TopBanner from './components/TopBanner';
import Header from './components/Header';
import SubcategoryList from './components/SubcategoryList';
import ProductCard from './components/ProductCard';
import ProductDetailsModal from './components/ProductDetailsModal';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import AdminPanel from './components/AdminPanel';
import LiveChatWidget from './components/LiveChatWidget';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [config, setConfig] = useState<WebsiteConfig>({
    freeDeliveryThreshold: 100,
    deliveryFee: 4,
    bannerText: "✨ FREE DELIVERY ON ORDERS OVER $100 — FRESH BEAUTY IN LEBANON! ✨",
    facebookUrl: "https://www.facebook.com/yummmy.lb",
    instagramUrl: "https://www.instagram.com/yummyproducts.lb/?fbclid=IwAR1MwdGFACVRrhwS-zxASmR7I1y7qW8NQfHwhftUPPxemU7odkOmAvn6Rps",
    tiktokUrl: "https://www.tiktok.com/@yummylb?_t=8kru9j0QYRW&_r=1",
    whatsappNumber: "+96176477025",
    email: "yummyproductslb@gmail.com"
  });

  // UI state managers
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Android Simulation State Values
  const [deviceMode, setDeviceMode] = useState<'android' | 'web'>('android');
  const [activeTab, setActiveTab] = useState<'home' | 'categories' | 'wishlist' | 'admin'>('home');
  const [currentTime, setCurrentTime] = useState('12:00');
  const [isSimSearchOpen, setIsSimSearchOpen] = useState(false);
  const [simSearchQuery, setSimSearchQuery] = useState('');
  
  // Cart & Wishlists states synced to localStorage
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  
  // Modals & Drawers toggles
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  
  // Custom coupon discount from cart drawer pass
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [activeCouponCode, setActiveCouponCode] = useState('');

  // Admin Security verification
  const [isAdminAuthenticated, setIsAdminAuthorized] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);

  // Stats indicators
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Syncing functions
  const loadWorkspaceData = async () => {
    try {
      const [conf, cats, prods, revs, coups, ords] = await Promise.all([
        fetchConfig(),
        fetchCategories(),
        fetchProducts(),
        fetchReviews(),
        fetchCoupons(),
        fetchOrders()
      ]);
      if (conf) setConfig(conf);
      if (cats) setCategories(cats);
      if (prods) setProducts(prods);
      if (revs) setReviews(revs);
      if (coups) setCoupons(coups);
      if (ords) setOrders(ords);
    } catch (e) {
      console.error("Failed loading remote API database, using default seeds", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaceData();

    // Pull localStorage
    const savedCart = localStorage.getItem('yummy_cart');
    if (savedCart) setCartItems(JSON.parse(savedCart));

    const savedWish = localStorage.getItem('yummy_wishlist');
    if (savedWish) setWishlist(JSON.parse(savedWish));
  }, []);

  // Update dynamic real-time Android Clock
  useEffect(() => {
    const updateTick = () => {
      const now = new Date();
      let hrs = now.getHours();
      let mins = now.getMinutes();
      const hrsStr = hrs < 10 ? '0' + hrs : hrs.toString();
      const minsStr = mins < 10 ? '0' + mins : mins.toString();
      setCurrentTime(`${hrsStr}:${minsStr}`);
    };
    updateTick();
    const interval = setInterval(updateTick, 30000);
    return () => clearInterval(interval);
  }, []);

  // Sync /admin URL access in real-time
  useEffect(() => {
    const checkAdminPath = () => {
      if (window.location.pathname === '/admin') {
        if (!isAdminAuthenticated) {
          setShowAdminLoginModal(true);
        } else {
          setIsAdminOpen(true);
        }
      }
    };
    checkAdminPath();

    window.addEventListener('popstate', checkAdminPath);
    return () => {
      window.removeEventListener('popstate', checkAdminPath);
    };
  }, [isAdminAuthenticated]);

  const handleCloseAdminModal = () => {
    setShowAdminLoginModal(false);
    if (window.location.pathname === '/admin') {
      window.history.pushState({}, '', '/');
    }
  };

  const handleCloseAdminPanel = () => {
    setIsAdminOpen(false);
    if (window.location.pathname === '/admin') {
      window.history.pushState({}, '', '/');
    }
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Add Item to Shopping Cart
  const handleAddToCart = (product: Product, quantity = 1) => {
    const existingIdx = cartItems.findIndex(item => item.productId === product.id);
    let updatedCart = [...cartItems];

    if (existingIdx !== -1) {
      updatedCart[existingIdx].quantity += quantity;
    } else {
      updatedCart.push({
        productId: product.id,
        productName: product.name,
        imageUrl: product.imageUrl,
        price: product.salePrice || product.price,
        quantity: quantity
      });
    }

    setCartItems(updatedCart);
    localStorage.setItem('yummy_cart', JSON.stringify(updatedCart));
    triggerToast(`Added ${quantity}x "${product.name}" to shopping cart! 🛍️`);
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveCartItem(productId);
      return;
    }
    const updated = cartItems.map(item => item.productId === productId ? { ...item, quantity } : item);
    setCartItems(updated);
    localStorage.setItem('yummy_cart', JSON.stringify(updated));
  };

  const handleRemoveCartItem = (productId: string) => {
    const updated = cartItems.filter(item => item.productId !== productId);
    setCartItems(updated);
    localStorage.setItem('yummy_cart', JSON.stringify(updated));
    triggerToast('Product removed from shopping cart.');
  };

  // Wishlist controls
  const handleWishlistToggle = (productId: string) => {
    let updated = [...wishlist];
    if (wishlist.includes(productId)) {
      updated = updated.filter(id => id !== productId);
      triggerToast('Removed from your wishlist.');
    } else {
      updated.push(productId);
      triggerToast('Saved to your wishlist! 💖');
    }
    setWishlist(updated);
    localStorage.setItem('yummy_wishlist', JSON.stringify(updated));
  };

  // Coupon check & Checkout trigger
  const handleCheckoutInitiate = (discount: number, couponCode: string) => {
    setCouponDiscount(discount);
    setActiveCouponCode(couponCode);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  // Final POS submission trigger WhatsApp Message redirection!
  const handleSubmitOrder = async (orderDetails: {
    customerName: string;
    phone: string;
    address: string;
    city: string;
    notes: string;
    paymentMethod: 'COD' | 'WishMoney';
  }) => {
    const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const delivery = subtotal >= config.freeDeliveryThreshold ? 0 : config.deliveryFee;
    const finalTotal = subtotal + delivery - couponDiscount;

    try {
      // POST order payload to server DB
      const result = await createOrder({
        customerName: orderDetails.customerName,
        phone: orderDetails.phone,
        address: orderDetails.address,
        city: orderDetails.city,
        notes: orderDetails.notes,
        items: cartItems,
        subtotal: subtotal,
        deliveryFee: delivery,
        couponDiscount: couponDiscount,
        total: finalTotal,
        paymentMethod: orderDetails.paymentMethod
      });

      if (result) {
        // Clear Cart elements
        setCartItems([]);
        localStorage.removeItem('yummy_cart');
        setIsCheckoutOpen(false);

        // GENERATE CUSTOM WHATSAPP ORDER string
        const cartString = cartItems.map(
          item => `• ${item.productName} (x${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}`
        ).join('\n');

        const messageText = `✨ *YUMMYPRODUCTS - NEW ORDER CONFIRMATION* ✨\n\n` +
          `👤 *Customer Name:* ${orderDetails.customerName}\n` +
          `📞 *Phone Number:* +961 ${orderDetails.phone}\n` +
          `📍 *City / Town:* ${orderDetails.city}\n` +
          `🏡 *Full Address:* ${orderDetails.address}\n` +
          `💳 *Payment Option:* ${orderDetails.paymentMethod === 'COD' ? 'Cash On Delivery (COD)' : 'Wish Money Transfer'}\n` +
          (orderDetails.notes ? `💬 *Delivery Notes:* ${orderDetails.notes}\n` : '') +
          `\n🛍️ *Ordered Products:*\n${cartString}\n\n` +
          `💵 *Basket Subtotal:* $${subtotal.toFixed(2)} USD\n` +
          `🚚 *Delivery Fee:* ${delivery === 0 ? 'FREE' : `$${delivery.toFixed(2)} USD`}\n` +
          (couponDiscount > 0 ? `🎟️ *Promotional Discount:* -$${couponDiscount.toFixed(2)} USD\n` : '') +
          `🔥 *GRAND TOTAL:* $${finalTotal.toFixed(2)} USD\n\n` +
          `Please confirm my delivery dispatch! Thank you. 🌸`;

        const encodedMsg = encodeURIComponent(messageText);
        const whatsappUrl = `https://wa.me/${config.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodedMsg}`;

        // Immediate redirection
        triggerToast("Order submitted! Redirecting to WhatsApp...");
        setTimeout(() => {
          window.open(whatsappUrl, '_blank');
          loadWorkspaceData();
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      triggerToast("Failed to process order. Please try again.");
    }
  };

  // Submit Review Moderation
  const handleReviewSubmission = async (text: string, rating: number, customerName: string) => {
    if (!selectedProduct) return;
    try {
      await submitReview({
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        customerName,
        rating,
        text
      });
      loadWorkspaceData();
    } catch (e) {
      console.error(e);
    }
  };

  // Authenticate Admin
  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminEmail === 'yummyproductslb@gmail.com' && adminPassword === 'yummy2023') {
      setIsAdminAuthorized(true);
      setShowAdminLoginModal(false);
      setIsAdminOpen(true);
      setAdminEmail('');
      setAdminPassword('');
      setAdminLoginError('');
      triggerToast('Moderator authorization confirmed!');
    } else {
      setAdminLoginError('Incorrect moderator credentials. Please check details.');
    }
  };

  // Calculations for filtered products lists
  const filteredProducts = products.filter(p => {
    if (p.isArchived) return false;
    
    // Category match
    if (selectedCategorySlug) {
      const cat = categories.find(c => c.slug === selectedCategorySlug);
      if (!cat) return false;
      
      // Match by exact category name string
      if (p.category.toLowerCase().trim() !== cat.name.toLowerCase().trim()) {
        return false;
      }
    }

    // Subcategory matches
    if (selectedSubcategory) {
      if (p.subcategory.toLowerCase().trim() !== selectedSubcategory.toLowerCase().trim()) {
        return false;
      }
    }

    return true;
  });

  const cartSubtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col justify-between overflow-x-hidden relative font-sans selection:bg-pink-200">
      
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-55 bg-slate-900 border border-slate-800 text-white shadow-2xl rounded-full px-6 py-2.5 text-xs font-bold font-sans tracking-wide flex items-center gap-2 animate-bounce">
          <span className="text-pink-500 animate-pulse">🌸</span> {toastMessage}
        </div>
      )}

      {/* Top promotional Announcement banner */}
      <TopBanner
        bannerText={config.bannerText}
        cartSubtotal={cartSubtotal}
        freeDeliveryThreshold={config.freeDeliveryThreshold}
      />

      {/* Main header block */}
      <Header
        categories={categories}
        cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
        wishlistCount={wishlist.length}
        onCartClick={() => setIsCartOpen(true)}
        onWishlistClick={() => {
          setSelectedCategorySlug(null);
          setSelectedSubcategory(null);
          triggerToast("Wishlisted items are filtered in directory list!");
        }}
        onAdminClick={() => setShowAdminLoginModal(true)}
        onCategorySelect={(slug) => {
          setSelectedCategorySlug(slug);
          setSelectedSubcategory(null);
        }}
        selectedCategorySlug={selectedCategorySlug}
        products={products}
        onProductClick={(p) => setSelectedProduct(p)}
      />

      {/* Main Workspace Frame container */}
      <main className="flex-1 pb-16">
        
        {/* Luxury Cosmetics visual hero slider representation */}
        {!selectedCategorySlug && (
          <div id="hero-cosmetics" className="relative bg-pink-100/40 py-16 px-4 md:px-8 border-b border-pink-100 overflow-hidden">
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-72 h-72 rounded-full bg-pink-300/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-4 right-10 w-96 h-96 rounded-full bg-pink-400/20 blur-3xl pointer-events-none" />

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center relative z-10 select-none">
              <div className="space-y-6 text-center lg:text-left">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-white text-xs font-bold text-pink-600 rounded-full border border-pink-200">
                  <span className="animate-pulse">✨</span> LUXURIOUS BODIES DESERVE ULTIMATE CARE
                </span>
                <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-black text-gray-950 tracking-tight leading-tight">
                  Premium Skincare <br />
                  <span className="text-pink-650 font-serif italic font-normal">Made for Yummy Body</span>
                </h1>
                <p className="text-sm md:text-base text-gray-650 max-w-lg mx-auto lg:mx-0 leading-relaxed font-medium">
                  Not just yummy for food. Our Yummy is for yummy products for your yummy body. 
                  Get fast delivery in Lebanon including Makhmariya, Body Oils, Bath Bombs, and much more.
                </p>
                <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-3 pt-2">
                  <a
                    href="#circle-categories-list"
                    className="px-6 py-3 bg-pink-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-pink-700 shadow-md shadow-pink-200 hover:scale-101 active:scale-99 transition-all text-center"
                  >
                    Explore Categories
                  </a>
                  <a
                    href="https://wa.me/96176477025"
                    target="_blank"
                    rel="noreferrer"
                    className="px-6 py-3 bg-white text-pink-650 border border-pink-200 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-pink-50 hover:scale-101 transition-all text-center flex items-center justify-center gap-1"
                  >
                    WhatsApp Helpline <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>

              {/* Sephora picking aesthetics promo banner image */}
              <div id="hero-img-overlay" className="relative flex justify-center">
                <div className="relative w-full max-w-md aspect-3/2 md:aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-900">
                  <img
                    src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&auto=format&fit=crop&q=80"
                    alt="Sephora beauty picks"
                    className="w-full h-full object-cover opacity-80"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6">
                    <span className="text-[10px] font-extrabold tracking-widest uppercase text-pink-300">EXQUISITE SELECTIONS</span>
                    <h3 className="font-serif text-lg md:text-xl font-bold text-white mt-1">Exclusive Sephora Picks & Luxury Makeup Now Available</h3>
                    <p className="text-white/70 text-xs mt-1 line-clamp-1 font-semibold">Sub-second, instant loading experience.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subcategories visual badges rows */}
        <SubcategoryList
          categories={categories}
          selectedCategorySlug={selectedCategorySlug}
          selectedSubcategory={selectedSubcategory}
          onCategorySelect={(slug) => {
            setSelectedCategorySlug(slug);
            setSelectedSubcategory(null);
          }}
          onSubcategorySelect={(sub) => setSelectedSubcategory(sub)}
        />

        {/* Main interactive product listings frame */}
        <div id="product-directory-frame" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          
          {/* Elegant Category list SCROLLER for Mobile/Mini devices */}
          <div className="lg:hidden mb-8">
            <div className="bg-white rounded-3xl border border-pink-100/70 p-4 sm:p-5 shadow-[0_4px_20px_rgba(244,114,182,0.06)] hover:shadow-[0_8px_25px_rgba(244,114,182,0.1)] transition-shadow duration-300">
              <h3 className="font-serif font-black text-gray-950 text-base border-b border-pink-50/70 pb-3 mb-4 px-1 flex items-center justify-between">
                <span className="flex items-center gap-2"><span>🌸</span> All Categories / الأصناف</span>
                <span className="text-[10px] sm:text-[11px] text-pink-600 uppercase tracking-widest font-sans font-black animate-pulse bg-pink-100/30 px-2 py-0.5 rounded-full border border-pink-200/40">Swipe ➜</span>
              </h3>
              <div className="flex gap-4 sm:gap-5 overflow-x-auto pb-3 pt-1 scroll-smooth snap-x scroller-no-bar">
                {/* All products button */}
                <button
                  onClick={() => {
                    setSelectedCategorySlug(null);
                    setSelectedSubcategory(null);
                  }}
                  className="shrink-0 snap-start flex flex-col items-center gap-2 focus:outline-hidden group cursor-pointer"
                >
                  <div className={`w-15 h-15 sm:w-18 sm:h-18 rounded-full flex items-center justify-center text-xl sm:text-2xl transition-all duration-300 shadow-md ${
                    selectedCategorySlug === null
                      ? 'bg-gradient-to-tr from-pink-600 to-pink-700 text-white ring-4 ring-pink-500/30 scale-105'
                      : 'bg-gradient-to-tr from-pink-50/50 to-pink-50 text-pink-650 border border-pink-100/80 hover:bg-pink-100/40'
                  }`}>
                    🛍️
                  </div>
                  <span className={`text-[10px] sm:text-[11px] font-black text-center tracking-tight leading-tight w-16 sm:w-20 break-words transition-all ${
                    selectedCategorySlug === null ? 'text-pink-700 font-extrabold scale-105' : 'text-gray-650 group-hover:text-pink-600'
                  }`}>
                    All Products
                  </span>
                </button>

                {categories.filter(c => !c.isHidden).map((cat) => {
                  const isSelected = selectedCategorySlug === cat.slug;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategorySlug(cat.slug);
                        setSelectedSubcategory(null);
                      }}
                      className="shrink-0 snap-start flex flex-col items-center gap-2 focus:outline-hidden group cursor-pointer"
                    >
                      <div className="relative">
                        <img
                          src={cat.image}
                          className={`w-15 h-15 sm:w-18 sm:h-18 rounded-full object-cover transition-all duration-300 shadow-md ${
                            isSelected
                              ? 'ring-4 ring-pink-600 ring-offset-2 scale-105 border-2 border-white'
                              : 'border border-pink-150/80 hover:scale-105 hover:border-pink-300'
                          }`}
                          alt=""
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <span className={`text-[10px] sm:text-[11px] font-black text-center tracking-tight leading-tight w-16 sm:w-20 break-words transition-all ${
                        isSelected ? 'text-pink-700 font-extrabold scale-105' : 'text-gray-650 group-hover:text-pink-600'
                      }`}>
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
            
            {/* Elegant vertical category list sidebar under each other */}
            <div className="space-y-6 lg:block hidden">
              <div className="bg-white rounded-3xl border border-pink-100/90 p-5 shadow-xs sticky top-28">
                <h3 className="font-serif font-black text-gray-900 text-base border-b border-pink-50 pb-3 mb-4 flex items-center gap-2">
                  <span>🌸</span> Categories / الأصناف
                </h3>
                
                <div className="flex flex-col gap-2 max-h-[550px] overflow-y-auto pr-1">
                  <button
                    onClick={() => {
                      setSelectedCategorySlug(null);
                      setSelectedSubcategory(null);
                    }}
                    className={`w-full flex items-center justify-between text-left px-4 py-3.5 rounded-xl text-sm font-extrabold tracking-wide uppercase transition-all ${
                      selectedCategorySlug === null
                        ? 'bg-pink-600 text-white shadow-md shadow-pink-200 scale-[1.02]'
                        : 'text-gray-700 hover:bg-pink-50/70 hover:text-pink-700'
                    }`}
                  >
                    <span>🛍️ All Essentials</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${selectedCategorySlug === null ? 'bg-white/20 text-white font-bold' : 'bg-pink-50 text-pink-600 font-black'}`}>
                      {products.filter(p => !p.isArchived).length}
                    </span>
                  </button>

                  {categories.filter(c => !c.isHidden).map((cat) => {
                    const isSelected = selectedCategorySlug === cat.slug;
                    const catProducts = products.filter(p => p.category === cat.name && !p.isArchived);
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategorySlug(cat.slug);
                          setSelectedSubcategory(null);
                        }}
                        className={`w-full flex items-center justify-between text-left px-4 py-3.5 rounded-xl text-sm font-extrabold tracking-wide uppercase transition-all ${
                          isSelected
                            ? 'bg-pink-650 text-white shadow-md shadow-pink-250 scale-[1.02]'
                            : 'text-gray-700 hover:bg-pink-50/70 hover:text-pink-700'
                        }`}
                      >
                        <span className="flex items-center gap-2.5 truncate">
                          <img src={cat.image} className="w-6.5 h-6.5 rounded-full object-cover border border-pink-200" alt="" referrerPolicy="no-referrer" />
                          <span className="truncate">{cat.name}</span>
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white font-bold' : 'bg-slate-100 text-slate-700 font-bold'}`}>
                          {catProducts.length}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* MAIN CATALOG AREA */}
            <div>
              <div className="flex justify-between items-baseline mb-8 pb-3 border-b border-pink-100/40">
                <h2 className="font-serif text-2xl font-black text-gray-950">
                  {selectedCategorySlug 
                    ? `${categories.find(c => c.slug === selectedCategorySlug)?.name} Collection`
                    : 'Featured Collections'
                  }
                  {selectedSubcategory ? ` — ${selectedSubcategory}` : ''}
                  <span className="text-xs text-pink-500 font-bold uppercase tracking-widest block mt-1 font-sans">
                    {filteredProducts.length} Premium items in stock
                  </span>
                </h2>

                {/* Clear filters trigger */}
                {(selectedCategorySlug || selectedSubcategory) && (
                  <button
                    onClick={() => {
                      setSelectedCategorySlug(null);
                      setSelectedSubcategory(null);
                    }}
                    className="text-xs font-semibold text-pink-650 hover:underline uppercase tracking-wider animate-pulse"
                  >
                    Clear Filters ×
                  </button>
                )}
              </div>

              {loading ? (
                <div className="text-center py-20 flex flex-col items-center">
                  <Loader className="h-8 w-8 text-pink-500 animate-spin mb-4" />
                  <p className="text-xs text-gray-500 font-semibold tracking-wide">Synchronizing YummyProducts databases...</p>
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {filteredProducts.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      isWishlisted={wishlist.includes(p.id)}
                      onWishlistToggle={() => handleWishlistToggle(p.id)}
                      onAddToCart={() => handleAddToCart(p, 1)}
                      onViewDetails={() => setSelectedProduct(p)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white border border-pink-50 rounded-3xl">
                  <AlertTriangle className="h-10 w-10 text-pink-300 mx-auto mb-3" />
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">No matching cosmetics found!</p>
                  <p className="text-[10px] text-gray-400 mt-1">Try selecting another list or clearing filters</p>
                </div>
              )}
            </div>

          </div>

        </div>

      </main>

      {/* Website footer coordinates layout */}
      <footer className="bg-slate-900 text-white pt-12 pb-24 md:pb-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-white p-0.5 flex items-center justify-center">
                <img 
                  src="https://www.image2url.com/r2/default/images/1780745942465-101ab094-b828-4763-b5f7-b05c5bf092b1.webp" 
                  alt="YummyProducts Logo" 
                  className="w-full h-full rounded-full object-cover border border-slate-205 shadow-sm"
                  referrerPolicy="no-referrer"
                />
              </div>
              <strong className="font-serif text-lg tracking-wider text-white">YUMMYProducts</strong>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              We are an online business based in Lebanon, offering body and facial care including makhmaria, body oils, bath bombs, and much more.
            </p>
            <p className="text-xs text-pink-500 font-bold">
              Give Yumminess to your yummy body! 💕
            </p>
          </div>

          <div className="space-y-3 font-medium text-xs text-slate-400">
            <h4 className="font-serif font-black text-white text-sm">Customer Care</h4>
            <p>🔄 Cash on Delivery (COD) / Wish Money inside Lebanon</p>
            <p>📦 Delivery Charge flat rate: $4 USD</p>
            <p>🚀 Fast Lebanon Dispatch under 24 hours</p>
            <p>🌟 Core Web Vitals optimized premium speed experience</p>
          </div>

          <div className="space-y-3 font-medium text-xs text-slate-400">
            <h4 className="font-serif font-black text-white text-sm">Contact Workspace</h4>
            <p className="flex items-center gap-1.5"><Mail className="h-4 w-4 text-pink-550 shrink-0" /> yummyproducts.lb@gmail.com</p>
            <p className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-pink-550 shrink-0" /> {config.whatsappNumber}</p>
            <p className="text-[10px] text-slate-500">Copyright © YummyProductslb2026. Powered by Mondo technical</p>
          </div>

          {/* Social connections links (Synchronized dynamically via settings tab) */}
          <div className="space-y-4">
            <h4 className="font-serif font-black text-white text-sm">Connect With Us</h4>
            <div className="flex gap-2">
              <a
                href={config.facebookUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 bg-slate-800 hover:bg-pink-600 rounded-full transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-4.5 w-4.5 text-white" />
              </a>
              <a
                href={config.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 bg-slate-800 hover:bg-pink-600 rounded-full transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-4.5 w-4.5 text-white" />
              </a>
              <a
                href={`https://wa.me/${config.whatsappNumber.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 bg-slate-800 hover:bg-green-600 rounded-full transition-all"
                aria-label="WhatsApp"
              >
                <MessageCircle className="h-4.5 w-4.5 text-white" />
              </a>
            </div>
            <div className="pt-2">
              <span className="text-[9px] uppercase tracking-wider bg-slate-800 text-slate-400 px-2.5 py-1.5 rounded-lg font-bold border border-slate-700/60 block text-center">
                🇱🇧 Based in Lebanon
              </span>
            </div>
            <div className="pt-2.5">
              <a
                href={`https://wa.me/${config.whatsappNumber.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] hover:bg-[#20ba5a] text-white text-[13px] font-black rounded-xl shadow-lg transition-all hover:scale-[1.03] duration-300 uppercase tracking-wider"
              >
                <div className="relative">
                  <span className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-red-400 ping animate-ping -top-1 -right-1" />
                  <MessageCircle className="h-5 w-5 fill-current text-white" />
                </div>
                <span>WhatsApp Support / واتساب 🌸</span>
              </a>
            </div>
          </div>

        </div>
      </footer>

      {/* Floating Sticky Bottom Bar for Mobile Device view convenience */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-pink-100 flex justify-around items-center h-16 md:hidden shadow-xl px-2">
        <button
          onClick={() => {
            setSelectedCategorySlug(null);
            setSelectedSubcategory(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex flex-col items-center gap-1 text-[10px] font-bold text-gray-500 hover:text-pink-600"
        >
          <Sparkles className="h-5 w-5" />
          <span>Shop</span>
        </button>

        <button
          onClick={() => {
            setSelectedCategorySlug(null);
            setSelectedSubcategory(null);
            triggerToast("Wishlisted items are filtered in product list!");
          }}
          className="flex flex-col items-center gap-1 text-[10px] font-bold text-gray-500 hover:text-pink-600 relative"
        >
          <Heart className="h-5 w-5" />
          <span>Wishlist</span>
          {wishlist.length > 0 && (
            <span className="absolute top-0 right-2 bg-pink-500 text-white text-[8px] font-bold px-1.5 rounded-full leading-none py-0.5">
              {wishlist.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setIsCartOpen(true)}
          className="flex flex-col items-center gap-1 text-[10px] font-bold text-gray-500 hover:text-pink-600 relative"
        >
          <ShoppingBag className="h-5 w-5" />
          <span>Cart</span>
          {cartItems.length > 0 && (
            <span className="absolute top-0 right-2 bg-pink-600 text-white text-[8px] font-bold px-1.5 rounded-full leading-none py-0.5">
              {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
            </span>
          )}
        </button>


      </div>

      {/* Modulator Details popup */}
      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          reviews={reviews}
          isWishlisted={wishlist.includes(selectedProduct.id)}
          onWishlistToggle={() => handleWishlistToggle(selectedProduct.id)}
          onAddToCart={(qty) => {
            handleAddToCart(selectedProduct, qty);
          }}
          onClose={() => setSelectedProduct(null)}
          onSubmitReview={handleReviewSubmission}
        />
      )}

      {/* Cart Slider */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        coupons={coupons}
        freeDeliveryThreshold={config.freeDeliveryThreshold}
        deliveryFee={config.deliveryFee}
        onCheckOut={handleCheckoutInitiate}
      />

      {/* Secure Checkout Frame */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cartItems}
        subtotal={cartSubtotal}
        deliveryFee={cartSubtotal >= config.freeDeliveryThreshold ? 0 : config.deliveryFee}
        couponDiscount={couponDiscount}
        activeCouponCode={activeCouponCode}
        onSubmitOrder={handleSubmitOrder}
      />

      {/* Secure Moderator Authentication screen */}
      {showAdminLoginModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
          <div onClick={handleCloseAdminModal} className="fixed inset-0 bg-gray-950/60 backdrop-blur-xs transition-opacity" />

          <div className="relative bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full border border-pink-100 shadow-2xl animate-scale-in">
            <button
              onClick={handleCloseAdminModal}
              className="absolute top-4.5 right-4.5 text-gray-400 hover:text-pink-650"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="text-center mb-6 select-none">
              <span className="text-3xl inline-block mb-2">🔐</span>
              <h3 className="font-serif font-black text-lg text-gray-900 uppercase tracking-wide">Moderator Gate</h3>
              <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-widest">Provide central authentication parameters</p>
            </div>

            <form onSubmit={handleAdminAuth} className="space-y-4">
              <div>
                <label className="block text-[9px] font-extrabold uppercase tracking-widest text-gray-450 mb-1">Moderator Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="yummyproductslb@gmail.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full text-xs font-semibold border border-pink-150 rounded-xl px-3 py-2.5 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[9px] font-extrabold uppercase tracking-widest text-gray-450 mb-1">Secret Keyphrase</label>
                <input
                  type="password"
                  required
                  placeholder="yummy2023"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full text-xs border border-pink-150 rounded-xl px-3 py-2.5 outline-hidden font-mono"
                />
              </div>

              {adminLoginError && (
                <p className="text-[10px] text-red-500 font-bold text-center px-1">
                  ⚠️ {adminLoginError}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-97 cursor-pointer"
              >
                Sign In
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN PANEL SIDEBAR COMPONENT */}
      <AdminPanel
        isOpen={isAdminOpen}
        onClose={handleCloseAdminPanel}
        products={products}
        categories={categories}
        reviews={reviews}
        coupons={coupons}
        orders={orders}
        config={config}
        onRefreshData={loadWorkspaceData}
        onProductClick={(p) => {
          setSelectedProduct(p);
          handleCloseAdminPanel();
        }}
      />

      {/* FLOAT SUPPORT CHAT SYSTEM OVERLAY */}
      <LiveChatWidget />

    </div>
  );
}
