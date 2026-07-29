/**
 * YH STUDIO BACKEND
 * Order management + AI Concept Generation
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const cron = require('node-cron');

const orchestrator = require('./agents/orchestrator');
const chatAgent = require('./agents/chatAgent');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

// Middleware
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
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/api/ping', (req, res) => {
  res.json({ status: 'awake', time: Date.now() });
});

app.use(express.static('public'));

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      await fs.access(ORDERS_FILE);
    } catch {
      await fs.writeFile(ORDERS_FILE, JSON.stringify([], null, 2));
    }
  } catch (err) {
    console.error('Data dir error:', err);
  }
}

// Load orders
async function loadOrders() {
  try {
    const data = await fs.readFile(ORDERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Save orders
async function saveOrders(orders) {
  await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

// ========================================
// PUBLIC API
// ========================================

// Submit order
app.post('/api/orders', async (req, res) => {
  try {
    const { name, email, package: pkg, message, source = 'website' } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    const order = {
      id: uuidv4(),
      name,
      email,
      package: pkg || 'not_specified',
      brief: message,
      source,
      status: 'received',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      concepts: [],
      aiLogs: []
    };

    const orders = await loadOrders();
    orders.unshift(order);
    await saveOrders(orders);

    // Trigger AI generation in background
    generateConceptsForOrder(order);

    res.status(201).json({ 
      success: true, 
      orderId: order.id,
      message: 'Order received. AI agents are now generating concepts.' 
    });
  } catch (err) {
    console.error('Order error:', err);
    res.status(500).json({ error: 'Failed to process order' });
  }
});

// Get order status (client-facing)
app.get('/api/orders/:id', async (req, res) => {
  try {
    const orders = await loadOrders();
    const order = orders.find(o => o.id === req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    // Return sanitized version (no internal logs)
    res.json({
      id: order.id,
      status: order.status,
      createdAt: order.createdAt,
      concepts: order.concepts,
      conceptCount: order.concepts.length
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ========================================
// ADMIN API (Protected)
// ========================================

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || auth !== `Bearer ${process.env.ADMIN_PASSWORD || 'yhstudio2026'}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Get all orders (admin)
app.get('/api/admin/orders', requireAuth, async (req, res) => {
  try {
    const orders = await loadOrders();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single order details (admin)
app.get('/api/admin/orders/:id', requireAuth, async (req, res) => {
  try {
    const orders = await loadOrders();
    const order = orders.find(o => o.id === req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update order status (admin)
app.patch('/api/admin/orders/:id', requireAuth, async (req, res) => {
  try {
    const orders = await loadOrders();
    const idx = orders.findIndex(o => o.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Order not found' });
    
    const allowed = ['status', 'notes', 'concepts', 'aiLogs'];
    allowed.forEach(key => {
      if (req.body[key] !== undefined) orders[idx][key] = req.body[key];
    });
    orders[idx].updatedAt = new Date().toISOString();
    
    await saveOrders(orders);
    res.json(orders[idx]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Regenerate concepts for an order
app.post('/api/admin/orders/:id/regenerate', requireAuth, async (req, res) => {
  try {
    const orders = await loadOrders();
    const order = orders.find(o => o.id === req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    order.status = 'regenerating';
    order.updatedAt = new Date().toISOString();
    await saveOrders(orders);
    
    generateConceptsForOrder(order);
    res.json({ success: true, message: 'Regeneration started' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete order
app.delete('/api/admin/orders/:id', requireAuth, async (req, res) => {
  try {
    let orders = await loadOrders();
    orders = orders.filter(o => o.id !== req.params.id);
    await saveOrders(orders);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Dashboard stats
app.get('/api/admin/stats', requireAuth, async (req, res) => {
  try {
    const orders = await loadOrders();
    const stats = {
      total: orders.length,
      received: orders.filter(o => o.status === 'received').length,
      generating: orders.filter(o => o.status === 'generating').length,
      completed: orders.filter(o => o.status === 'completed').length,
      pending: orders.filter(o => o.status === 'pending_review').length,
      today: orders.filter(o => {
        const d = new Date(o.createdAt);
        const now = new Date();
        return d.toDateString() === now.toDateString();
      }).length
    };
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ========================================
// CHAT API (AI Assistant)
// ========================================

app.post('/api/chat', async (req, res) => {
  try {
    const { sessionId, message, persona } = req.body;
    if (!sessionId || !message) {
      return res.status(400).json({ error: 'sessionId and message required' });
    }
    const response = await chatAgent.chat(sessionId, message, persona || 'sales');
    res.json({ success: true, ...response });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Chat failed' });
  }
});

app.get('/api/chat/sessions', requireAuth, async (req, res) => {
  try {
    const sessions = Array.from(chatAgent.sessions.entries()).map(([id, s]) => ({
      id,
      messageCount: s.history.length,
      context: s.context,
      lastActive: s.history[s.history.length - 1]?.time
    }));
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ========================================
// PAYMENT API
// ========================================

app.post('/api/payments/create', async (req, res) => {
  try {
    const { item, amount, currency = 'MYR', method } = req.body;
    if (!item || !amount) {
      return res.status(400).json({ error: 'item and amount required' });
    }

    const order = {
      id: uuidv4(),
      item,
      amount,
      currency,
      method: method || 'pending',
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // Store payment order
    const orders = await loadOrders();
    orders.push({ ...order, type: 'payment' });
    await saveOrders(orders);

    res.json({
      success: true,
      orderId: order.id,
      checkoutUrl: `/checkout/${order.id}`,
      message: 'Payment initiated. Complete checkout to finalize.'
    });
  } catch (err) {
    console.error('Payment error:', err);
    res.status(500).json({ error: 'Payment failed' });
  }
});

app.post('/api/payments/confirm', async (req, res) => {
  try {
    const { orderId, method, reference } = req.body;
    const orders = await loadOrders();
    const idx = orders.findIndex(o => o.id === orderId && o.type === 'payment');
    if (idx === -1) return res.status(404).json({ error: 'Order not found' });

    orders[idx].status = 'completed';
    orders[idx].method = method;
    orders[idx].reference = reference;
    orders[idx].paidAt = new Date().toISOString();
    await saveOrders(orders);

    res.json({ success: true, message: 'Payment confirmed' });
  } catch (err) {
    res.status(500).json({ error: 'Confirmation failed' });
  }
});

// ========================================
// AI GENERATION ENGINE
// ========================================

async function generateConceptsForOrder(order) {
  try {
    const orders = await loadOrders();
    const idx = orders.findIndex(o => o.id === order.id);
    if (idx === -1) return;

    orders[idx].status = 'generating';
    orders[idx].updatedAt = new Date().toISOString();
    await saveOrders(orders);

    console.log(`[AI] Starting generation for order ${order.id}`);
    
    const result = await orchestrator.generate(order.brief, {
      orderId: order.id,
      onLog: async (log) => {
        const current = await loadOrders();
        const i = current.findIndex(o => o.id === order.id);
        if (i !== -1) {
          current[i].aiLogs = current[i].aiLogs || [];
          current[i].aiLogs.push({
            timestamp: new Date().toISOString(),
            ...log
          });
          await saveOrders(current);
        }
      }
    });

    const final = await loadOrders();
    const fi = final.findIndex(o => o.id === order.id);
    if (fi !== -1) {
      final[fi].status = 'completed';
      final[fi].concepts = result.concepts;
      final[fi].aiAnalysis = result.analysis;
      final[fi].updatedAt = new Date().toISOString();
      await saveOrders(final);
    }

    console.log(`[AI] Completed generation for order ${order.id}`);
  } catch (err) {
    console.error(`[AI] Generation failed for ${order.id}:`, err);
    const orders = await loadOrders();
    const idx = orders.findIndex(o => o.id === order.id);
    if (idx !== -1) {
      orders[idx].status = 'error';
      orders[idx].error = err.message;
      orders[idx].updatedAt = new Date().toISOString();
      await saveOrders(orders);
    }
  }
}

// ========================================
// STARTUP
// ========================================

async function start() {
  await ensureDataDir();
  app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════╗
║     YH STUDIO BACKEND ONLINE             ║
╠══════════════════════════════════════════╣
║  Port:     ${PORT.toString().padEnd(28)}║
║  Admin:    http://localhost:${PORT}/admin  ║
║  API:      http://localhost:${PORT}/api    ║
╚══════════════════════════════════════════╝
    `);
  });
}

start();
