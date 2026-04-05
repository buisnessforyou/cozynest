require('dotenv').config();
const express    = require('express');
const path       = require('path');
const fs         = require('fs');
const cors       = require('cors');

const app        = express();
const PORT       = process.env.PORT || 3001;
const DEMO_MODE  = !process.env.STRIPE_SECRET_KEY;

// ─── Stripe setup ────────────────────────────────────────────
let stripe;
if (!DEMO_MODE) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
}

// ─── Middleware ───────────────────────────────────────────────
// Raw body needed for Stripe webhooks BEFORE json parser
app.use('/api/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(cors());

// Serve the Cozynest frontend
app.use(express.static(path.join(__dirname, '../cozynest')));

// ─── Orders storage (JSON file) ──────────────────────────────
// Use /tmp on Netlify (serverless), local file otherwise
const ORDERS_FILE = process.env.NETLIFY
  ? '/tmp/orders.json'
  : path.join(__dirname, 'orders.json');

function getOrders() {
  if (!fs.existsSync(ORDERS_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8')); }
  catch { return []; }
}

function saveOrder(order) {
  const orders = getOrders();
  orders.unshift(order); // newest first
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
  return order;
}

// ─── Helper: calculate totals ────────────────────────────────
function calcTotals(items) {
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping  = subtotal >= 75 ? 0 : 8.95;
  const total     = parseFloat((subtotal + shipping).toFixed(2));
  return { subtotal, shipping, total };
}

// ════════════════════════════════════════════════════════════
//  API ROUTES
// ════════════════════════════════════════════════════════════

// ── POST /api/create-payment-intent ─────────────────────────
//    Called when checkout opens — returns clientSecret (or demoMode flag)
app.post('/api/create-payment-intent', async (req, res) => {
  const { items } = req.body;
  if (!items || !items.length) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  const { total } = calcTotals(items);
  const amountCents = Math.round(total * 100);

  if (DEMO_MODE) {
    return res.json({ demoMode: true, total, amountCents });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount:   amountCents,
      currency: 'gbp',
      automatic_payment_methods: { enabled: true },
      metadata: {
        items: JSON.stringify(items.map(i => `${i.name} x${i.qty}`))
      }
    });
    res.json({ clientSecret: paymentIntent.client_secret, total, amountCents });
  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/orders ─────────────────────────────────────────
//    Save order after successful payment
app.post('/api/orders', (req, res) => {
  const { items, customer, paymentIntentId } = req.body;
  if (!items || !customer) {
    return res.status(400).json({ error: 'Missing items or customer' });
  }

  const { subtotal, shipping, total } = calcTotals(items);
  const order = {
    id:              'CN-' + Math.floor(100000 + Math.random() * 900000),
    createdAt:       new Date().toISOString(),
    status:          'confirmed',
    items,
    customer,
    subtotal,
    shipping,
    total,
    paymentIntentId: paymentIntentId || 'demo',
    demoMode:        DEMO_MODE
  };

  saveOrder(order);
  console.log(`✅ Order ${order.id} — $${order.total} — ${customer.email}`);
  res.json(order);
});

// ── GET /api/orders ──────────────────────────────────────────
//    Admin: list all orders
app.get('/api/orders', (req, res) => {
  res.json(getOrders());
});

// ── GET /api/orders/:id ──────────────────────────────────────
app.get('/api/orders/:id', (req, res) => {
  const order = getOrders().find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

// ── GET /api/status ──────────────────────────────────────────
app.get('/api/status', (req, res) => {
  res.json({
    status:    'ok',
    demoMode:  DEMO_MODE,
    orders:    getOrders().length,
    stripeKey: DEMO_MODE ? null : process.env.STRIPE_PUBLISHABLE_KEY
  });
});

// ── POST /api/webhook ────────────────────────────────────────
//    Stripe webhook: update order status on payment events
app.post('/api/webhook', (req, res) => {
  if (DEMO_MODE) return res.json({ received: true });

  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi     = event.data.object;
    const orders = getOrders();
    const order  = orders.find(o => o.paymentIntentId === pi.id);
    if (order) {
      order.status = 'paid';
      fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
      console.log(`💰 Payment confirmed for ${order.id}`);
    }
  }

  res.json({ received: true });
});

// ── Fallback: serve frontend for any non-API route ───────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../cozynest/index.html'));
});

// ═══════════════════════════════════════════════════════════
// Export app for Netlify Functions / serverless use
module.exports = app;

// Only start the HTTP server when run directly (node server.js)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log('');
    console.log('  ╔══════════════════════════════════════╗');
    console.log('  ║   🏡  Cozynest Backend  v1.0          ║');
    console.log(`  ║   http://localhost:${PORT}               ║`);
    console.log(`  ║   Mode: ${DEMO_MODE ? '🟡 DEMO (no payments)   ' : '🟢 LIVE (Stripe active) '}  ║`);
    console.log('  ╚══════════════════════════════════════╝');
    console.log('');
    if (DEMO_MODE) {
      console.log('  ℹ  Add STRIPE_SECRET_KEY to .env for real payments');
      console.log('');
    }
  });
}
