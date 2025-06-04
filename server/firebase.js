const admin = require('firebase-admin');


const base64Json = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
if (!base64Json) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 is not defined');
}

const serviceAccount = JSON.parse(
  Buffer.from(base64Json, 'base64').toString('utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
