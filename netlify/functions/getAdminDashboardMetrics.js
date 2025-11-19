import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString());
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = getFirestore();

export const handler = async (event, context) => {
  // --- Security Check: Validate User Identity ---
  // Check for the Authorization header
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn("Unauthorized access attempt: No Authorization header found.");
    return {
      statusCode: 401,
      body: JSON.stringify({ message: 'You must be logged in.' }),
    };
  }

  const idToken = authHeader.split('Bearer ')[1];
  let user;

  try {
    user = await admin.auth().verifyIdToken(idToken);
  } catch (error) {
    console.error("Error verifying auth token:", error);
    return {
      statusCode: 401,
      body: JSON.stringify({ message: 'Invalid authentication token.' }),
    };
  }

  if (!user) {
    console.warn("Unauthorized access attempt: No user verified.");
    return {
      statusCode: 401,
      body: JSON.stringify({ message: 'You must be logged in.' }),
    };
  }
  // ----------------------------------------------

  try {
    const { days: daysParam } = event.queryStringParameters || {};
    const days = parseInt(daysParam, 10); // Can be 7, 30, 90, or 0 for lifetime

    let historicalData = [];
    let lifetimeMetrics = {};

    if (days > 0) {
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Normalize to start of today

      const startDate = new Date(now);
      startDate.setDate(now.getDate() - (days - 1));
      const startTimestamp = admin.firestore.Timestamp.fromDate(startDate);

      const dailyMetricsSnapshot = await db.collection('daily_metrics')
        .where('aggregatedAt', '>=', startTimestamp)
        .orderBy('aggregatedAt', 'asc')
        .get();

      historicalData = dailyMetricsSnapshot.docs.map(doc => doc.data());
    } else {
      // Lifetime metrics calculation
      const dailyMetricsSnapshot = await db.collection('daily_metrics').orderBy('aggregatedAt', 'asc').get();
      historicalData = dailyMetricsSnapshot.docs.map(doc => doc.data());

      lifetimeMetrics = {
        totalNewUsers: historicalData.reduce((acc, curr) => acc + curr.newUsers, 0),
        totalActiveUsers: historicalData.reduce((acc, curr) => acc + curr.activeUsers, 0),
        totalGeneratedCourses: historicalData.reduce((acc, curr) => acc + curr.generatedCourses, 0),
      };
    }

    // Current Metrics (existing logic)
    const usersSnapshot = await db.collection('users').get();
    const totalUsers = usersSnapshot.size;

    const coursesSnapshot = await db.collection('courses').get();
    const totalCourses = coursesSnapshot.size;

    let totalModules = 0;
    let totalFlashcards = 0;

    for (const courseDoc of coursesSnapshot.docs) {
      const courseData = courseDoc.data();
      totalModules += courseData.moduleCount || 0;
      totalFlashcards += courseData.flashcardCount || 0;
    }

    const completedCoursesSnapshot = await db.collection('user_courses').where('completed', '==', true).get();
    const totalCompletedCourses = completedCoursesSnapshot.size;

    // Daily Active Users (for current day, as per original logic)
    const twentyFourHoursAgo = admin.firestore.Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000);
    const currentDailyActiveUsersSnapshot = await db.collection('users').where('lastLogin', '>=', twentyFourHoursAgo).get();
    const currentDailyActiveUsers = currentDailyActiveUsersSnapshot.size;

    return {
      statusCode: 200,
      body: JSON.stringify({
        totalUsers,
        totalCourses,
        totalModules,
        totalFlashcards,
        totalCompletedCourses,
        dailyActiveUsers: currentDailyActiveUsers,
        historicalData,
        lifetimeMetrics,
      }),
    };
  } catch (error) {
    console.error('Error fetching admin dashboard metrics:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch admin dashboard metrics' }),
    };
  }
};