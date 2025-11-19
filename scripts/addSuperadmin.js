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
 * Sets a user's role to 'Superadmin' in Firestore.
 * @param {string} email The email address of the user to make a Superadmin.
 */
async function setSuperadmin(email) {
  if (!email) {
    console.error('Error: No email provided. Usage: node scripts/addSuperadmin.js your_email@example.com');
    process.exit(1);
  }

  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    const userId = userRecord.uid;
    const userRef = db.collection('users').doc(userId);

    await userRef.set({
      role: 'Superadmin',
    }, { merge: true });

    console.log(`User '${email}' has been granted Superadmin privileges.`);
  } catch (error) {
    console.error(`Error setting Superadmin for '${email}':`, error);
    process.exit(1);
  }
}

// Get email from command line arguments
const emailToSet = process.argv[2];
setSuperadmin(emailToSet);