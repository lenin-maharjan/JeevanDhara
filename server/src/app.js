const express = require('express');
const path = require('path');
const session = require('express-session');
const cors = require('cors');
const compression = require('compression');
const apiRoutes = require('./routes');
const { errorHandler } = require('./utils/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const { checkAdminAuth } = require('./middleware/adminAuthMiddleware');

// Firebase Admin SDK initialization
let firebaseInitialized = false;

try {
  const admin = require('firebase-admin');

  let serviceAccount;

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    serviceAccount = require('../service-account-file.json');
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  global.firebaseAdmin = admin;
  firebaseInitialized = true;
  console.log('✅ Firebase Admin SDK initialized');
} catch (error) {
  console.warn('⚠️ Firebase Admin SDK not initialized:', error.message);
}

const app = express();

// Security & Performance Middleware
app.use(compression()); // Compress responses
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://jeevan-dhara-s7wo.onrender.com']
    : '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'jeevan-dhara-secret-key-change-this-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Rate limiting
app.use('/api/v1', apiLimiter);

// Request logging in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// Admin Login Routes (public - no auth required)
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;

  const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    res.json({ message: 'Login successful' });
  } else {
    res.status(401).json({ message: 'Invalid username or password' });
  }
});

app.post('/admin/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.json({ message: 'Logout successful' });
  });
});

// Admin login page (public - no auth required)
app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

// Admin dashboard route (protected)
app.get('/admin/dashboard', checkAdminAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Redirect /admin to login or dashboard based on auth status
app.get('/admin', (req, res) => {
  if (req.session && req.session.isAdmin) {
    res.redirect('/admin/dashboard');
  } else {
    res.redirect('/admin/login');
  }
});

// Serve static files for admin panel
app.use('/admin', express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/v1', apiRoutes);

// Error handler
app.use(errorHandler);

module.exports = app;
