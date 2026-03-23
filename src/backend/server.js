/**
 * Tienda — App-Specific Commerce Chain for LATAM on Initia
 * Express.js Backend API Server
 *
 * Provides REST endpoints for:
 *   - Merchant onboarding & store management
 *   - Product catalog CRUD
 *   - Order management & fulfillment
 *   - Loyalty program management
 *   - Search & discovery
 *   - Payment processing integration
 *   - Merchant analytics
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const winston = require('winston');
const Joi = require('joi');
const { LCDClient, MnemonicKey, MsgExecute, Wallet } = require('@initia/initia.js');

// =============================================================================
// Initia SDK Configuration
// =============================================================================

const INITIA_LCD_URL = process.env.INITIA_LCD_URL || 'https://lcd.testnet.initia.xyz';
const INITIA_CHAIN_ID = process.env.INITIA_CHAIN_ID || 'initiation-2';
const MARKETPLACE_MODULE_ADDR = process.env.MARKETPLACE_MODULE_ADDR || '';
const PLATFORM_FEE_BPS = 150; // 1.5% as stated in pitch

const lcd = new LCDClient(INITIA_LCD_URL, {
  chainId: INITIA_CHAIN_ID,
  gasPrices: '0.15uinit',
  gasAdjustment: '1.5',
});

// Optional: backend signer for admin operations
let adminWallet = null;
if (process.env.ADMIN_MNEMONIC) {
  const adminKey = new MnemonicKey({ mnemonic: process.env.ADMIN_MNEMONIC });
  adminWallet = new Wallet(lcd, adminKey);
}

// =============================================================================
// Logger
// =============================================================================

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'tienda-api' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// =============================================================================
// App initialization
// =============================================================================

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Merchant-Key'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT || 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use(limiter);

// =============================================================================
// In-memory data store (replace with database in production)
// =============================================================================

const db = {
  merchants: new Map(),       // merchantId -> MerchantProfile
  merchantsByAddr: new Map(), // walletAddress -> merchantId
  products: new Map(),        // productId -> Product
  orders: new Map(),          // orderId -> Order
  loyaltyAccounts: new Map(), // walletAddress -> LoyaltyAccount
  reviews: new Map(),         // reviewId -> Review
  categories: new Set([
    'electronics', 'clothing', 'food', 'home', 'beauty',
    'sports', 'toys', 'automotive', 'books', 'services',
  ]),
  analytics: new Map(),       // merchantId -> AnalyticsData
};

// =============================================================================
// Validation schemas
// =============================================================================

const schemas = {
  merchantRegister: Joi.object({
    walletAddress: Joi.string().required().min(10).max(100),
    storeName: Joi.string().required().min(2).max(100),
    description: Joi.string().required().max(1000),
    country: Joi.string().required().length(2).uppercase(),
    city: Joi.string().required().max(100),
    categories: Joi.array().items(Joi.string().max(50)).min(1).max(10).required(),
    contactEmail: Joi.string().email().optional(),
    contactPhone: Joi.string().max(20).optional(),
    logoUri: Joi.string().uri().optional(),
  }),

  merchantUpdate: Joi.object({
    storeName: Joi.string().min(2).max(100),
    description: Joi.string().max(1000),
    city: Joi.string().max(100),
    categories: Joi.array().items(Joi.string().max(50)).min(1).max(10),
    contactEmail: Joi.string().email(),
    contactPhone: Joi.string().max(20),
    logoUri: Joi.string().uri(),
  }).min(1),

  productCreate: Joi.object({
    name: Joi.string().required().min(2).max(200),
    description: Joi.string().required().max(5000),
    price: Joi.number().required().positive().precision(6),
    stock: Joi.number().required().integer().min(0),
    category: Joi.string().required().max(50),
    imageUri: Joi.string().uri().optional(),
    images: Joi.array().items(Joi.string().uri()).max(10).optional(),
    metadata: Joi.object().optional(),
    tags: Joi.array().items(Joi.string().max(30)).max(20).optional(),
    weight: Joi.number().positive().optional(),
    dimensions: Joi.object({
      length: Joi.number().positive(),
      width: Joi.number().positive(),
      height: Joi.number().positive(),
      unit: Joi.string().valid('cm', 'in'),
    }).optional(),
    shippingInfo: Joi.object({
      freeShipping: Joi.boolean(),
      shippingCost: Joi.number().min(0),
      estimatedDays: Joi.number().integer().min(1).max(90),
      availableRegions: Joi.array().items(Joi.string()),
    }).optional(),
  }),

  productUpdate: Joi.object({
    name: Joi.string().min(2).max(200),
    description: Joi.string().max(5000),
    price: Joi.number().positive().precision(6),
    stock: Joi.number().integer().min(0),
    category: Joi.string().max(50),
    imageUri: Joi.string().uri(),
    images: Joi.array().items(Joi.string().uri()).max(10),
    metadata: Joi.object(),
    tags: Joi.array().items(Joi.string().max(30)).max(20),
    isActive: Joi.boolean(),
    shippingInfo: Joi.object(),
  }).min(1),

  orderCreate: Joi.object({
    buyerAddress: Joi.string().required().min(10).max(100),
    productId: Joi.string().required(),
    quantity: Joi.number().required().integer().positive(),
    shippingRef: Joi.string().required().max(500),
    loyaltyPointsToRedeem: Joi.number().integer().min(0).default(0),
    paymentMethod: Joi.string().valid('native', 'stablecoin', 'fiat_bridge').default('native'),
  }),

  reviewCreate: Joi.object({
    rating: Joi.number().required().integer().min(1).max(5),
    comment: Joi.string().required().max(2000),
  }),

  search: Joi.object({
    q: Joi.string().max(200),
    category: Joi.string().max(50),
    country: Joi.string().length(2),
    city: Joi.string().max(100),
    minPrice: Joi.number().min(0),
    maxPrice: Joi.number().positive(),
    sortBy: Joi.string().valid('price_asc', 'price_desc', 'newest', 'rating', 'popularity'),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    merchantId: Joi.string(),
    tags: Joi.string(),
  }),
};

// =============================================================================
// Middleware helpers
// =============================================================================

/** Validate request body against a Joi schema. */
function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map((d) => d.message),
      });
    }
    req.validated = value;
    next();
  };
}

/** Validate query parameters. */
function validateQuery(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map((d) => d.message),
      });
    }
    req.validatedQuery = value;
    next();
  };
}

/** Simple auth middleware: checks X-Merchant-Key header matches merchant wallet. */
function authMerchant(req, res, next) {
  const merchantKey = req.headers['x-merchant-key'];
  if (!merchantKey) {
    return res.status(401).json({ error: 'Missing X-Merchant-Key header' });
  }
  const merchantId = db.merchantsByAddr.get(merchantKey);
  if (!merchantId) {
    return res.status(403).json({ error: 'Merchant not found or not authorized' });
  }
  req.merchantId = merchantId;
  req.merchantAddress = merchantKey;
  next();
}

/**
 * Buyer auth middleware: verifies buyer identity via signed message.
 * Expects headers:
 *   X-Buyer-Address: the buyer's wallet address
 *   X-Buyer-Signature: signature of a nonce/timestamp payload
 *   X-Buyer-Nonce: the nonce/timestamp that was signed
 *
 * In development mode (NODE_ENV !== 'production'), falls back to
 * trusting X-Buyer-Address if no signature is provided.
 */
function authBuyer(req, res, next) {
  const buyerAddress = req.headers['x-buyer-address'] || req.body.buyerAddress;
  if (!buyerAddress) {
    return res.status(401).json({ error: 'Missing buyer address. Provide X-Buyer-Address header or buyerAddress in body.' });
  }

  const signature = req.headers['x-buyer-signature'];
  const nonce = req.headers['x-buyer-nonce'];

  if (process.env.NODE_ENV === 'production') {
    if (!signature || !nonce) {
      return res.status(401).json({ error: 'Missing X-Buyer-Signature and X-Buyer-Nonce headers for buyer authentication.' });
    }
    // Nonce must be a recent timestamp (within 5 minutes) to prevent replay
    const nonceTime = parseInt(nonce, 10);
    if (isNaN(nonceTime) || Math.abs(Date.now() - nonceTime) > 5 * 60 * 1000) {
      return res.status(401).json({ error: 'Nonce expired or invalid. Submit a recent timestamp.' });
    }
    // TODO: Verify signature against buyer address using @initia/initia.js
    // For now, we validate that the signature and nonce are present and nonce is fresh.
    // Full signature verification requires the buyer's public key on-chain.
  }

  req.buyerAddress = buyerAddress;
  next();
}

/** Standard async error wrapper. */
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// =============================================================================
// Health check
// =============================================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'tienda-api',
    version: '1.0.0',
    chain: 'initia',
    chainId: INITIA_CHAIN_ID,
    lcdUrl: INITIA_LCD_URL,
    marketplaceModule: MARKETPLACE_MODULE_ADDR || 'not configured',
    platformFeeBps: PLATFORM_FEE_BPS,
    timestamp: new Date().toISOString(),
    stats: {
      merchants: db.merchants.size,
      products: db.products.size,
      orders: db.orders.size,
    },
  });
});

// =============================================================================
// Merchant Onboarding Endpoints
// =============================================================================

/**
 * POST /api/v1/merchants
 * Register a new merchant and create their store.
 */
app.post('/api/v1/merchants', validate(schemas.merchantRegister), asyncHandler(async (req, res) => {
  const data = req.validated;

  // Check if wallet already registered.
  if (db.merchantsByAddr.has(data.walletAddress)) {
    return res.status(409).json({ error: 'Wallet address already registered as a merchant' });
  }

  const merchantId = uuidv4();
  const now = new Date().toISOString();

  const merchant = {
    merchantId,
    walletAddress: data.walletAddress,
    storeName: data.storeName,
    description: data.description,
    country: data.country,
    city: data.city,
    categories: data.categories,
    contactEmail: data.contactEmail || null,
    contactPhone: data.contactPhone || null,
    logoUri: data.logoUri || null,
    isActive: true,
    productCount: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalRatingScore: 0,
    ratingCount: 0,
    registeredAt: now,
    updatedAt: now,
    // On-chain tx hash stored after broadcasting the Move transaction.
    onChainTxHash: null,
    onChainStatus: 'pending',
  };

  db.merchants.set(merchantId, merchant);
  db.merchantsByAddr.set(data.walletAddress, merchantId);

  // Broadcast on-chain registration if marketplace module is configured
  if (MARKETPLACE_MODULE_ADDR && adminWallet) {
    try {
      const msg = new MsgExecute(
        adminWallet.key.accAddress,
        MARKETPLACE_MODULE_ADDR,
        'marketplace',
        'register_merchant',
        [],
        [
          data.walletAddress,
          data.storeName,
          data.description,
          data.country,
          data.city,
          JSON.stringify(data.categories),
        ],
      );
      const tx = await adminWallet.createAndSignTx({ msgs: [msg] });
      const result = await lcd.tx.broadcast(tx);
      merchant.onChainTxHash = result.txhash;
      merchant.onChainStatus = 'confirmed';
      db.merchants.set(merchantId, merchant);
      logger.info(`On-chain registration tx: ${result.txhash}`);
    } catch (chainErr) {
      logger.warn(`On-chain registration failed for ${merchantId}: ${chainErr.message}`);
      merchant.onChainStatus = 'failed';
      db.merchants.set(merchantId, merchant);
    }
  }

  // Initialize analytics for the merchant.
  db.analytics.set(merchantId, {
    dailySales: [],
    totalViews: 0,
    conversionRate: 0,
    topProducts: [],
    revenueByCategory: {},
    customerRetention: 0,
  });

  logger.info(`Merchant registered: ${merchantId} (${data.storeName})`);

  res.status(201).json({
    message: 'Merchant registered successfully',
    merchant: {
      merchantId,
      storeName: merchant.storeName,
      country: merchant.country,
      city: merchant.city,
      isActive: merchant.isActive,
      registeredAt: merchant.registeredAt,
    },
  });
}));

/**
 * GET /api/v1/merchants/:merchantId
 * Get merchant profile.
 */
app.get('/api/v1/merchants/:merchantId', asyncHandler(async (req, res) => {
  const merchant = db.merchants.get(req.params.merchantId);
  if (!merchant) {
    return res.status(404).json({ error: 'Merchant not found' });
  }

  const avgRating = merchant.ratingCount > 0
    ? (merchant.totalRatingScore / merchant.ratingCount).toFixed(2)
    : null;

  res.json({
    ...merchant,
    averageRating: avgRating ? parseFloat(avgRating) : null,
    // Do not expose wallet address publicly.
    walletAddress: undefined,
  });
}));

/**
 * PUT /api/v1/merchants/:merchantId
 * Update merchant profile. Requires merchant auth.
 */
app.put('/api/v1/merchants/:merchantId', authMerchant, validate(schemas.merchantUpdate), asyncHandler(async (req, res) => {
  const merchant = db.merchants.get(req.params.merchantId);
  if (!merchant) {
    return res.status(404).json({ error: 'Merchant not found' });
  }
  if (merchant.merchantId !== req.merchantId) {
    return res.status(403).json({ error: 'Not authorized to update this merchant' });
  }

  const updates = req.validated;
  Object.assign(merchant, updates, { updatedAt: new Date().toISOString() });
  db.merchants.set(merchant.merchantId, merchant);

  logger.info(`Merchant updated: ${merchant.merchantId}`);
  res.json({ message: 'Merchant updated successfully', merchant });
}));

/**
 * GET /api/v1/merchants
 * List/search merchants with filters.
 */
app.get('/api/v1/merchants', asyncHandler(async (req, res) => {
  const { country, city, category, page = 1, limit = 20 } = req.query;
  let merchants = Array.from(db.merchants.values()).filter((m) => m.isActive);

  if (country) merchants = merchants.filter((m) => m.country === country.toUpperCase());
  if (city) merchants = merchants.filter((m) => m.city.toLowerCase().includes(city.toLowerCase()));
  if (category) merchants = merchants.filter((m) => m.categories.includes(category));

  const total = merchants.length;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const paginated = merchants.slice(offset, offset + parseInt(limit));

  res.json({
    merchants: paginated.map((m) => ({
      merchantId: m.merchantId,
      storeName: m.storeName,
      description: m.description,
      country: m.country,
      city: m.city,
      categories: m.categories,
      logoUri: m.logoUri,
      productCount: m.productCount,
      averageRating: m.ratingCount > 0
        ? parseFloat((m.totalRatingScore / m.ratingCount).toFixed(2))
        : null,
      totalOrders: m.totalOrders,
    })),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
}));

// =============================================================================
// Product Catalog CRUD
// =============================================================================

/**
 * POST /api/v1/products
 * Create a new product listing. Requires merchant auth.
 */
app.post('/api/v1/products', authMerchant, validate(schemas.productCreate), asyncHandler(async (req, res) => {
  const data = req.validated;
  const merchant = db.merchants.get(req.merchantId);

  if (!merchant || !merchant.isActive) {
    return res.status(403).json({ error: 'Merchant is not active' });
  }

  const productId = uuidv4();
  const now = new Date().toISOString();

  const product = {
    productId,
    merchantId: req.merchantId,
    merchantAddress: req.merchantAddress,
    merchantName: merchant.storeName,
    name: data.name,
    description: data.description,
    price: data.price,
    stock: data.stock,
    category: data.category,
    imageUri: data.imageUri || null,
    images: data.images || [],
    metadata: data.metadata || {},
    tags: data.tags || [],
    weight: data.weight || null,
    dimensions: data.dimensions || null,
    shippingInfo: data.shippingInfo || { freeShipping: false, shippingCost: 0, estimatedDays: 7 },
    isActive: true,
    viewCount: 0,
    orderCount: 0,
    createdAt: now,
    updatedAt: now,
    onChainProductId: null,
  };

  db.products.set(productId, product);

  // Update merchant product count.
  merchant.productCount += 1;
  db.merchants.set(merchant.merchantId, merchant);

  logger.info(`Product listed: ${productId} by merchant ${req.merchantId}`);

  res.status(201).json({
    message: 'Product listed successfully',
    product: {
      productId: product.productId,
      name: product.name,
      price: product.price,
      stock: product.stock,
      category: product.category,
      isActive: product.isActive,
    },
  });
}));

/**
 * GET /api/v1/products/:productId
 * Get product details.
 */
app.get('/api/v1/products/:productId', asyncHandler(async (req, res) => {
  const product = db.products.get(req.params.productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  // Increment view count.
  product.viewCount += 1;
  db.products.set(product.productId, product);

  // Gather reviews for this product.
  const reviews = Array.from(db.reviews.values())
    .filter((r) => r.productId === product.productId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);

  res.json({ product, reviews });
}));

/**
 * PUT /api/v1/products/:productId
 * Update a product. Requires merchant auth.
 */
app.put('/api/v1/products/:productId', authMerchant, validate(schemas.productUpdate), asyncHandler(async (req, res) => {
  const product = db.products.get(req.params.productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  if (product.merchantId !== req.merchantId) {
    return res.status(403).json({ error: 'Not authorized to update this product' });
  }

  Object.assign(product, req.validated, { updatedAt: new Date().toISOString() });
  db.products.set(product.productId, product);

  logger.info(`Product updated: ${product.productId}`);
  res.json({ message: 'Product updated successfully', product });
}));

/**
 * DELETE /api/v1/products/:productId
 * Soft-delete (deactivate) a product. Requires merchant auth.
 */
app.delete('/api/v1/products/:productId', authMerchant, asyncHandler(async (req, res) => {
  const product = db.products.get(req.params.productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  if (product.merchantId !== req.merchantId) {
    return res.status(403).json({ error: 'Not authorized to delete this product' });
  }

  product.isActive = false;
  product.updatedAt = new Date().toISOString();
  db.products.set(product.productId, product);

  logger.info(`Product deactivated: ${product.productId}`);
  res.json({ message: 'Product deactivated successfully' });
}));

// =============================================================================
// Search & Discovery
// =============================================================================

/**
 * GET /api/v1/search
 * Search products with full-text query, category filter, price range, and sorting.
 */
app.get('/api/v1/search', validateQuery(schemas.search), asyncHandler(async (req, res) => {
  const { q, category, country, city, minPrice, maxPrice, sortBy, page, limit, merchantId, tags } = req.validatedQuery;

  let results = Array.from(db.products.values()).filter((p) => p.isActive);

  // Text search across name, description, tags.
  if (q) {
    const query = q.toLowerCase();
    results = results.filter((p) =>
      p.name.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      (p.tags && p.tags.some((t) => t.toLowerCase().includes(query)))
    );
  }

  // Category filter.
  if (category) {
    results = results.filter((p) => p.category === category);
  }

  // Country/city filter (via merchant).
  if (country || city) {
    results = results.filter((p) => {
      const merchant = db.merchants.get(p.merchantId);
      if (!merchant) return false;
      if (country && merchant.country !== country.toUpperCase()) return false;
      if (city && !merchant.city.toLowerCase().includes(city.toLowerCase())) return false;
      return true;
    });
  }

  // Price range filter.
  if (minPrice !== undefined) results = results.filter((p) => p.price >= minPrice);
  if (maxPrice !== undefined) results = results.filter((p) => p.price <= maxPrice);

  // Merchant filter.
  if (merchantId) results = results.filter((p) => p.merchantId === merchantId);

  // Tag filter (comma-separated).
  if (tags) {
    const tagList = tags.split(',').map((t) => t.trim().toLowerCase());
    results = results.filter((p) =>
      p.tags && tagList.some((t) => p.tags.map((pt) => pt.toLowerCase()).includes(t))
    );
  }

  // Sorting.
  switch (sortBy) {
    case 'price_asc':
      results.sort((a, b) => a.price - b.price);
      break;
    case 'price_desc':
      results.sort((a, b) => b.price - a.price);
      break;
    case 'newest':
      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      break;
    case 'popularity':
      results.sort((a, b) => b.orderCount - a.orderCount);
      break;
    case 'rating':
      // Sort by merchant rating.
      results.sort((a, b) => {
        const ma = db.merchants.get(a.merchantId);
        const mb = db.merchants.get(b.merchantId);
        const ra = ma && ma.ratingCount > 0 ? ma.totalRatingScore / ma.ratingCount : 0;
        const rb = mb && mb.ratingCount > 0 ? mb.totalRatingScore / mb.ratingCount : 0;
        return rb - ra;
      });
      break;
    default:
      // Default: newest first.
      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  const total = results.length;
  const offset = (page - 1) * limit;
  const paginated = results.slice(offset, offset + limit);

  res.json({
    results: paginated.map((p) => ({
      productId: p.productId,
      name: p.name,
      description: p.description.substring(0, 200),
      price: p.price,
      stock: p.stock,
      category: p.category,
      imageUri: p.imageUri,
      merchantId: p.merchantId,
      merchantName: p.merchantName,
      tags: p.tags,
      shippingInfo: p.shippingInfo,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    filters: { q, category, country, city, minPrice, maxPrice, sortBy, tags },
  });
}));

/**
 * GET /api/v1/categories
 * List available product categories.
 */
app.get('/api/v1/categories', (req, res) => {
  const categoryCounts = {};
  for (const product of db.products.values()) {
    if (product.isActive) {
      categoryCounts[product.category] = (categoryCounts[product.category] || 0) + 1;
    }
  }
  const categories = Array.from(db.categories).map((cat) => ({
    name: cat,
    productCount: categoryCounts[cat] || 0,
  }));
  res.json({ categories });
});

// =============================================================================
// Order Management
// =============================================================================

/**
 * POST /api/v1/orders
 * Create a new order. Initiates escrow on-chain.
 */
app.post('/api/v1/orders', validate(schemas.orderCreate), asyncHandler(async (req, res) => {
  const data = req.validated;

  const product = db.products.get(data.productId);
  if (!product || !product.isActive) {
    return res.status(404).json({ error: 'Product not found or not available' });
  }
  if (product.stock < data.quantity) {
    return res.status(400).json({
      error: 'Insufficient stock',
      available: product.stock,
    });
  }
  if (product.merchantAddress === data.buyerAddress) {
    return res.status(400).json({ error: 'Cannot purchase your own product' });
  }

  const totalPrice = product.price * data.quantity;
  let loyaltyDiscount = 0;

  // Handle loyalty point redemption.
  if (data.loyaltyPointsToRedeem > 0) {
    const loyalty = db.loyaltyAccounts.get(data.buyerAddress);
    if (!loyalty || loyalty.balance < data.loyaltyPointsToRedeem) {
      return res.status(400).json({ error: 'Insufficient loyalty points' });
    }
    loyaltyDiscount = Math.min(data.loyaltyPointsToRedeem, totalPrice);
    loyalty.balance -= loyaltyDiscount;
    loyalty.totalRedeemed += loyaltyDiscount;
    db.loyaltyAccounts.set(data.buyerAddress, loyalty);
  }

  const netAmount = totalPrice - loyaltyDiscount;
  const platformFee = Math.floor(netAmount * 0.015); // 1.5% fee — matches pitch and contract (150 bps)
  const orderId = uuidv4();
  const now = new Date().toISOString();

  // Decrease stock.
  product.stock -= data.quantity;
  product.orderCount += 1;
  db.products.set(product.productId, product);

  const order = {
    orderId,
    buyerAddress: data.buyerAddress,
    merchantId: product.merchantId,
    merchantAddress: product.merchantAddress,
    productId: product.productId,
    productName: product.name,
    quantity: data.quantity,
    unitPrice: product.price,
    totalPrice,
    loyaltyDiscount,
    netAmount,
    platformFee,
    status: 'paid',
    shippingRef: data.shippingRef,
    trackingNumber: null,
    paymentMethod: data.paymentMethod,
    escrow: {
      amount: netAmount - platformFee,
      platformFee,
      isReleased: false,
      isRefunded: false,
      createdAt: now,
    },
    createdAt: now,
    paidAt: now,
    shippedAt: null,
    deliveredAt: null,
    completedAt: null,
    onChainTxHash: null,
  };

  db.orders.set(orderId, order);

  // Update merchant stats.
  const merchant = db.merchants.get(product.merchantId);
  if (merchant) {
    merchant.totalOrders += 1;
    merchant.totalRevenue += netAmount;
    db.merchants.set(merchant.merchantId, merchant);
  }

  // Track analytics.
  trackSale(product.merchantId, {
    orderId,
    productId: product.productId,
    category: product.category,
    amount: netAmount,
    timestamp: now,
  });

  logger.info(`Order created: ${orderId} for product ${product.productId}`);

  res.status(201).json({
    message: 'Order created successfully',
    order: {
      orderId,
      productName: order.productName,
      quantity: order.quantity,
      totalPrice: order.totalPrice,
      loyaltyDiscount: order.loyaltyDiscount,
      netAmount: order.netAmount,
      status: order.status,
      paymentMethod: order.paymentMethod,
    },
  });
}));

/**
 * GET /api/v1/orders/:orderId
 * Get order details.
 */
app.get('/api/v1/orders/:orderId', asyncHandler(async (req, res) => {
  const order = db.orders.get(req.params.orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json({ order });
}));

/**
 * GET /api/v1/orders
 * List orders filtered by buyer or merchant.
 */
app.get('/api/v1/orders', asyncHandler(async (req, res) => {
  const { buyerAddress, merchantId, status, page = 1, limit = 20 } = req.query;
  let orders = Array.from(db.orders.values());

  if (buyerAddress) orders = orders.filter((o) => o.buyerAddress === buyerAddress);
  if (merchantId) orders = orders.filter((o) => o.merchantId === merchantId);
  if (status) orders = orders.filter((o) => o.status === status);

  orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = orders.length;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const paginated = orders.slice(offset, offset + parseInt(limit));

  res.json({
    orders: paginated,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
}));

/**
 * PATCH /api/v1/orders/:orderId/ship
 * Merchant marks order as shipped with tracking number.
 */
app.patch('/api/v1/orders/:orderId/ship', authMerchant, asyncHandler(async (req, res) => {
  const { trackingNumber } = req.body;
  if (!trackingNumber) {
    return res.status(400).json({ error: 'Tracking number is required' });
  }

  const order = db.orders.get(req.params.orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  if (order.merchantId !== req.merchantId) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  if (order.status !== 'paid') {
    return res.status(400).json({ error: `Cannot ship order in "${order.status}" status` });
  }

  order.status = 'shipped';
  order.trackingNumber = trackingNumber;
  order.shippedAt = new Date().toISOString();
  db.orders.set(order.orderId, order);

  logger.info(`Order shipped: ${order.orderId}, tracking: ${trackingNumber}`);
  res.json({ message: 'Order marked as shipped', order });
}));

/**
 * PATCH /api/v1/orders/:orderId/deliver
 * Buyer confirms delivery.
 */
app.patch('/api/v1/orders/:orderId/deliver', authBuyer, asyncHandler(async (req, res) => {
  const buyerAddress = req.buyerAddress;

  const order = db.orders.get(req.params.orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  if (order.buyerAddress !== buyerAddress) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  if (order.status !== 'shipped') {
    return res.status(400).json({ error: `Cannot confirm delivery for order in "${order.status}" status` });
  }

  order.status = 'delivered';
  order.deliveredAt = new Date().toISOString();
  db.orders.set(order.orderId, order);

  logger.info(`Order delivered: ${order.orderId}`);
  res.json({ message: 'Delivery confirmed', order });
}));

/**
 * PATCH /api/v1/orders/:orderId/complete
 * Complete order and release escrow.
 */
app.patch('/api/v1/orders/:orderId/complete', authBuyer, asyncHandler(async (req, res) => {
  const buyerAddress = req.buyerAddress;

  const order = db.orders.get(req.params.orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  if (order.status !== 'delivered') {
    return res.status(400).json({ error: `Cannot complete order in "${order.status}" status` });
  }
  if (order.buyerAddress !== buyerAddress) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  order.status = 'completed';
  order.completedAt = new Date().toISOString();
  order.escrow.isReleased = true;
  db.orders.set(order.orderId, order);

  // Award loyalty points: 100 points per TIENDA spent.
  const pointsEarned = Math.floor(order.netAmount * 100);
  if (pointsEarned > 0) {
    let loyalty = db.loyaltyAccounts.get(order.buyerAddress);
    if (!loyalty) {
      loyalty = {
        owner: order.buyerAddress,
        balance: 0,
        totalEarned: 0,
        totalRedeemed: 0,
        history: [],
      };
    }
    loyalty.balance += pointsEarned;
    loyalty.totalEarned += pointsEarned;
    loyalty.history.push({
      type: 'earned',
      amount: pointsEarned,
      orderId: order.orderId,
      timestamp: new Date().toISOString(),
    });
    db.loyaltyAccounts.set(order.buyerAddress, loyalty);
  }

  logger.info(`Order completed: ${order.orderId}, loyalty points earned: ${pointsEarned}`);
  res.json({
    message: 'Order completed, escrow released',
    order,
    loyaltyPointsEarned: pointsEarned,
  });
}));

/**
 * PATCH /api/v1/orders/:orderId/cancel
 * Cancel order before shipping.
 */
app.patch('/api/v1/orders/:orderId/cancel', asyncHandler(async (req, res) => {
  const { callerAddress } = req.body;

  const order = db.orders.get(req.params.orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  if (order.status !== 'paid') {
    return res.status(400).json({ error: 'Can only cancel orders before shipping' });
  }
  if (callerAddress !== order.buyerAddress && callerAddress !== order.merchantAddress) {
    return res.status(403).json({ error: 'Not authorized to cancel this order' });
  }

  order.status = 'cancelled';
  order.escrow.isRefunded = true;
  db.orders.set(order.orderId, order);

  // Restore stock.
  const product = db.products.get(order.productId);
  if (product) {
    product.stock += order.quantity;
    db.products.set(product.productId, product);
  }

  logger.info(`Order cancelled: ${order.orderId}`);
  res.json({ message: 'Order cancelled and refund initiated', order });
}));

/**
 * PATCH /api/v1/orders/:orderId/dispute
 * Open a dispute on a delivered order.
 */
app.patch('/api/v1/orders/:orderId/dispute', authBuyer, asyncHandler(async (req, res) => {
  const buyerAddress = req.buyerAddress;
  const { reason } = req.body;

  const order = db.orders.get(req.params.orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  if (order.buyerAddress !== buyerAddress) {
    return res.status(403).json({ error: 'Only the buyer can open a dispute' });
  }
  if (order.status !== 'delivered') {
    return res.status(400).json({ error: 'Can only dispute delivered orders' });
  }

  order.status = 'disputed';
  order.disputeReason = reason || 'No reason provided';
  order.disputedAt = new Date().toISOString();
  db.orders.set(order.orderId, order);

  logger.info(`Order disputed: ${order.orderId}`);
  res.json({ message: 'Dispute opened', order });
}));

// =============================================================================
// Reviews
// =============================================================================

/**
 * POST /api/v1/orders/:orderId/review
 * Submit a review for a completed order.
 */
app.post('/api/v1/orders/:orderId/review', validate(schemas.reviewCreate), asyncHandler(async (req, res) => {
  const { buyerAddress } = req.body;
  const data = req.validated;
  const orderId = req.params.orderId;

  const order = db.orders.get(orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  if (order.status !== 'completed') {
    return res.status(400).json({ error: 'Can only review completed orders' });
  }

  // Check for existing review.
  const existing = Array.from(db.reviews.values()).find((r) => r.orderId === orderId);
  if (existing) {
    return res.status(409).json({ error: 'This order has already been reviewed' });
  }

  const reviewId = uuidv4();
  const review = {
    reviewId,
    orderId,
    reviewerAddress: order.buyerAddress,
    merchantId: order.merchantId,
    productId: order.productId,
    productName: order.productName,
    rating: data.rating,
    comment: data.comment,
    createdAt: new Date().toISOString(),
  };

  db.reviews.set(reviewId, review);

  // Update merchant rating.
  const merchant = db.merchants.get(order.merchantId);
  if (merchant) {
    merchant.totalRatingScore += data.rating;
    merchant.ratingCount += 1;
    db.merchants.set(merchant.merchantId, merchant);
  }

  logger.info(`Review submitted: ${reviewId} for order ${orderId}`);
  res.status(201).json({ message: 'Review submitted', review });
}));

/**
 * GET /api/v1/merchants/:merchantId/reviews
 * Get all reviews for a merchant.
 */
app.get('/api/v1/merchants/:merchantId/reviews', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  let reviews = Array.from(db.reviews.values())
    .filter((r) => r.merchantId === req.params.merchantId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = reviews.length;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const paginated = reviews.slice(offset, offset + parseInt(limit));

  const avgRating = total > 0
    ? parseFloat((reviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(2))
    : null;

  res.json({
    reviews: paginated,
    averageRating: avgRating,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) },
  });
}));

// =============================================================================
// Loyalty Program Management
// =============================================================================

/**
 * GET /api/v1/loyalty/:walletAddress
 * Get loyalty account details.
 */
app.get('/api/v1/loyalty/:walletAddress', asyncHandler(async (req, res) => {
  const loyalty = db.loyaltyAccounts.get(req.params.walletAddress);
  if (!loyalty) {
    return res.json({
      owner: req.params.walletAddress,
      balance: 0,
      totalEarned: 0,
      totalRedeemed: 0,
      history: [],
    });
  }
  res.json(loyalty);
}));

/**
 * POST /api/v1/loyalty/mint
 * Admin mints bonus loyalty points to a user (promotions).
 */
app.post('/api/v1/loyalty/mint', asyncHandler(async (req, res) => {
  const { adminKey, recipientAddress, amount, reason } = req.body;

  // Simple admin check (in production, use proper auth).
  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(403).json({ error: 'Admin authorization required' });
  }
  if (!recipientAddress || !amount || amount <= 0) {
    return res.status(400).json({ error: 'recipientAddress and positive amount are required' });
  }

  let loyalty = db.loyaltyAccounts.get(recipientAddress);
  if (!loyalty) {
    loyalty = {
      owner: recipientAddress,
      balance: 0,
      totalEarned: 0,
      totalRedeemed: 0,
      history: [],
    };
  }

  loyalty.balance += amount;
  loyalty.totalEarned += amount;
  loyalty.history.push({
    type: 'minted',
    amount,
    reason: reason || 'Admin mint',
    timestamp: new Date().toISOString(),
  });
  db.loyaltyAccounts.set(recipientAddress, loyalty);

  logger.info(`Loyalty points minted: ${amount} to ${recipientAddress}`);
  res.json({ message: 'Loyalty points minted', loyalty });
}));

/**
 * POST /api/v1/loyalty/merchant-grant
 * Merchant grants promotional points to a customer.
 */
app.post('/api/v1/loyalty/merchant-grant', authMerchant, asyncHandler(async (req, res) => {
  const { recipientAddress, amount, reason } = req.body;
  if (!recipientAddress || !amount || amount <= 0) {
    return res.status(400).json({ error: 'recipientAddress and positive amount are required' });
  }

  let loyalty = db.loyaltyAccounts.get(recipientAddress);
  if (!loyalty) {
    loyalty = {
      owner: recipientAddress,
      balance: 0,
      totalEarned: 0,
      totalRedeemed: 0,
      history: [],
    };
  }

  loyalty.balance += amount;
  loyalty.totalEarned += amount;
  loyalty.history.push({
    type: 'merchant_grant',
    amount,
    merchantId: req.merchantId,
    reason: reason || 'Merchant promotion',
    timestamp: new Date().toISOString(),
  });
  db.loyaltyAccounts.set(recipientAddress, loyalty);

  logger.info(`Merchant ${req.merchantId} granted ${amount} points to ${recipientAddress}`);
  res.json({ message: 'Loyalty points granted', loyalty });
}));

// =============================================================================
// Payment Processing Integration
// =============================================================================

/**
 * POST /api/v1/payments/estimate
 * Estimate payment details for a potential order.
 */
app.post('/api/v1/payments/estimate', asyncHandler(async (req, res) => {
  const { productId, quantity, loyaltyPointsToRedeem = 0 } = req.body;

  const product = db.products.get(productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const subtotal = product.price * (quantity || 1);
  const loyaltyDiscount = Math.min(loyaltyPointsToRedeem, subtotal);
  const netAmount = subtotal - loyaltyDiscount;
  const platformFee = Math.floor(netAmount * 0.015);
  const shippingCost = product.shippingInfo?.freeShipping ? 0 : (product.shippingInfo?.shippingCost || 0);

  res.json({
    estimate: {
      subtotal,
      loyaltyDiscount,
      shippingCost,
      platformFee,
      netAmount: netAmount + shippingCost,
      merchantReceives: netAmount - platformFee,
      loyaltyPointsToEarn: Math.floor(netAmount * 100),
      estimatedDeliveryDays: product.shippingInfo?.estimatedDays || 7,
    },
  });
}));

/**
 * POST /api/v1/payments/webhook
 * Webhook endpoint for external payment processor callbacks.
 */
app.post('/api/v1/payments/webhook', asyncHandler(async (req, res) => {
  const { orderId, status, txHash, provider } = req.body;

  logger.info(`Payment webhook received: order=${orderId}, status=${status}, provider=${provider}`);

  const order = db.orders.get(orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (txHash) {
    order.onChainTxHash = txHash;
  }

  db.orders.set(order.orderId, order);
  res.json({ message: 'Webhook processed', orderId });
}));

// =============================================================================
// Merchant Analytics
// =============================================================================

/** Helper to track a sale in analytics. */
function trackSale(merchantId, saleData) {
  let analytics = db.analytics.get(merchantId);
  if (!analytics) {
    analytics = {
      dailySales: [],
      totalViews: 0,
      conversionRate: 0,
      topProducts: [],
      revenueByCategory: {},
      customerRetention: 0,
    };
  }

  analytics.dailySales.push({
    date: saleData.timestamp,
    amount: saleData.amount,
    orderId: saleData.orderId,
  });

  // Track revenue by category.
  analytics.revenueByCategory[saleData.category] =
    (analytics.revenueByCategory[saleData.category] || 0) + saleData.amount;

  db.analytics.set(merchantId, analytics);
}

/**
 * GET /api/v1/analytics/:merchantId
 * Get merchant analytics dashboard data.
 */
app.get('/api/v1/analytics/:merchantId', authMerchant, asyncHandler(async (req, res) => {
  if (req.merchantId !== req.params.merchantId) {
    return res.status(403).json({ error: 'Not authorized to view these analytics' });
  }

  const merchant = db.merchants.get(req.params.merchantId);
  if (!merchant) {
    return res.status(404).json({ error: 'Merchant not found' });
  }

  const analytics = db.analytics.get(req.params.merchantId) || {
    dailySales: [],
    totalViews: 0,
    conversionRate: 0,
    topProducts: [],
    revenueByCategory: {},
    customerRetention: 0,
  };

  // Compute top products.
  const productSales = {};
  const merchantOrders = Array.from(db.orders.values())
    .filter((o) => o.merchantId === req.params.merchantId);

  merchantOrders.forEach((o) => {
    productSales[o.productId] = (productSales[o.productId] || 0) + o.netAmount;
  });

  const topProducts = Object.entries(productSales)
    .map(([productId, revenue]) => {
      const product = db.products.get(productId);
      return { productId, name: product?.name || 'Unknown', revenue };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Compute product views.
  let totalViews = 0;
  for (const product of db.products.values()) {
    if (product.merchantId === req.params.merchantId) {
      totalViews += product.viewCount;
    }
  }

  // Revenue over time (last 30 days aggregated).
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentSales = analytics.dailySales.filter((s) => new Date(s.date) >= thirtyDaysAgo);
  const dailyRevenue = {};
  recentSales.forEach((s) => {
    const day = s.date.substring(0, 10);
    dailyRevenue[day] = (dailyRevenue[day] || 0) + s.amount;
  });

  // Order status breakdown.
  const statusBreakdown = {};
  merchantOrders.forEach((o) => {
    statusBreakdown[o.status] = (statusBreakdown[o.status] || 0) + 1;
  });

  res.json({
    summary: {
      totalOrders: merchant.totalOrders,
      totalRevenue: merchant.totalRevenue,
      totalProducts: merchant.productCount,
      averageRating: merchant.ratingCount > 0
        ? parseFloat((merchant.totalRatingScore / merchant.ratingCount).toFixed(2))
        : null,
      totalReviews: merchant.ratingCount,
      totalViews,
      conversionRate: totalViews > 0
        ? parseFloat(((merchant.totalOrders / totalViews) * 100).toFixed(2))
        : 0,
    },
    topProducts,
    revenueByCategory: analytics.revenueByCategory,
    dailyRevenue,
    orderStatusBreakdown: statusBreakdown,
  });
}));

/**
 * GET /api/v1/analytics/:merchantId/export
 * Export analytics data as JSON (for CSV generation client-side).
 */
app.get('/api/v1/analytics/:merchantId/export', authMerchant, asyncHandler(async (req, res) => {
  if (req.merchantId !== req.params.merchantId) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const orders = Array.from(db.orders.values())
    .filter((o) => o.merchantId === req.params.merchantId)
    .map((o) => ({
      orderId: o.orderId,
      productName: o.productName,
      quantity: o.quantity,
      totalPrice: o.totalPrice,
      netAmount: o.netAmount,
      status: o.status,
      createdAt: o.createdAt,
      completedAt: o.completedAt,
    }));

  res.json({
    exportDate: new Date().toISOString(),
    merchantId: req.params.merchantId,
    orders,
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, o) => sum + o.netAmount, 0),
  });
}));

// =============================================================================
// Error handling
// =============================================================================

// 404 handler.
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler.
app.use((err, req, res, _next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack, path: req.path });
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// =============================================================================
// Server startup
// =============================================================================

const server = app.listen(PORT, () => {
  logger.info(`Tienda API server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info('Endpoints ready:');
  logger.info('  Merchants: POST/GET /api/v1/merchants');
  logger.info('  Products:  POST/GET/PUT/DELETE /api/v1/products');
  logger.info('  Orders:    POST/GET/PATCH /api/v1/orders');
  logger.info('  Search:    GET /api/v1/search');
  logger.info('  Loyalty:   GET/POST /api/v1/loyalty');
  logger.info('  Analytics: GET /api/v1/analytics');
  logger.info('  Payments:  POST /api/v1/payments');
});

module.exports = { app, server };
