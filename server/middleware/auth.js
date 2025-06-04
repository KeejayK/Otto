const admin = require('../firebase'); // Import Firebase Admin SDK

// Express middleware to verify Firebase ID token

async function verifyFirebaseToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const idToken = authHeader.replace('Bearer ', '');

  if (!idToken) {
    // No ID token provided
    return res.status(401).json({ error: 'Missing ID token' });
  }

  try {
    // Verify the ID token using Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken; // Attach the decoded token to the request object
    next();
  } catch (err) {
    // Token verification failed
    console.error('Error verifying Firebase token:', err);
    res.status(401).json({ error: 'Unauthorized' });
  }
}

module.exports = verifyFirebaseToken; // Export the middleware function
