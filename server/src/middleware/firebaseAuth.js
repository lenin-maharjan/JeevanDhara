/**
 * Firebase Authentication Middleware
 * Verifies Firebase ID tokens and attaches user info to request
 */

const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    // Check if Firebase Admin SDK is initialized
    if (!global.firebaseAdmin) {
      console.error('Firebase Admin SDK is not initialized. Missing service account credentials.');
      return res.status(503).json({
        message: 'Authentication service unavailable. Please contact support.',
        code: 'AUTH_CONFIG_MISSING'
      });
    }

    // Verify the Firebase ID token
    const decodedToken = await global.firebaseAdmin.auth().verifyIdToken(idToken);

    // Attach user info to request
    req.firebaseUser = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
    };

    next();
  } catch (error) {
    console.error('Firebase token verification failed:', error.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = verifyFirebaseToken;
