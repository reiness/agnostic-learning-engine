import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8'));
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const handler = async (event, context) => {
  // --- Security Check: Validate User Identity ---
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn("Unauthorized access attempt: No Authorization header found.");
    return {
      statusCode: 401,
      body: JSON.stringify({ message: 'You must be logged in.' }),
    };
  }

  const idToken = authHeader.split('Bearer ')[1];
  let verifiedUserId;

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    verifiedUserId = decodedToken.uid;
  } catch (error) {
    console.error("Error verifying auth token:", error);
    return {
      statusCode: 401,
      body: JSON.stringify({ message: 'Invalid authentication token.' }),
    };
  }
  // ----------------------------------------------

  try {
    // Note: We ignore any userId sent in the body and use verifiedUserId
    const db = admin.firestore();
    const snapshot = await db.collection('activity_logs').where('userId', '==', verifiedUserId).get();
    const count = snapshot.size;

    return {
      statusCode: 200,
      body: JSON.stringify({ count }),
    };
  } catch (error) {
    console.error('Error fetching activity log count:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch activity log count' }),
    };
  }
};