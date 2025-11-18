import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString());
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = getFirestore();
const auth = getAuth();

export const handler = async (event, context) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of today
    const startOfDay = admin.firestore.Timestamp.fromDate(today);
    const endOfDay = admin.firestore.Timestamp.fromDate(new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1));

    // 1. Daily New Users
    // Query Firebase Auth for users created today
    const newUsersSnapshot = await db.collection('users')
      .where('createdAt', '>=', startOfDay)
      .where('createdAt', '<=', endOfDay)
      .get();
    const dailyNewUsers = newUsersSnapshot.size;

    // 2. Daily Active Users (based on lastLogin in Firestore 'users' collection)
    const activeUsersSnapshot = await db.collection('users')
      .where('lastLogin', '>=', startOfDay)
      .where('lastLogin', '<=', endOfDay)
      .get();
    const dailyActiveUsers = activeUsersSnapshot.size;

    // 3. Daily Generated Courses (based on createdAt in 'courses' collection)
    const newCoursesSnapshot = await db.collection('courses')
      .where('createdAt', '>=', startOfDay)
      .where('createdAt', '<=', endOfDay)
      .get();
    const dailyGeneratedCourses = newCoursesSnapshot.size;

    // Store aggregated data in 'daily_metrics' collection
    const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD
    const dailyMetricsRef = db.collection('daily_metrics').doc(dateString);

    await dailyMetricsRef.set({
      date: dateString,
      newUsers: dailyNewUsers,
      activeUsers: dailyActiveUsers,
      generatedCourses: dailyGeneratedCourses,
      aggregatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true }); // Use merge to update if document already exists

    console.log(`Daily metrics aggregated for ${dateString}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Daily metrics aggregated for ${dateString}` }),
    };
  } catch (error) {
    console.error('Error aggregating daily metrics:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to aggregate daily metrics' }),
    };
  }
};