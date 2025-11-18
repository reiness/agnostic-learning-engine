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
  try {
    // 1. Total Users Count
    const usersSnapshot = await db.collection('users').get();
    const totalUsers = usersSnapshot.size;

    // 2. Total Generated Courses
    const coursesSnapshot = await db.collection('courses').get();
    const totalCourses = coursesSnapshot.size;

    // 3. Total Generated Modules & Flashcards
    let totalModules = 0;
    let totalFlashcards = 0;

    for (const courseDoc of coursesSnapshot.docs) {
      const courseData = courseDoc.data();
      totalModules += courseData.moduleCount || 0;
      totalFlashcards += courseData.flashcardCount || 0;
    }

    // 4. Total Completed Courses (assuming a 'user_courses' collection with a 'completed' field)
    // This is a placeholder and might need adjustment based on actual schema
    const completedCoursesSnapshot = await db.collection('user_courses').where('completed', '==', true).get();
    const totalCompletedCourses = completedCoursesSnapshot.size;

    // 5. Daily Active Users (DAU)
    // Assuming 'lastLogin' field exists in 'users' collection and is a Firestore Timestamp
    const twentyFourHoursAgo = admin.firestore.Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000);
    const dauSnapshot = await db.collection('users').where('lastLogin', '>=', twentyFourHoursAgo).get();
    const dailyActiveUsers = dauSnapshot.size;

    return {
      statusCode: 200,
      body: JSON.stringify({
        totalUsers,
        totalCourses,
        totalModules,
        totalFlashcards,
        totalCompletedCourses,
        dailyActiveUsers,
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