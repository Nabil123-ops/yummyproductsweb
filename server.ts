import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { initialProducts } from './src/data/initialProducts';
import { initialCategories } from './src/data/initialCategories';

let activeDirname = '';
try {
  if (typeof __dirname !== 'undefined' && __dirname) {
    activeDirname = __dirname;
  } else {
    activeDirname = path.dirname(fileURLToPath(import.meta.url));
  }
} catch (e) {
  activeDirname = process.cwd();
}

// Ensure data folder exists
const dbDir = path.join(activeDirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'db.json');

// Ensure uploads folder exists
const uploadsDir = path.join(activeDirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Helper to load/save the local JSON database
function getDb() {
  if (!fs.existsSync(dbPath)) {
    const defaultConfig = {
      freeDeliveryThreshold: 100,
      deliveryFee: 4,
      bannerText: "✨ FREE DELIVERY ON ORDERS OVER $100 — FRESH BEAUTY IN LEBANON! ✨",
      facebookUrl: "https://facebook.com/yummyproductslb",
      instagramUrl: "https://instagram.com/yummyproductslb",
      tiktokUrl: "https://tiktok.com/@yummyproductslb",
      whatsappNumber: "+96176477025",
      email: "yummyproductslb@gmail.com"
    };

    const initialCoupons = [
      { id: 'c-1', code: 'YUMMY2026', type: 'percentage', value: 10, expirationDate: '2026-12-31', usageLimit: 100, usageCount: 0, isActive: true },
      { id: 'c-2', code: 'WISH5', type: 'fixed', value: 5, expirationDate: '2026-08-31', usageLimit: 50, usageCount: 0, isActive: true }
    ];

    const initialReviews = [
      {
        id: 'r-1',
        productId: 'p-22',
        productName: 'Pure Musk Al Tahara',
        customerName: 'Maya K.',
        rating: 5,
        text: 'Smells incredibly clean and fresh! Highly recommend for everyone in Lebanon who loves soft musk!',
        isApproved: true,
        createdAt: '2026-06-01T14:30:00Z'
      },
      {
        id: 'r-2',
        productId: 'p-13',
        productName: 'Baccarat Rouge Body Oil',
        customerName: 'Zeina T.',
        rating: 5,
        text: 'Super luxurious and fast-absorbing. My skin feels yummy and smells exactly like Baccarat Rouge!',
        isApproved: true,
        createdAt: '2026-06-03T18:22:00Z'
      }
    ];

    const initialData = {
      config: defaultConfig,
      categories: initialCategories,
      products: initialProducts,
      orders: [],
      reviews: initialReviews,
      coupons: initialCoupons,
      importLogs: []
    };

    fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }

  try {
    const raw = fs.readFileSync(dbPath, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed.chats) {
      parsed.chats = [];
    }

    // Auto-sync empty categories with relevant products dynamically
    let changed = false;
    const activeProducts = parsed.products || [];
    const activeCategories = parsed.categories || [];

    activeCategories.forEach((cat: any) => {
      const hasProducts = activeProducts.some((p: any) => p.category === cat.name && !p.isArchived);
      if (!hasProducts && !cat.isHidden) {
        console.log(`[Auto-Sync] Category "${cat.name}" has 0 products. Finding relevant products...`);
        const catNameLower = cat.name.toLowerCase();
        let keywords: string[] = [];
        
        if (catNameLower.includes("lip") || catNameLower.includes("lash")) {
          keywords = ["lip", "lash", "eyebrow", "mascara", "gloss", "lipstick"];
        } else if (catNameLower.includes("body")) {
          keywords = ["body", "lotion", "cream", "butter", "scrub", "moisturizer"];
        } else if (catNameLower.includes("face")) {
          keywords = ["face", "cleanser", "toner", "acne", "mask", "serum"];
        } else if (catNameLower.includes("intimate")) {
          keywords = ["intimate", "fem", "wash", "hygiene"];
        } else if (catNameLower.includes("hair")) {
          keywords = ["hair", "shampoo", "conditioner", "keratin"];
        } else if (catNameLower.includes("essential")) {
          keywords = ["essential", "oil", "essence", "lavender", "mint"];
        } else if (catNameLower.includes("makhmaria")) {
          keywords = ["makhmaria", "fragrance", "perfume", "scent"];
        } else if (catNameLower.includes("musk")) {
          keywords = ["musk", "tahara", "misk"];
        } else if (catNameLower.includes("bath") || catNameLower.includes("soap")) {
          keywords = ["bath", "bomb", "soap", "shower", "gel"];
        } else if (catNameLower.includes("gentlemen")) {
          keywords = ["men", "man", "beard", "aftershave", "shave"];
        } else if (catNameLower.includes("younger")) {
          keywords = ["young", "kid", "baby", "teen", "child"];
        } else if (catNameLower.includes("candle")) {
          keywords = ["candle", "wax", "scented"];
        } else if (catNameLower.includes("accessories")) {
          keywords = ["accessory", "brush", "sponge", "roller", "pillow"];
        } else if (catNameLower.includes("set")) {
          keywords = ["set", "pack", "kit", "gift", "bundle"];
        } else if (catNameLower.includes("imported")) {
          keywords = ["import", "french", "brand"];
        }

        if (keywords.length > 0) {
          let matchesFound = 0;
          activeProducts.forEach((p: any) => {
            const matchesKeyword = keywords.some(kw => 
              p.name.toLowerCase().includes(kw) || 
              (p.description && p.description.toLowerCase().includes(kw))
            );
            if (matchesKeyword && matchesFound < 5) {
              p.category = cat.name;
              matchesFound++;
              changed = true;
              console.log(`[Auto-Sync] Moved product "${p.name}" into empty category "${cat.name}"`);
            }
          });
        }
      }
    });

    if (changed) {
      fs.writeFileSync(dbPath, JSON.stringify(parsed, null, 2), 'utf-8');
    }

    return parsed;
  } catch (err) {
    console.error("Error reading database json, resetting files", err);
    return {
      config: {
        freeDeliveryThreshold: 100,
        deliveryFee: 4,
        bannerText: "✨ FREE DELIVERY ON ORDERS OVER $100 — FRESH BEAUTY IN LEBANON! ✨",
        facebookUrl: "https://facebook.com/yummyproductslb",
        instagramUrl: "https://instagram.com/yummyproductslb",
        tiktokUrl: "https://tiktok.com/@yummyproductslb",
        whatsappNumber: "+96176477025",
        email: "yummyproductslb@gmail.com"
      },
      categories: initialCategories,
      products: initialProducts,
      orders: [],
      reviews: [],
      coupons: [],
      importLogs: []
    };
  }
}

function saveDb(data: any) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use('/uploads', express.static(uploadsDir));

  // API ROUTING SECTION
  app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date() });
  });

  // Image Uploads (Base64 format for high efficiency and all-format compatibility)
  app.post('/api/upload', (req, res) => {
    try {
      const { image, name } = req.body;
      if (!image) {
        return res.status(400).json({ error: 'No image base64 data provided' });
      }

      const matches = image.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ error: 'Invalid base64 format' });
      }

      const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');

      const sanitizedName = (name || 'upload')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 30);
      const fileName = `${sanitizedName}-${Date.now()}.${ext}`;
      const filePath = path.join(uploadsDir, fileName);

      fs.writeFileSync(filePath, buffer);

      res.json({ imageUrl: `/uploads/${fileName}` });
    } catch (err: any) {
      console.error('Upload error in server:', err);
      res.status(500).json({ error: err.message || 'Failed to save image' });
    }
  });

  // Website Config
  app.get('/api/config', (req, res) => {
    const db = getDb();
    res.json(db.config);
  });

  app.post('/api/config', (req, res) => {
    const db = getDb();
    db.config = { ...db.config, ...req.body };
    saveDb(db);
    res.json(db.config);
  });

  // Categories
  app.get('/api/categories', (req, res) => {
    const db = getDb();
    const sorted = [...db.categories].sort((a, b) => a.order - b.order);
    res.json(sorted);
  });

  app.post('/api/categories', (req, res) => {
    const db = getDb();
    const newCat = {
      id: 'cat-' + Date.now(),
      name: req.body.name,
      slug: req.body.slug || req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      image: req.body.image || 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&auto=format&fit=crop&q=80',
      banner: req.body.banner || '',
      icon: req.body.icon || 'Sparkles',
      order: Number(req.body.order) || db.categories.length + 1,
      isHidden: !!req.body.isHidden,
      subcategories: req.body.subcategories || []
    };
    db.categories.push(newCat);
    saveDb(db);
    res.json(newCat);
  });

  app.put('/api/categories/:id', (req, res) => {
    const db = getDb();
    const idx = db.categories.findIndex((c: any) => c.id === req.params.id);
    if (idx !== -1) {
      db.categories[idx] = { ...db.categories[idx], ...req.body };
      saveDb(db);
      res.json(db.categories[idx]);
    } else {
      res.status(404).json({ error: 'Category not found' });
    }
  });

  app.delete('/api/categories/:id', (req, res) => {
    const db = getDb();
    db.categories = db.categories.filter((c: any) => c.id !== req.params.id);
    saveDb(db);
    res.json({ success: true });
  });

  // Products
  app.get('/api/products', (req, res) => {
    const db = getDb();
    res.json(db.products);
  });

  app.post('/api/products', (req, res) => {
    const db = getDb();
    const newProd = {
      id: 'p-' + Date.now(),
      name: req.body.name,
      sku: req.body.sku || 'SKU-' + Math.floor(Math.random() * 100000),
      barcode: req.body.barcode || '76477025' + Math.floor(Math.random() * 1000),
      price: Number(req.body.price) || 0,
      salePrice: req.body.salePrice ? Number(req.body.salePrice) : undefined,
      description: req.body.description || '',
      category: req.body.category || '',
      subcategory: req.body.subcategory || '',
      stockQuantity: Number(req.body.stockQuantity) || 10,
      imageUrl: req.body.imageUrl || 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&auto=format&fit=crop&q=80',
      galleryImages: req.body.galleryImages || [],
      videoUrl: req.body.videoUrl || '',
      brand: req.body.brand || 'Yummy Products',
      weight: req.body.weight || '',
      isArchived: !!req.body.isArchived,
      isFeatured: !!req.body.isFeatured,
      isNewArrival: !!req.body.isNewArrival,
      ratingAverage: 5.0,
      reviewsCount: 0
    };
    db.products.push(newProd);
    saveDb(db);
    res.json(newProd);
  });

  app.put('/api/products/:id', (req, res) => {
    const db = getDb();
    const idx = db.products.findIndex((p: any) => p.id === req.params.id);
    if (idx !== -1) {
      db.products[idx] = { ...db.products[idx], ...req.body };
      saveDb(db);
      res.json(db.products[idx]);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  });

  app.post('/api/products/duplicate/:id', (req, res) => {
    const db = getDb();
    const prod = db.products.find((p: any) => p.id === req.params.id);
    if (prod) {
      const copy = {
        ...prod,
        id: 'p-' + Date.now(),
        name: prod.name + ' (Copy)',
        sku: prod.sku + '-D',
        barcode: prod.barcode + '-D'
      };
      db.products.push(copy);
      saveDb(db);
      res.json(copy);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  });

  app.delete('/api/products/:id', (req, res) => {
    const db = getDb();
    db.products = db.products.filter((p: any) => p.id !== req.params.id);
    saveDb(db);
    res.json({ success: true });
  });

  // Excel & CSV Sync Engine
  app.post('/api/products/import', (req, res) => {
    const { products: importedList } = req.body;
    if (!Array.isArray(importedList)) {
      return res.status(400).json({ error: 'Invalid product list format' });
    }

    const db = getDb();
    let updatedCount = 0;
    let createdCount = 0;
    const errors: string[] = [];

    importedList.forEach((item, index) => {
      try {
        if (!item.product_name) {
          errors.push(`Row ${index + 1}: Missing product_name`);
          return;
        }

        const sku = item.sku || 'SKU-' + Math.floor(Math.random() * 10000);
        const barcode = item.barcode || '';
        const price = parseFloat(item.price) || parseFloat(item.price_after) || 0;
        const salePrice = item.sale_price || item.price_before ? parseFloat(item.price_before) : undefined;
        // Check duplication by SKU or product_name
        const existingIdx = db.products.findIndex((p: any) => 
          (sku && p.sku === sku) || 
          p.name.toLowerCase().trim() === item.product_name.toLowerCase().trim()
        );

        const prodItem = {
          name: item.product_name,
          sku: sku,
          barcode: barcode,
          price: price,
          salePrice: salePrice,
          description: item.description || '',
          category: item.category || 'All Products',
          subcategory: item.subcategory || 'Accessories',
          stockQuantity: parseInt(item.stock_quantity) || parseInt(item.inventory) || 20,
          imageUrl: item.image_url || 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&auto=format&fit=crop&q=80',
          galleryImages: item.gallery_images ? item.gallery_images.split(',') : [],
          brand: item.brand || 'Yummy Products',
          weight: item.weight || '',
          isArchived: false,
          isFeatured: false,
          isNewArrival: true,
          ratingAverage: 5.0,
          reviewsCount: 0
        };

        if (existingIdx !== -1) {
          // Bulk update
          db.products[existingIdx] = { ...db.products[existingIdx], ...prodItem };
          updatedCount++;
        } else {
          // Bulk create
          db.products.push({
            id: 'p-import-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            ...prodItem
          });
          createdCount++;
        }
      } catch (err: any) {
        errors.push(`Row ${index + 1}: ${err.message}`);
      }
    });

    // Save history
    const log = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      createdCount,
      updatedCount,
      errorsCount: errors.length,
      errors: errors.slice(0, 10) // store up to 10 errors
    };
    db.importLogs = db.importLogs || [];
    db.importLogs.unshift(log);

    saveDb(db);
    res.json({ success: true, createdCount, updatedCount, errors, log });
  });

  app.get('/api/import-logs', (req, res) => {
    const db = getDb();
    res.json(db.importLogs || []);
  });

  // Coupons
  app.get('/api/coupons', (req, res) => {
    const db = getDb();
    res.json(db.coupons);
  });

  app.post('/api/coupons', (req, res) => {
    const db = getDb();
    const newCoupon = {
      id: 'c-' + Date.now(),
      code: req.body.code.toUpperCase().trim(),
      type: req.body.type || 'percentage',
      value: Number(req.body.value) || 0,
      expirationDate: req.body.expirationDate || '2026-12-31',
      usageLimit: req.body.usageLimit ? Number(req.body.usageLimit) : undefined,
      usageCount: 0,
      isActive: true
    };
    db.coupons.push(newCoupon);
    saveDb(db);
    res.json(newCoupon);
  });

  app.delete('/api/coupons/:id', (req, res) => {
    const db = getDb();
    db.coupons = db.coupons.filter((c: any) => c.id !== req.params.id);
    saveDb(db);
    res.json({ success: true });
  });

  // Reviews
  app.get('/api/reviews', (req, res) => {
    const db = getDb();
    res.json(db.reviews);
  });

  app.post('/api/reviews', (req, res) => {
    const db = getDb();
    const newReview = {
      id: 'r-' + Date.now(),
      productId: req.body.productId,
      productName: req.body.productName,
      customerName: req.body.customerName || 'Anonymous',
      rating: Number(req.body.rating) || 5,
      text: req.body.text || '',
      imageUrls: req.body.imageUrls || [],
      isApproved: false, // requires admin approval
      createdAt: new Date().toISOString()
    };
    db.reviews.push(newReview);
    saveDb(db);
    res.json(newReview);
  });

  app.put('/api/reviews/:id', (req, res) => {
    const db = getDb();
    const idx = db.reviews.findIndex((r: any) => r.id === req.params.id);
    if (idx !== -1) {
      db.reviews[idx] = { ...db.reviews[idx], ...req.body };
      saveDb(db);
      res.json(db.reviews[idx]);
    } else {
      res.status(404).json({ error: 'Review not found' });
    }
  });

  app.delete('/api/reviews/:id', (req, res) => {
    const db = getDb();
    db.reviews = db.reviews.filter((r: any) => r.id !== req.params.id);
    saveDb(db);
    res.json({ success: true });
  });

  // Orders
  app.get('/api/orders', (req, res) => {
    const db = getDb();
    res.json(db.orders);
  });

  app.post('/api/orders', (req, res) => {
    const db = getDb();
    const newOrder = {
      id: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
      customerName: req.body.customerName,
      phone: req.body.phone,
      address: req.body.address,
      city: req.body.city,
      notes: req.body.notes || '',
      items: req.body.items,
      subtotal: Number(req.body.subtotal),
      deliveryFee: Number(req.body.deliveryFee),
      couponDiscount: Number(req.body.couponDiscount || 0),
      total: Number(req.body.total),
      paymentMethod: req.body.paymentMethod,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // Update stock levels
    newOrder.items.forEach((item: any) => {
      const prodIdx = db.products.findIndex((p: any) => p.id === item.productId);
      if (prodIdx !== -1) {
        db.products[prodIdx].stockQuantity = Math.max(0, db.products[prodIdx].stockQuantity - item.quantity);
      }
    });

    db.orders.push(newOrder);
    saveDb(db);
    res.json(newOrder);
  });

  app.put('/api/orders/:id', (req, res) => {
    const db = getDb();
    const idx = db.orders.findIndex((o: any) => o.id === req.params.id);
    if (idx !== -1) {
      db.orders[idx] = { ...db.orders[idx], ...req.body };
      saveDb(db);
      res.json(db.orders[idx]);
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  });

  // Support Live Chat System Endpoints
  app.get('/api/chats', (req, res) => {
    const db = getDb();
    if (!db.chats) db.chats = [];
    res.json(db.chats);
  });

  app.get('/api/chats/:sessionId/messages', (req, res) => {
    const db = getDb();
    if (!db.chats) db.chats = [];
    const chat = db.chats.find((c: any) => c.id === req.params.sessionId);
    if (chat) {
      res.json(chat.messages || []);
    } else {
      res.json([]);
    }
  });

  app.post('/api/chats/messages', (req, res) => {
    const db = getDb();
    if (!db.chats) db.chats = [];
    
    const { sessionId, customerName, sender, text } = req.body;
    if (!sessionId || !text) {
      return res.status(400).json({ error: 'Missing sessionId or text' });
    }

    let chat = db.chats.find((c: any) => c.id === sessionId);
    if (!chat) {
      chat = {
        id: sessionId,
        customerName: customerName || 'Valued Customer',
        messages: [],
        lastUpdated: new Date().toISOString(),
        isUnreadForAdmin: true,
        isUnreadForUser: false
      };
      db.chats.push(chat);
    }

    const newMessage = {
      id: 'msg-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      sender: sender || 'user',
      text: text,
      timestamp: new Date().toISOString()
    };

    chat.messages = chat.messages || [];
    chat.messages.push(newMessage);
    chat.lastUpdated = new Date().toISOString();
    
    if (sender === 'user') {
      chat.isUnreadForAdmin = true;
      chat.isUnreadForUser = false;
    } else {
      chat.isUnreadForAdmin = false;
      chat.isUnreadForUser = true;
    }

    if (customerName && chat.customerName !== customerName) {
      chat.customerName = customerName;
    }

    saveDb(db);
    res.json(chat);
  });

  app.post('/api/chats/:sessionId/read', (req, res) => {
    const db = getDb();
    if (!db.chats) db.chats = [];
    const { role } = req.body;
    const idx = db.chats.findIndex((c: any) => c.id === req.params.sessionId);
    if (idx !== -1) {
      if (role === 'admin') {
        db.chats[idx].isUnreadForAdmin = false;
      } else {
        db.chats[idx].isUnreadForUser = false;
      }
      saveDb(db);
      res.json(db.chats[idx]);
    } else {
      res.status(404).json({ error: 'Chat not found' });
    }
  });

  // VITE DEVELOPMENT MIDDLEWARE OR STATIC PRODUCTION BUILD SERVING
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🛍️  YummyProducts full stack app running on http://localhost:${PORT}`);
  });
}

startServer();
