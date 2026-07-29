/**
 * YH STUDIO BACKEND
 * Order management + AI Concept Generation
 * v2.0 — Persistent storage via MongoDB + file fallback
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const cron = require('node-cron');
const mongoose = require('mongoose');

const Order = require('./models/Order');
const orchestrator = require('./agents/orchestrator');
const chatAgent = require('./agents/chatAgent');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'yhstudio2026';
const MONGODB_URI = process.env.MONGODB_URI;

// State
let useMongo = false;
let memoryOrders = []; // Fallback in-memory store

// ========================================
// DATABASE SETUP
// ========================================
async function connectDatabase() {
  if (!MONGODB_URI) {
    console.log('[DB] MONGODB_URI not set. Using file+memory fallback.');
    await ensureDataDir();
    memoryOrders = await loadOrdersFromFile();
    return;
  }
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    useMongo = true;
    console.log('[DB] Connected to MongoDB');
  } catch (err) {
    console.error('[DB] MongoDB connection failed:', err.message);
    console.log('[DB] Falling back to file+memory storage');
    await ensureDataDir();
    memoryOrders = await loadOrdersFromFile();
  }
}

// ========================================
// FILE FALLBACK HELPERS
// ========================================
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      await fs.access(ORDERS_FILE);
    } catch {
      await fs.writeFile(ORDERS_FILE, JSON.stringify([], null, 2));
    }
  } catch (err) {
    console.error('[File] Data dir error:', err.message);
  }
}

async function loadOrdersFromFile() {
  try {
    const data = await fs.readFile(ORDERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveOrdersToFile(orders) {
  try {
    await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2));
  } catch (err) {
    console.error('[File] Save error:', err.message);
  }
}

// ========================================
// UNIFIED ORDER API
// ========================================
async function getOrders() {
  if (useMongo) {
    return await Order.find().sort({ createdAt: -1 }).lean();
  }
  return [...memoryOrders];
}

async function getOrderById(id) {
  if (useMongo) {
    return await Order.findOne({ id }).lean();
  }
  return memoryOrders.find(o => o.id === id) || null;
}

async function createOrder(data) {
  const orderData = {
    id: uuidv4(),
    ...data,
    status: data.status || 'received',
    concepts: [],
    aiLogs: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (useMongo) {
    const order = new Order(orderData);
    await order.save();
  } else {
    memoryOrders.unshift(orderData);
    await saveOrdersToFile(memoryOrders);
  }
  return orderData;
}

async function updateOrder(id, updates) {
  if (useMongo) {
    await Order.updateOne({ id }, { $set: { ...updates, updatedAt: new Date().toISOString() } });
    return await getOrderById(id);
  }
  const idx = memoryOrders.findIndex(o => o.id === id);
  if (idx !== -1) {
    memoryOrders[idx] = { ...memoryOrders[idx], ...updates, updatedAt: new Date().toISOString() };
    await saveOrdersToFile(memoryOrders);
    return memoryOrders[idx];
  }
  return null;
}

async function deleteOrder(id) {
  if (useMongo) {
    await Order.deleteOne({ id });
    return;
  }
  memoryOrders = memoryOrders.filter(o => o.id !== id);
  await saveOrdersToFile(memoryOrders);
}

async function appendOrderLog(id, logEntry) {
  if (useMongo) {
    await Order.updateOne(
      { id },
      { $push: { aiLogs: { ...logEntry, timestamp: new Date().toISOString() } } }
    );
    return;
  }
  const idx = memoryOrders.findIndex(o => o.id === id);
  if (idx !== -1) {
    memoryOrders[idx].aiLogs = memoryOrders[idx].aiLogs || [];
    memoryOrders[idx].aiLogs.push({ ...logEntry, timestamp: new Date().toISOString() });
    await saveOrdersToFile(memoryOrders);
  }
}

async function setOrderConcepts(id, concepts, analysis) {
  if (useMongo) {
    await Order.updateOne(
      { id },
      { $set: { concepts, aiAnalysis: analysis, status: 'completed', updatedAt: new Date().toISOString() } }
    );
    return;
  }
  const idx = memoryOrders.findIndex(o => o.id === id);
  if (idx !== -1) {
    memoryOrders[idx].concepts = concepts;
    memoryOrders[idx].aiAnalysis = analysis;
    memoryOrders[idx].status = 'completed';
    memoryOrders[idx].updatedAt = new Date().toISOString();
    await saveOrdersToFile(memoryOrders);
  }
}

async function setOrderError(id, errorMsg) {
  if (useMongo) {
    await Order.updateOne(
      { id },
      { $set: { status: 'error', error: errorMsg, updatedAt: new Date().toISOString() } }
    );
    return;
  }
  const idx = memoryOrders.findIndex(o => o.id === id);
  if (idx !== -1) {
    memoryOrders[idx].status = 'error';
    memoryOrders[idx].error = errorMsg;
    memoryOrders[idx].updatedAt = new Date().toISOString();
    await saveOrdersToFile(memoryOrders);
  }
}

// ========================================
// MIDDLEWARE
// ========================================
app.use(cors({
  origin: function(origin, callback) {
    const allowed = [
      'https://xuan2507.github.io',
      'https://xuan2507.github.io/yh-website',
      'http://localhost:3000',
      'http://localhost:5500',
      'http://127.0.0.1:5500',
      'null'
    ];
    if (!origin || allowed.some(a => origin.startsWith(a))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health & ping
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: useMongo ? 'mongodb' : 'file+memory', time: new Date().toISOString() });
});
app.get('/api/ping', (req, res) => {
  res.json({ status: 'awake', db: useMongo ? 'mongodb' : 'file+memory', time: Date.now() });
});

app.use(express.static('public'));

// ========================================
// AUTH
// ========================================
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized — Bearer token required' });
  }
  const token = auth.replace('Bearer ', '').trim();
  if (token !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized — invalid token' });
  }
  next();
}

// ========================================
// PUBLIC API
// ========================================

// Submit order
app.post('/api/orders', async (req, res) => {
  try {
    const { name, email, package: pkg, message, source = 'website', paymentMethod, paymentRef, price, service } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    const order = await createOrder({
      name,
      email,
      package: pkg || 'not_specified',
      brief: message,
      source,
      paymentMethod: paymentMethod || '',
      paymentRef: paymentRef || '',
      price: price || '',
      service: service || inferService(pkg, message)
    });

    // Trigger AI generation in background (fire-and-forget)
    generateConceptsForOrder(order);

    res.status(201).json({
      success: true,
      orderId: order.id,
      message: 'Order received. AI agents are now generating concepts.'
    });
  } catch (err) {
    console.error('[API] Order error:', err);
    res.status(500).json({ error: 'Failed to process order', detail: err.message });
  }
});

// Infer service from package or message
function inferService(pkg, message) {
  const text = (pkg + ' ' + message).toLowerCase();
  if (text.includes('brand') || text.includes('identity') || text.includes('logo')) return 'brand_identity';
  if (text.includes('social') || text.includes('instagram') || text.includes('facebook')) return 'social_media';
  if (text.includes('print') || text.includes('marketing') || text.includes('flyer') || text.includes('brochure')) return 'print_marketing';
  if (text.includes('packaging') || text.includes('product') || text.includes('box') || text.includes('label')) return 'product_packaging';
  if (text.includes('web') || text.includes('website') || text.includes('ui') || text.includes('ux')) return 'website_graphics';
  if (text.includes('event') || text.includes('promotion') || text.includes('banner') || text.includes('poster')) return 'event_promotion';
  return 'general';
}

// Get order status (client-facing)
app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    res.json({
      id: order.id,
      status: order.status,
      createdAt: order.createdAt,
      concepts: order.concepts || [],
      conceptCount: (order.concepts || []).length
    });
  } catch (err) {
    console.error('[API] Get order error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Chat API
app.post('/api/chat', async (req, res) => {
  try {
    const { sessionId, message, persona = 'sales' } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    const result = await chatAgent.handleMessage(sessionId || uuidv4(), message, persona);
    res.json(result);
  } catch (err) {
    console.error('[API] Chat error:', err);
    res.status(500).json({ error: 'Chat processing failed' });
  }
});

// Payment stubs
app.post('/api/payments/create', async (req, res) => {
  res.json({ success: true, paymentId: uuidv4(), status: 'pending' });
});
app.post('/api/payments/confirm', async (req, res) => {
  res.json({ success: true, message: 'Payment confirmed' });
});

// ========================================
// ADMIN API
// ========================================
app.get('/api/admin/orders', requireAuth, async (req, res) => {
  try {
    const orders = await getOrders();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/admin/orders/:id', requireAuth, async (req, res) => {
  try {
    const order = await getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.patch('/api/admin/orders/:id', requireAuth, async (req, res) => {
  try {
    const order = await updateOrder(req.params.id, req.body);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

app.post('/api/admin/orders/:id/regenerate', requireAuth, async (req, res) => {
  try {
    const order = await getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    await updateOrder(req.params.id, { status: 'generating', concepts: [], aiLogs: [] });
    generateConceptsForOrder({ ...order, status: 'generating' });

    res.json({ success: true, message: 'Regeneration started' });
  } catch (err) {
    res.status(500).json({ error: 'Regeneration failed' });
  }
});

app.delete('/api/admin/orders/:id', requireAuth, async (req, res) => {
  try {
    await deleteOrder(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

app.get('/api/admin/stats', requireAuth, async (req, res) => {
  try {
    const orders = await getOrders();
    const today = new Date().toISOString().split('T')[0];
    res.json({
      total: orders.length,
      today: orders.filter(o => o.createdAt && o.createdAt.startsWith(today)).length,
      generating: orders.filter(o => o.status === 'generating').length,
      completed: orders.filter(o => o.status === 'completed').length,
      db: useMongo ? 'mongodb' : 'file+memory'
    });
  } catch (err) {
    res.status(500).json({ error: 'Stats error' });
  }
});

// ========================================
// AI GENERATION ENGINE
// ========================================
async function generateConceptsForOrder(order) {
  try {
    await updateOrder(order.id, { status: 'generating', updatedAt: new Date().toISOString() });
    console.log(`[AI] Starting generation for order ${order.id} [${order.service || 'general'}]`);

    const result = await orchestrator.generate(order.brief, {
      orderId: order.id,
      service: order.service || 'general',
      onLog: async (log) => {
        await appendOrderLog(order.id, log);
      }
    });

    await setOrderConcepts(order.id, result.concepts, result.analysis);
    console.log(`[AI] Completed ${result.concepts.length} concepts for order ${order.id}`);
  } catch (err) {
    console.error(`[AI] Generation failed for ${order.id}:`, err);
    await setOrderError(order.id, err.message);
  }
}

// ========================================
// KEEP-ALIVE (prevents Render free tier sleep)
// ========================================
if (process.env.KEEP_ALIVE !== 'false') {
  cron.schedule('*/8 * * * *', async () => {
    try {
      console.log(`[KeepAlive] ${new Date().toISOString()} — keeping instance warm`);
      // Self-ping to prevent Render free tier sleep
      const http = require('http');
      const opts = { hostname: 'localhost', port: PORT, path: '/api/ping', method: 'GET', timeout: 5000 };
      const req = http.request(opts, (res) => {
        console.log(`[KeepAlive] Self-ping status: ${res.statusCode}`);
      });
      req.on('error', (err) => console.error('[KeepAlive] Self-ping failed:', err.message));
      req.end();
    } catch (err) {
      console.error('[KeepAlive] Error:', err.message);
    }
  });
}

// ========================================
// STARTUP
// ========================================
(async () => {
  await connectDatabase();
  app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════╗
║  YH STUDIO BACKEND v2.0                  ║
║  Port: ${PORT.toString().padEnd(35)} ║
║  DB:   ${(useMongo ? 'MongoDB' : 'File+Memory').padEnd(35)} ║
║  Admin: http://localhost:${PORT}/admin     ${' '.repeat(PORT.toString().length === 4 ? 1 : 0)}║
╚══════════════════════════════════════════╝
    `);
  });
})();
