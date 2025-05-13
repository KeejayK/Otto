const admin = require('../firebase');

async function verifyFirebaseToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const idToken = authHeader.replace('Bearer ', '');

  if (!idToken) {
    return res.status(401).json({ error: 'Missing ID token' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (err) {
    console.error('Error verifying Firebase token:', err);
    res.status(401).json({ error: 'Unauthorized' });
  }
}

module.exports = verifyFirebaseToken;
