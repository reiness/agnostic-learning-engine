import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8'));
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const handler = async (event, context) => {
  const { userId } = JSON.parse(event.body);

  try {
    const db = admin.firestore();
    const snapshot = await db.collection('activity_logs').where('userId', '==', userId).get();
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