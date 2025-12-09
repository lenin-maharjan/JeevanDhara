const express = require('express');
const {
    getProfile,
    updateFCMToken,
    getCurrentUser,
    createUserAfterFirebaseSignup,
    linkFirebaseUser
} = require('../controllers/authController');

// Firebase Auth Middleware
const verifyFirebaseToken = require('../middleware/firebaseAuth');
const linkMongoUser = require('../middleware/linkMongoUser');

const router = express.Router();

// =====================================================
// FIREBASE AUTH ENDPOINTS
// =====================================================

// Get current authenticated user (requires Firebase token)
router.get('/me', verifyFirebaseToken, linkMongoUser, getCurrentUser);

// Create user after Firebase signup (requires Firebase token)
router.post('/create-user', verifyFirebaseToken, createUserAfterFirebaseSignup);

// Link existing MongoDB user to Firebase UID (for migration)
router.post('/link-firebase', verifyFirebaseToken, linkFirebaseUser);

// Update FCM token (requires Firebase auth)
router.post('/fcm-token', verifyFirebaseToken, linkMongoUser, updateFCMToken);

// Get user profile by ID (public - for viewing other users)
router.get('/profile/:userType/:userId', getProfile);

module.exports = router;