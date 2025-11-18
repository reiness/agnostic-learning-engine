import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString());
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    process.exit(1);
  }
}

const db = getFirestore();

/**
 * Calculates the total number of modules and flashcards across all courses.
 * @returns {Promise<{totalModules: number, totalFlashcards: number}>}
 */
async function calculateTotalModulesAndFlashcards() {
  console.log('Calculating total modules and flashcards...');
  let totalModules = 0;
  let totalFlashcards = 0;

  const coursesSnapshot = await db.collection('courses').get();
  for (const courseDoc of coursesSnapshot.docs) {
    const courseData = courseDoc.data();
    totalModules += courseData.moduleCount || 0;
    totalFlashcards += courseData.flashcardCount || 0;
  }
  console.log(`Found ${totalModules} total modules and ${totalFlashcards} total flashcards.`);
  return { totalModules, totalFlashcards };
}

/**
 * Calculates the total number of completed courses.
 * A course is considered complete if all its modules are marked as completed.
 * @returns {Promise<number>}
 */
async function calculateCompletedCourses() {
  console.log('Calculating completed courses...');
  let completedCoursesCount = 0;

  const coursesSnapshot = await db.collection('courses').get();
  for (const courseDoc of coursesSnapshot.docs) {
    const modulesSnapshot = await db.collection('courses').doc(courseDoc.id).collection('modules').get();
    if (modulesSnapshot.empty) {
      continue; // A course with no modules cannot be completed
    }

    const allModulesCompleted = modulesSnapshot.docs.every(moduleDoc => moduleDoc.data().isCompleted === true);
    if (allModulesCompleted) {
      completedCoursesCount++;
    }
  }
  console.log(`Found ${completedCoursesCount} completed courses.`);
  return completedCoursesCount;
}

/**
 * Calculates Daily Active Users (DAU) for a given historical range.
 * @param {Date} startDate - The start date for DAU calculation (inclusive).
 * @param {Date} endDate - The end date for DAU calculation (inclusive).
 * @returns {Promise<Map<string, number>>} A map where keys are 'YYYY-MM-DD' dates and values are DAU counts.
 */
async function calculateDailyActiveUsers(startDate, endDate) {
  console.log(`Calculating Daily Active Users from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}...`);
  const dailyDauData = new Map();
  const allUsersSnapshot = await db.collection('users').get();

  // Iterate day by day
  let currentDate = new Date(startDate);
  currentDate.setUTCHours(0, 0, 0, 0); // Normalize to start of the day UTC

  while (currentDate <= endDate) {
    const nextDate = new Date(currentDate);
    nextDate.setUTCDate(currentDate.getUTCDate() + 1); // Move to the next day

    const startTimestamp = admin.firestore.Timestamp.fromDate(currentDate);
    const endTimestamp = admin.firestore.Timestamp.fromDate(nextDate);

    const activeUsersToday = new Set();
    for (const userDoc of allUsersSnapshot.docs) {
      const userData = userDoc.data();
      if (userData.lastLogin instanceof admin.firestore.Timestamp) {
        if (userData.lastLogin.toDate() >= startTimestamp.toDate() && userData.lastLogin.toDate() < endTimestamp.toDate()) {
          activeUsersToday.add(userDoc.id);
        }
      }
    }
    dailyDauData.set(currentDate.toISOString().split('T')[0], activeUsersToday.size);
    console.log(`DAU for ${currentDate.toISOString().split('T')[0]}: ${activeUsersToday.size}`);
    currentDate = nextDate;
  }
  return dailyDauData;
}

/**
 * Updates the overall totals document in Firestore.
 * @param {number} totalModules
 * @param {number} totalFlashcards
 * @param {number} totalCompletedCourses
 */
async function updateOverallTotals(totalModules, totalFlashcards, totalCompletedCourses) {
  console.log('Updating overall totals in Firestore...');
  const overallTotalsRef = db.collection('adminMetrics').doc('overallTotals');
  await overallTotalsRef.set({
    totalModules,
    totalFlashcards,
    totalCompletedCourses,
    lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  console.log('Overall totals updated successfully.');
}

/**
 * Updates the Daily Active Users (DAU) time-series data in Firestore.
 * @param {Map<string, number>} dailyDauData
 */
async function updateDailyActiveUsers(dailyDauData) {
  console.log('Updating Daily Active Users data in Firestore...');
  const batch = db.batch();
  const dailyActiveUsersCollectionRef = db.collection('adminMetrics').doc('dailyActiveUsers').collection('data');

  for (const [dateString, count] of dailyDauData.entries()) {
    const docRef = dailyActiveUsersCollectionRef.doc(dateString);
    const date = new Date(dateString);
    date.setUTCHours(0, 0, 0, 0); // Normalize to start of the day UTC
    batch.set(docRef, {
      date: dateString,
      count: count,
      timestamp: admin.firestore.Timestamp.fromDate(date),
    }, { merge: true });
  }
  await batch.commit();
  console.log('Daily Active Users data updated successfully.');
}

/**
 * Main function to backfill all admin dashboard metrics.
 */
async function backfillMetrics() {
  console.log('Starting backfill of admin dashboard metrics...');
  try {
    // Calculate and update overall totals
    const { totalModules, totalFlashcards } = await calculateTotalModulesAndFlashcards();
    const totalCompletedCourses = await calculateCompletedCourses();
    await updateOverallTotals(totalModules, totalFlashcards, totalCompletedCourses);

    // Calculate and update DAU
    // Define your historical range for DAU here
    const endDate = new Date();
    endDate.setUTCHours(23, 59, 59, 999); // End of today UTC
    const startDate = new Date();
    startDate.setUTCDate(endDate.getUTCDate() - 30); // Last 30 days
    startDate.setUTCHours(0, 0, 0, 0); // Start of the day UTC

    const dailyDauData = await calculateDailyActiveUsers(startDate, endDate);
    await updateDailyActiveUsers(dailyDauData);

    console.log('Admin dashboard metrics backfill completed successfully!');
  } catch (error) {
    console.error('Error during metrics backfill:', error);
    process.exit(1);
  }
}

// Execute the main backfill function
backfillMetrics();