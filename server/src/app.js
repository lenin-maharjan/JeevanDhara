const express = require('express');
const cors = require('cors');
const compression = require('compression');
const apiRoutes = require('./routes');
const { errorHandler } = require('./utils/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

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

// Rate limiting
app.use('/api/v1', apiLimiter);

// Request logging in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// API Routes
app.use('/api/v1', apiRoutes);

// Error handler
app.use(errorHandler);

module.exports = app;
